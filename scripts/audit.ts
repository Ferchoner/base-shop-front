// Dependency audit (ADR-F011): runs `npm audit` and fails on high and critical advisories, except the
// reviewed ones in audit-exceptions.json. An exception names one advisory, says why it does not reach
// the store and has a review date; once that date passes the audit fails again, so it gets reviewed.
//   node scripts/audit.ts
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export interface AuditException {
  /** GitHub advisory URL, as `npm audit --json` reports it. */
  url: string;
  package: string;
  reason: string;
  /** YYYY-MM-DD. */
  reviewBy: string;
}

interface Advisory {
  url: string;
  severity: string;
  title: string;
  name: string;
}

interface AuditReport {
  vulnerabilities?: Record<string, { via: Array<string | Advisory> }>;
}

const BLOCKING = new Set(['high', 'critical']);

/** The high and critical advisories in the report, each once. */
export function advisories(report: AuditReport): Advisory[] {
  const found = new Map<string, Advisory>();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via === 'object' && BLOCKING.has(via.severity))
        found.set(via.url, via);
    }
  }
  return [...found.values()];
}

/** What fails the audit: advisories without an exception, and exceptions past their review date. */
export function blockingFindings(
  report: AuditReport,
  exceptions: AuditException[],
  today: string,
): string[] {
  const byUrl = new Map(
    exceptions.map((exception) => [exception.url, exception]),
  );
  const findings: string[] = [];
  for (const advisory of advisories(report)) {
    const exception = byUrl.get(advisory.url);
    if (!exception) {
      findings.push(
        `${advisory.severity}: ${advisory.name}, ${advisory.title} (${advisory.url})`,
      );
    } else if (exception.reviewBy < today) {
      findings.push(
        `exception past its review date (${exception.reviewBy}): ${advisory.name} (${advisory.url})`,
      );
    }
  }
  return findings;
}

function main(): void {
  const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' });
  if (!audit.stdout) {
    console.error(audit.stderr);
    process.exit(1);
  }
  const report = JSON.parse(audit.stdout) as AuditReport;
  const exceptions = JSON.parse(
    readFileSync(new URL('../audit-exceptions.json', import.meta.url), 'utf8'),
  ) as AuditException[];
  const today = new Date().toISOString().slice(0, 10);

  const findings = blockingFindings(report, exceptions, today);
  const unused = exceptions.filter(
    (exception) =>
      !advisories(report).some((advisory) => advisory.url === exception.url),
  );
  for (const exception of unused) {
    console.warn(
      `Exception no longer needed, remove it: ${exception.package} (${exception.url})`,
    );
  }
  if (findings.length > 0) {
    console.error(findings.join('\n'));
    process.exit(1);
  }
  console.log('No high or critical advisories without a reviewed exception.');
}

if (import.meta.main) main();
