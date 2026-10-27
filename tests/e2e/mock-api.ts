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

const money = (amount: number) => ({ amount, currency: 'MXN' });
export const variant = (
  id: string,
  options: Record<string, string>,
  amount: number,
  available = true,
) => ({
  id: `00000000-0000-0000-0001-${id.padStart(12, '0')}`,
  sku: `SKU-${id}`,
  options,
  price: money(amount),
  compareAtPrice: null,
  available,
});

export const detail = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'camisa-lino',
  title: 'Camisa de lino',
  brand: { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
  fromPrice: money(59900),
  compareAtPrice: null,
  image: null,
  available: true,
  publishedAt: '2026-10-01T00:00:00Z',
  description: 'Fresca para el verano.\n<script>alert(1)</script>',
  categories: [{ id: 'c1', name: 'Camisas', slug: 'camisas' }],
  images: [],
  optionNames: ['color', 'talla'],
  variants: [
    variant('1', { color: 'Azul', talla: 'S' }, 59900),
    variant('2', { color: 'Azul', talla: 'M' }, 64900),
    variant('3', { color: 'Rojo', talla: 'M' }, 59900, false),
  ],
};

/** Simula el detalle de `camisa-lino`. */
export async function mockProductDetail(page: Page, body: unknown = detail) {
  await page.route(`${API}/v1/catalog/products/camisa-lino`, (route) =>
    json(route, 200, body),
  );
}

interface FakeLine {
  variantId: string;
  quantity: number;
  sellable?: boolean;
  canFulfill?: boolean;
}

/**
 * Carrito de invitado en memoria con las reglas de API_SPEC §14.2 que la tienda necesita: crear,
 * leer, agregar sumando con tope de 30, cambiar y quitar.
 */
export async function mockCartApi(
  page: Page,
  initial: Record<string, { status?: string; lines: FakeLine[] }> = {},
) {
  const carts = new Map(
    Object.entries(initial).map(([id, c]) => [
      id,
      { status: c.status ?? 'ACTIVE', lines: [...c.lines] },
    ]),
  );
  const created: string[] = [];
  const prices = new Map(detail.variants.map((v) => [v.id, v]));
  const toCart = (id: string) => {
    const cart = carts.get(id)!;
    const lines = cart.lines.map((l) => {
      const v = prices.get(l.variantId)!;
      const sellable = l.sellable ?? true;
      return {
        variantId: l.variantId,
        quantity: l.quantity,
        product: { id: detail.id, slug: detail.slug, title: detail.title },
        sku: v.sku,
        options: v.options,
        image: null,
        sellable,
        canFulfill: l.canFulfill ?? true,
        unitPrice: sellable ? v.price : null,
        lineTotal: sellable ? money(v.price.amount * l.quantity) : null,
      };
    });
    return {
      id,
      status: cart.status,
      lines,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: money(
        lines.reduce((n, l) => n + (l.lineTotal?.amount ?? 0), 0),
      ),
      lastActivityAt: '2026-10-26T00:00:00Z',
    };
  };
  await page.route(
    (url) => url.pathname.startsWith('/v1/carts'),
    async (route) => {
      const request = route.request();
      const method = request.method();
      if (method === 'OPTIONS')
        return route.fulfill({
          status: 204,
          headers: {
            ...cors,
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE',
            'Access-Control-Allow-Headers': 'Content-Type,Accept',
          },
        });
      const [, , , id, , variantId] = new URL(request.url()).pathname.split(
        '/',
      );
      if (!id && method === 'POST') {
        const newId = `00000000-0000-4000-8000-${String(carts.size + 1).padStart(12, '0')}`;
        carts.set(newId, { status: 'ACTIVE', lines: [] });
        created.push(newId);
        return json(route, 201, toCart(newId));
      }
      const cart = id ? carts.get(id) : undefined;
      if (!cart) return problem(route, 404, 'not-found');
      if (method === 'GET') return json(route, 200, toCart(id!));
      if (cart.status !== 'ACTIVE')
        return problem(route, 409, 'cart-not-active');
      const body = request.postDataJSON() as {
        variantId?: string;
        quantity?: number;
      } | null;
      if (method === 'POST') {
        const line = cart.lines.find((l) => l.variantId === body!.variantId);
        const quantity = (line?.quantity ?? 0) + body!.quantity!;
        if (quantity > 30)
          return route.fulfill({
            status: 400,
            contentType: 'application/problem+json',
            headers: cors,
            body: JSON.stringify({
              type: '/problems/validation-error',
              title: 'validation-error',
              status: 400,
              errors: [
                { field: 'quantity', code: 'lineQuantity', message: '' },
              ],
            }),
          });
        if (line) line.quantity = quantity;
        else cart.lines.push({ variantId: body!.variantId!, quantity });
      } else if (method === 'PATCH') {
        const line = cart.lines.find((l) => l.variantId === variantId);
        if (!line) return problem(route, 404, 'not-found');
        line.quantity = body!.quantity!;
      } else if (method === 'DELETE') {
        cart.lines = cart.lines.filter((l) => l.variantId !== variantId);
      }
      return json(route, 200, toCart(id!));
    },
  );
  return { carts, created };
}
