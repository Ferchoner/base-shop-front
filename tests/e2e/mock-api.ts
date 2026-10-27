import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

/** Debe coincidir con NUXT_PUBLIC_API_BASE_URL del build (por defecto http://localhost:3000). */
export const API = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000';

const cors = { 'Access-Control-Allow-Origin': '*' };

export const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: cors,
    body: JSON.stringify(body),
  });

export const problem = (route: Route, status: number, type: string) =>
  route.fulfill({
    status,
    contentType: 'application/problem+json',
    headers: cors,
    body: JSON.stringify({
      type: `/problems/${type}`,
      title: type,
      status,
      detail: null,
      correlationId: 'e2e-correlation',
    }),
  });

export async function mockCategories(page: Page, status = 200) {
  await page.route(`${API}/v1/catalog/categories`, (route) =>
    status === 200
      ? json(route, 200, {
          data: [
            {
              id: 'c1',
              name: 'Camisas',
              slug: 'camisas',
              position: 1,
              children: [],
            },
          ],
        })
      : problem(route, status, 'internal-error'),
  );
}

/** WCAG 2.2 A y AA con axe (ADR-F008); sin violaciones graves ni críticas (REQUIREMENTS §4.6). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

export const product = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
  slug: `producto-${n}`,
  title: `Producto ${n}`,
  brand: { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
  fromPrice: { amount: 10000 * n, currency: 'MXN' },
  compareAtPrice: null,
  image: null,
  available: true,
  publishedAt: '2026-10-01T00:00:00Z',
  ...extra,
});

export const productPage = (count: number, page = 1, totalItems = count) => ({
  data: Array.from({ length: count }, (_, i) => product(i + 1)),
  meta: {
    page,
    pageSize: 24,
    totalItems,
    totalPages: Math.ceil(totalItems / 24),
  },
});

/**
 * Simula `GET /v1/catalog/products` y guarda cada consulta recibida. `respond` decide la respuesta
 * según los parámetros.
 */
export async function mockProducts(
  page: Page,
  respond: (params: URLSearchParams, route: Route) => Promise<void> | void = (
    _p,
    route,
  ) => json(route, 200, productPage(3)),
) {
  const requests: URLSearchParams[] = [];
  await page.route(
    (url) => url.pathname === '/v1/catalog/products',
    (route) => {
      const params = new URL(route.request().url()).searchParams;
      requests.push(params);
      return respond(params, route);
    },
  );
  return requests;
}

export async function mockBrands(page: Page) {
  await page.route(`${API}/v1/catalog/brands`, (route) =>
    json(route, 200, {
      data: [
        { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
        { id: 'b2', name: 'Marca Dos', slug: 'marca-dos' },
      ],
    }),
  );
}
