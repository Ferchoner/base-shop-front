// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  initialScripts,
  median,
  violations,
} from '../../../scripts/perf-budget';

const page = (path: string, lcpMs: number, extra = {}) => ({
  path,
  lcpMs,
  fcpMs: 2000,
  tbtMs: 300,
  cls: 0.02,
  pageJsKb: 50,
  ...extra,
});

describe('presupuesto de rendimiento (REQUIREMENTS §6.2, ADR-F012)', () => {
  it('toma la mediana de las corridas', () => {
    expect(median([3900, 3600, 3700])).toBe(3700);
    expect(median([3, 1, 2, 4])).toBe(2.5);
  });

  it('cuenta como JavaScript inicial los scripts y precargas del HTML, una vez cada uno', () => {
    const html =
      '<link rel="modulepreload" href="/_nuxt/a.js"><script type="module" src="/_nuxt/entry.js"></script>' +
      '<link rel="modulepreload" href="/_nuxt/a.js"><link rel="stylesheet" href="/_nuxt/entry.css">';
    expect(initialScripts(html)).toEqual(['/_nuxt/a.js', '/_nuxt/entry.js']);
  });

  it('pasa dentro de los topes', () => {
    expect(
      violations(
        [
          page('/', 2990),
          page('/products', 4000),
          page('/products/producto-1', 3500),
        ],
        199.9,
      ),
    ).toEqual([]);
  });

  it('falla con cada tope que se pasa', () => {
    expect(
      violations(
        [
          page('/', 3001),
          page('/products', 3700, { cls: 0.15 }),
          page('/products/producto-1', 3500, { pageJsKb: 81 }),
        ],
        201,
      ),
    ).toEqual([
      'Initial JavaScript 201.0 KB > 200 KB',
      '/: LCP 3001 ms > 3000 ms',
      '/products: CLS 0.150 > 0.1',
      '/products/producto-1: page JavaScript 81.0 KB > 80 KB',
    ]);
  });
});
