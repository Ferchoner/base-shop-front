// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { blockingFindings } from '../../../scripts/audit';

const advisory = (
  severity: string,
  url = 'https://github.com/advisories/GHSA-1',
) => ({
  url,
  severity,
  title: 'Something',
  name: 'pkg',
});

const report = (...via: unknown[]) =>
  ({ vulnerabilities: { pkg: { via } } }) as never;

const exception = {
  url: 'https://github.com/advisories/GHSA-1',
  package: 'pkg',
  reason: 'Dev only',
  reviewBy: '2026-12-31',
};

describe('auditoría de dependencias (ADR-F011)', () => {
  it('falla con una vulnerabilidad alta o crítica sin excepción', () => {
    expect(
      blockingFindings(report(advisory('high')), [], '2026-10-26'),
    ).toHaveLength(1);
    expect(
      blockingFindings(report(advisory('critical')), [], '2026-10-26'),
    ).toHaveLength(1);
  });

  it('ignora las moderadas, las bajas y las referencias a otros paquetes', () => {
    expect(
      blockingFindings(
        report(advisory('moderate'), advisory('low'), 'other'),
        [],
        '2026-10-26',
      ),
    ).toEqual([]);
  });

  it('acepta una excepción revisada hasta su fecha de revisión', () => {
    expect(
      blockingFindings(report(advisory('high')), [exception], '2026-12-31'),
    ).toEqual([]);
    expect(
      blockingFindings(report(advisory('high')), [exception], '2027-01-01'),
    ).toHaveLength(1);
  });
});
