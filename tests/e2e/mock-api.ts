import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { BrowserContext, Page, Route } from '@playwright/test';

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
 * Carritos en memoria con las reglas de API_SPEC §14.2 que la tienda necesita: crear, leer, agregar
 * sumando con tope de 30, cambiar y quitar, con las rutas de invitado y las del cliente (`/v1/me/cart`,
 * con `customer` como su carrito), más la fusión del de invitado.
 */
export async function mockCartApi(
  page: Page | BrowserContext,
  initial: Record<string, { status?: string; lines: FakeLine[] }> = {},
  customer: FakeLine[] | null = null,
) {
  const CUSTOMER_CART = '00000000-0000-4000-8000-00000000c0de';
  const merges: string[] = [];
  const carts = new Map(
    Object.entries(initial).map(([id, c]) => [
      id,
      { status: c.status ?? 'ACTIVE', lines: [...c.lines] },
    ]),
  );
  if (customer)
    carts.set(CUSTOMER_CART, { status: 'ACTIVE', lines: [...customer] });
  const created: string[] = [];
  const prices = new Map(detail.variants.map((v) => [v.id, v]));
  const toCart = (id: string | null) => {
    const cart = (id && carts.get(id)) || { status: 'ACTIVE', lines: [] };
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
    (url) =>
      url.pathname.startsWith('/v1/carts') ||
      url.pathname.startsWith('/v1/me/cart'),
    async (route) => {
      const request = route.request();
      const method = request.method();
      if (method === 'OPTIONS') return preflight(route);
      const path = new URL(request.url()).pathname;
      if (path.startsWith('/v1/me/cart')) {
        if (!request.headers()['authorization'])
          return problem(route, 401, 'unauthenticated');
        if (path === '/v1/me/cart/merge') {
          const { guestCartId } = request.postDataJSON() as {
            guestCartId: string;
          };
          merges.push(guestCartId);
          const guest = carts.get(guestCartId);
          if (!guest) return problem(route, 404, 'not-found');
          if (guest.status !== 'ACTIVE')
            return problem(route, 409, 'cart-not-active');
          const own = carts.get(CUSTOMER_CART) ?? {
            status: 'ACTIVE',
            lines: [],
          };
          for (const line of guest.lines) {
            const mine = own.lines.find((l) => l.variantId === line.variantId);
            if (mine)
              mine.quantity = Math.min(30, mine.quantity + line.quantity);
            else own.lines.push({ ...line });
          }
          guest.status = 'MERGED';
          carts.set(CUSTOMER_CART, own);
          return json(route, 200, toCart(CUSTOMER_CART));
        }
        if (method === 'GET')
          return json(
            route,
            200,
            carts.has(CUSTOMER_CART)
              ? toCart(CUSTOMER_CART)
              : { ...toCart(null), id: null, lastActivityAt: null },
          );
        if (!carts.has(CUSTOMER_CART))
          carts.set(CUSTOMER_CART, { status: 'ACTIVE', lines: [] });
      }
      const [, , , id, , variantId] = path.startsWith('/v1/me/cart')
        ? ['', '', '', CUSTOMER_CART, '', path.split('/')[5]]
        : path.split('/');
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
  return { carts, created, merges, CUSTOMER_CART };
}

const preflight = (route: Route) =>
  route.fulfill({
    status: 204,
    headers: {
      ...cors,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,Accept,Authorization',
    },
  });

export const customerAccount = {
  id: '00000000-0000-4000-8000-0000000000a1',
  type: 'CUSTOMER',
  email: 'maria@example.com',
  firstNames: 'María',
  lastNames: 'López Hernández',
  emailVerified: true,
  mustChangePassword: false,
  roles: [],
  permissions: [],
  createdAt: '2026-10-01T00:00:00Z',
};

/**
 * Autenticación de API_SPEC §9.5–9.10 en memoria: la contraseña correcta es `correcta`, cada login o
 * renovación entrega un par nuevo y un refresh token ya usado responde `invalid-refresh-token`. Con
 * el contexto del navegador en vez de la página, todas las pestañas comparten la misma API.
 */
export async function mockSessionApi(
  page: Page | BrowserContext,
  account: Record<string, unknown> = customerAccount,
) {
  let n = 0;
  let current: string | null = null;
  const calls: string[] = [];
  const pair = () => {
    n += 1;
    current = `rt_${n}`;
    return {
      outcome: 'AUTHENTICATED',
      tokenType: 'Bearer',
      accessToken: `at_${n}`,
      accessTokenExpiresIn: 900,
      refreshToken: current,
      refreshTokenExpiresIn: 604800,
      mustChangePassword: false,
    };
  };
  await page.route(
    (url) => url.pathname.startsWith('/v1/auth/') || url.pathname === '/v1/me',
    async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return preflight(route);
      const path = new URL(request.url()).pathname;
      calls.push(`${request.method()} ${path}`);
      const body = request.postDataJSON() as Record<string, string> | null;
      switch (path) {
        case '/v1/auth/login':
          return body?.password === 'correcta'
            ? json(route, 200, pair())
            : problem(route, 401, 'invalid-credentials');
        case '/v1/auth/refresh':
          return body?.refreshToken === current
            ? json(route, 200, pair())
            : problem(route, 401, 'invalid-refresh-token');
        case '/v1/auth/logout':
          current = null;
          return route.fulfill({ status: 204, headers: cors });
        case '/v1/me':
          return request.headers()['authorization']
            ? json(route, 200, account)
            : problem(route, 401, 'unauthenticated');
        default:
          return problem(route, 404, 'not-found');
      }
    },
  );
  return { calls };
}

/** Debe coincidir con NUXT_PUBLIC_PRIVACY_NOTICE_VERSION del build de las pruebas (ci.yml). */
export const PRIVACY_NOTICE_VERSION =
  process.env.NUXT_PUBLIC_PRIVACY_NOTICE_VERSION ?? 'e2e-2026-10';
// Token inventado; .gitleaks.toml lo permite por valor.
export const VALID_LINK_TOKEN = 'q8Xz3Lr0VbN7kT2mWc9YhD4sFj6Ae1Pu5Gi8Ko0RnSv';
export const COMMON_PASSWORD = 'contraseña común de prueba';
export const TAKEN_EMAIL = 'ocupado@example.com';

const policyViolation = (route: Route, field: string) =>
  route.fulfill({
    status: 400,
    contentType: 'application/problem+json',
    headers: cors,
    body: JSON.stringify({
      type: '/problems/password-policy-violation',
      title: 'password-policy-violation',
      status: 400,
      errors: [{ field, code: 'commonPassword', message: 'Texto de la API' }],
    }),
  });

/**
 * Registro, verificación y recuperación de API_SPEC §9.2–9.4 y §9.8–9.9: `TAKEN_EMAIL` ya existe,
 * `COMMON_PASSWORD` viola la política y solo `VALID_LINK_TOKEN` es un enlace vigente.
 */
export async function mockAccountApi(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  const calls: string[] = [];
  await page.route(
    (url) =>
      url.pathname === '/v1/auth/register' ||
      url.pathname.startsWith('/v1/auth/email-verification/') ||
      url.pathname.startsWith('/v1/auth/password-reset/'),
    async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return preflight(route);
      const path = new URL(request.url()).pathname;
      const body = request.postDataJSON() as Record<string, string>;
      calls.push(path);
      bodies.push(body);
      switch (path) {
        case '/v1/auth/register':
          if (body.email === TAKEN_EMAIL)
            return route.fulfill({
              status: 409,
              contentType: 'application/problem+json',
              headers: cors,
              body: JSON.stringify({
                type: '/problems/duplicate-value',
                title: 'duplicate-value',
                status: 409,
                field: 'email',
              }),
            });
          if (body.password === COMMON_PASSWORD)
            return policyViolation(route, 'password');
          return json(route, 201, {
            ...customerAccount,
            email: body.email,
            firstNames: body.firstNames,
            lastNames: body.lastNames,
            emailVerified: false,
          });
        case '/v1/auth/email-verification/confirm':
          return body.token === VALID_LINK_TOKEN
            ? json(route, 200, { emailVerified: true })
            : problem(route, 400, 'invalid-or-expired-token');
        case '/v1/auth/password-reset/confirm':
          if (body.token !== VALID_LINK_TOKEN)
            return problem(route, 400, 'invalid-or-expired-token');
          if (body.newPassword === COMMON_PASSWORD)
            return policyViolation(route, 'newPassword');
          return route.fulfill({ status: 204, headers: cors });
        default:
          // Reenvío y solicitud de recuperación: 202 exista o no el email.
          return route.fulfill({ status: 202, headers: cors });
      }
    },
  );
  return { calls, bodies };
}
