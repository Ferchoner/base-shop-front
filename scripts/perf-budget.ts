// Performance budget (REQUIREMENTS §6.2, ADR-F012, TF-015): measures the production build the way the
// sprint closes did and fails when a cap is passed.
//   npm run build && node scripts/perf-budget.ts
// It serves .output/public with gzip, simulates the catalog API with a fixed delay and runs Lighthouse
// (mobile profile, simulated throttling) RUNS times per page, keeping the median. Chromium comes from
// CHROME_PATH or, without it, from Playwright.
import { spawn, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

export interface Budget {
  path: string;
  /** Local LCP cap in ms (ADR-F012). */
  lcpMs: number;
}

/** The pages and caps of ADR-F012. The simulated products have no images, so G-02 does not apply. */
export const PAGES: Budget[] = [
  { path: '/', lcpMs: 3000 },
  { path: '/products', lcpMs: 4000 },
  { path: '/products/producto-1', lcpMs: 4000 },
];
export const MAX_CLS = 0.1;
export const MAX_INITIAL_JS_KB = 200;
export const MAX_PAGE_JS_KB = 80;

const API_PORT = 3000;
const WEB_PORT = 4174;
const API_DELAY_MS = 150;
const RUNS = Number(process.env.PERF_RUNS ?? 3);

export interface PageResult {
  path: string;
  lcpMs: number;
  fcpMs: number;
  tbtMs: number;
  cls: number;
  /** Compressed JavaScript the page loads besides the initial one, in KB. */
  pageJsKb: number;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Initial JavaScript: the scripts and module preloads of the SPA shell (entry plus its chunks). */
export function initialScripts(html: string): string[] {
  const found = [...html.matchAll(/(?:src|href)="(\/_nuxt\/[^"]+\.js)"/g)];
  return [...new Set(found.map((m) => m[1]!))];
}

/** One line per broken rule; empty when everything is within budget. */
export function violations(
  results: PageResult[],
  initialJsKb: number,
): string[] {
  const out: string[] = [];
  if (initialJsKb > MAX_INITIAL_JS_KB)
    out.push(
      `Initial JavaScript ${initialJsKb.toFixed(1)} KB > ${MAX_INITIAL_JS_KB} KB`,
    );
  for (const r of results) {
    const cap = PAGES.find((p) => p.path === r.path)?.lcpMs;
    if (cap !== undefined && r.lcpMs > cap)
      out.push(`${r.path}: LCP ${Math.round(r.lcpMs)} ms > ${cap} ms`);
    if (r.cls > MAX_CLS)
      out.push(`${r.path}: CLS ${r.cls.toFixed(3)} > ${MAX_CLS}`);
    if (r.pageJsKb > MAX_PAGE_JS_KB)
      out.push(
        `${r.path}: page JavaScript ${r.pageJsKb.toFixed(1)} KB > ${MAX_PAGE_JS_KB} KB`,
      );
  }
  return out;
}

// --- Simulated API: just what the three pages read, like the end-to-end mocks. ---

const money = (amount: number) => ({ amount, currency: 'MXN' });
const product = (n: number) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  slug: `producto-${n}`,
  title: `Producto de prueba número ${n}`,
  brand: { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
  fromPrice: money(10000 * n),
  compareAtPrice: n % 3 === 0 ? money(12000 * n) : null,
  image: null,
  available: n % 5 !== 0,
  publishedAt: '2026-10-01T00:00:00Z',
});
const detail = {
  ...product(1),
  description: 'Descripción de prueba.\nCon dos líneas.',
  categories: [{ id: 'c1', name: 'Camisas', slug: 'camisas' }],
  images: [],
  optionNames: ['color', 'talla'],
  variants: ['S', 'M'].map((talla, i) => ({
    id: `00000000-0000-4000-8001-00000000000${i + 1}`,
    sku: `CAM-AZ-${talla}`,
    options: { color: 'Azul', talla },
    price: money(10000 + 2000 * i),
    compareAtPrice: null,
    available: true,
  })),
};

function apiBody(url: URL): unknown {
  switch (url.pathname) {
    case '/v1/catalog/categories':
      return {
        data: ['Camisas', 'Pantalones', 'Zapatos', 'Accesorios'].map(
          (name, i) => ({
            id: `c${i}`,
            name,
            slug: name.toLowerCase(),
            position: i,
            children: [],
          }),
        ),
      };
    case '/v1/catalog/brands':
      return {
        data: [
          { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
          { id: 'b2', name: 'Marca Dos', slug: 'marca-dos' },
        ],
      };
    case '/v1/catalog/products': {
      const size = Number(url.searchParams.get('pageSize') ?? 20);
      return {
        data: Array.from({ length: size }, (_, i) => product(i + 1)),
        meta: {
          page: 1,
          pageSize: size,
          totalItems: 60,
          totalPages: Math.ceil(60 / size),
        },
      };
    }
    default:
      return url.pathname.startsWith('/v1/catalog/products/') ? detail : null;
  }
}

function startApi(): Server {
  return createServer((req, res) => {
    const body = apiBody(new URL(req.url ?? '/', 'http://x'));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    if (body === null) res.statusCode = 404;
    setTimeout(
      () =>
        res.end(
          JSON.stringify(
            body ?? { type: '/problems/not-found', title: '', status: 404 },
          ),
        ),
      API_DELAY_MS,
    );
  }).listen(API_PORT);
}

// --- Static server with gzip and long cache for hashed assets, as a real host would serve it. ---

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function startWeb(root: string): Server {
  return createServer((req, res) => {
    const path = normalize(
      decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname),
    ).replace(/^(\.\.[/\\])+/, '');
    let file = join(root, path);
    if (!existsSync(file) || statSync(file).isDirectory())
      file = join(root, '200.html');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Content-Encoding': 'gzip',
      'Cache-Control': path.startsWith('/_nuxt/')
        ? 'max-age=31536000, immutable'
        : 'no-cache',
    });
    res.end(gzipSync(readFileSync(file)));
  }).listen(WEB_PORT);
}

// --- Lighthouse ---

interface LighthouseReport {
  audits: Record<
    string,
    {
      numericValue?: number;
      details?: {
        items?: Array<{
          url: string;
          resourceType?: string;
          transferSize?: number;
        }>;
      };
    }
  >;
}

function chromePath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = spawnSync(
    process.execPath,
    [
      '-e',
      "process.stdout.write(require('@playwright/test').chromium.executablePath())",
    ],
    { encoding: 'utf8' },
  );
  if (found.status !== 0 || !found.stdout)
    throw new Error("No Chromium: set CHROME_PATH or install Playwright's.");
  return found.stdout;
}

function lighthouse(
  url: string,
  out: string,
  chrome: string,
): Promise<LighthouseReport> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      join('node_modules', '.bin', 'lighthouse'),
      [
        url,
        '--quiet',
        '--only-categories=performance',
        '--chrome-flags=--headless=new --no-sandbox',
        '--output=json',
        `--output-path=${out}`,
      ],
      { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'inherit' },
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve(JSON.parse(readFileSync(out, 'utf8')) as LighthouseReport)
        : reject(new Error(`Lighthouse exited with ${code} on ${url}`)),
    );
  });
}

function pageJsKb(report: LighthouseReport, initial: Set<string>): number {
  const items = report.audits['network-requests']?.details?.items ?? [];
  const bytes = items
    .filter((i) => i.resourceType === 'Script')
    .filter((i) => !initial.has(new URL(i.url).pathname))
    .reduce((n, i) => n + (i.transferSize ?? 0), 0);
  return bytes / 1024;
}

async function main() {
  const root = join(process.cwd(), '.output/public');
  const shell = join(root, '200.html');
  if (!existsSync(shell))
    throw new Error('No build: run `npm run build` first.');
  const initial = initialScripts(readFileSync(shell, 'utf8'));
  const initialJsKb =
    initial.reduce(
      (n, s) => n + gzipSync(readFileSync(join(root, s))).length,
      0,
    ) / 1024;

  const chrome = chromePath();
  const dir = mkdtempSync(join(tmpdir(), 'perf-budget-'));
  const servers = [startApi(), startWeb(root)];
  const results: PageResult[] = [];
  try {
    for (const page of PAGES) {
      const runs: PageResult[] = [];
      for (let i = 0; i < RUNS; i++) {
        const report = await lighthouse(
          `http://localhost:${WEB_PORT}${page.path}`,
          join(dir, `run-${i}.json`),
          chrome,
        );
        const value = (id: string) => report.audits[id]?.numericValue ?? NaN;
        runs.push({
          path: page.path,
          lcpMs: value('largest-contentful-paint'),
          fcpMs: value('first-contentful-paint'),
          tbtMs: value('total-blocking-time'),
          cls: value('cumulative-layout-shift'),
          pageJsKb: pageJsKb(report, new Set(initial)),
        });
      }
      const pick = (key: keyof Omit<PageResult, 'path'>) =>
        median(runs.map((r) => r[key]));
      results.push({
        path: page.path,
        lcpMs: pick('lcpMs'),
        fcpMs: pick('fcpMs'),
        tbtMs: pick('tbtMs'),
        cls: pick('cls'),
        pageJsKb: pick('pageJsKb'),
      });
    }
  } finally {
    for (const s of servers) s.close();
  }

  const lines = [
    `Median of ${RUNS} Lighthouse runs (mobile, simulated throttling). Initial JavaScript: ${initialJsKb.toFixed(1)} KB (cap ${MAX_INITIAL_JS_KB} KB).`,
    '',
    '| Page | LCP (cap) | FCP | TBT | CLS | Page JS |',
    '|---|---|---|---|---|---|',
    ...results.map(
      (r) =>
        `| ${r.path} | ${Math.round(r.lcpMs)} ms (${PAGES.find((p) => p.path === r.path)!.lcpMs}) | ${Math.round(r.fcpMs)} ms | ${Math.round(r.tbtMs)} ms | ${r.cls.toFixed(3)} | ${r.pageJsKb.toFixed(1)} KB |`,
    ),
  ];
  const failed = violations(results, initialJsKb);
  if (failed.length)
    lines.push('', '**Over budget:**', ...failed.map((f) => `- ${f}`));
  const report = lines.join('\n');
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Performance budget\n\n${report}\n`,
    );
  if (failed.length) process.exitCode = 1;
}

if (import.meta.main) await main();
