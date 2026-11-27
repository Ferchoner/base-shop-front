// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  auditCommand,
  blockingFindings,
  readAudit,
} from '../../../scripts/audit';

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

  it('corre npm audit con una shell solo en Windows, donde npm es npm.cmd', () => {
    expect(auditCommand('win32')).toEqual({
      command: 'npm audit --json',
      args: [],
      shell: true,
    });
    expect(auditCommand('linux')).toEqual({
      command: 'npm',
      args: ['audit', '--json'],
      shell: false,
    });
  });

  describe('lectura del resultado de npm audit', () => {
    const run = (overrides: Partial<Parameters<typeof readAudit>[0]> = {}) => ({
      stdout: '',
      stderr: '',
      status: 0,
      ...overrides,
    });

    it('devuelve el informe cuando npm audit lo entrega, aunque salga con 1', () => {
      const stdout = JSON.stringify({ vulnerabilities: {} });
      expect(readAudit(run({ stdout, status: 1 }))).toEqual({
        report: { vulnerabilities: {} },
      });
    });

    it('falla si npm audit responde con un error en JSON, sin dar la auditoría por buena', () => {
      const stdout = JSON.stringify({
        message: 'request to registry failed, reason: connect ECONNREFUSED',
        error: { summary: '', detail: '' },
      });
      expect(readAudit(run({ stdout, status: 1 }))).toEqual({
        failure:
          'npm audit failed: request to registry failed, reason: connect ECONNREFUSED',
      });
    });

    it('falla si el informe no trae vulnerabilidades', () => {
      expect(readAudit(run({ stdout: '{}' }))).toEqual({
        failure: 'npm audit failed: its report has no vulnerabilities field',
      });
    });

    it('muestra el error del proceso, como ENOENT o ENOBUFS, antes que la salida', () => {
      expect(
        readAudit(
          run({ error: new Error('spawnSync npm ENOENT'), stdout: null }),
        ),
      ).toEqual({ failure: 'spawnSync npm ENOENT' });
      expect(
        readAudit(
          run({ error: new Error('spawnSync npm ENOBUFS'), stdout: '{"vul' }),
        ),
      ).toEqual({ failure: 'spawnSync npm ENOBUFS' });
    });

    it('sin salida, muestra stderr o, si está vacío, el código de salida', () => {
      expect(
        readAudit(run({ stderr: "'npm' no se reconoce", status: 1 })),
      ).toEqual({ failure: "'npm' no se reconoce" });
      expect(readAudit(run({ status: 1 }))).toEqual({
        failure: 'npm audit exited with status 1 and no output',
      });
    });

    it('falla con un mensaje claro si la salida no es JSON', () => {
      expect(readAudit(run({ stdout: 'not json', status: 1 }))).toEqual({
        failure: 'npm audit did not return JSON: not json',
      });
    });
  });
});
