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

/**
 * How to run `npm audit --json`. On Windows npm is `npm.cmd`, which Node only runs through a shell;
 * the command is a fixed string, so the shell receives no outside input.
 */
export function auditCommand(platform: NodeJS.Platform = process.platform): {
  command: string;
  args: string[];
  shell: boolean;
} {
  return platform === 'win32'
    ? { command: 'npm audit --json', args: [], shell: true }
    : { command: 'npm', args: ['audit', '--json'], shell: false };
}

/** What `spawnSync` returns for the `npm audit --json` run. */
export interface AuditRun {
  stdout: string | null;
  stderr: string | null;
  status: number | null;
  error?: Error;
}

/**
 * The audit report, or why there is none. `npm audit` exits with 1 whenever it finds anything, so the
 * exit code says nothing; but with `--json` it also writes its own failures (no network, no lockfile)
 * as JSON on stdout. A run without a `vulnerabilities` report must fail: otherwise it would read as
 * "no advisories" and the audit would pass without having audited anything.
 */
export function readAudit(
  run: AuditRun,
): { report: AuditReport } | { failure: string } {
  // A spawn error (ENOENT, ENOBUFS when the output passes maxBuffer) leaves stdout empty or cut.
  if (run.error) return { failure: run.error.message };
  if (!run.stdout) {
    return {
      failure:
        run.stderr ||
        `npm audit exited with status ${run.status} and no output`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(run.stdout);
  } catch {
    return {
      failure: `npm audit did not return JSON: ${(run.stderr || run.stdout).slice(0, 500)}`,
    };
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    'error' in parsed ||
    !('vulnerabilities' in parsed)
  ) {
    const message =
      typeof parsed === 'object' &&
      parsed !== null &&
      'message' in parsed &&
      typeof parsed.message === 'string'
        ? parsed.message
        : 'its report has no vulnerabilities field';
    return { failure: `npm audit failed: ${message}` };
  }
  return { report: parsed as AuditReport };
}

function main(): void {
  const { command, args, shell } = auditCommand();
  const audit = spawnSync(command, args, {
    encoding: 'utf8',
    shell,
    // The default 1 MiB would cut a long report; a cut one fails as ENOBUFS in readAudit.
    maxBuffer: 64 * 1024 * 1024,
  });
  const result = readAudit(audit);
  if ('failure' in result) {
    console.error(result.failure);
    process.exit(1);
  }
  const { report } = result;
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
