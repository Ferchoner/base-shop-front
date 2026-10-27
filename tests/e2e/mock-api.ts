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
  { slowReadMs = 0 }: { slowReadMs?: number } = {},
) {
  const CUSTOMER_CART = '00000000-0000-4000-8000-00000000c0de';
  // Lecturas lentas ya respondidas: su carrito es el de antes de las escrituras que llegaron mientras.
  const slowReads = { served: 0 };
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
      if (method === 'GET') {
        const snapshot = toCart(id!);
        if (!slowReadMs) return json(route, 200, snapshot);
        await new Promise((resolve) => setTimeout(resolve, slowReadMs));
        slowReads.served++;
        return json(route, 200, snapshot).catch(() => undefined);
      }
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
  return { carts, created, merges, slowReads, CUSTOMER_CART };
}

const preflight = (route: Route) =>
  route.fulfill({
    status: 204,
    headers: {
      ...cors,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE',
      'Access-Control-Allow-Headers':
        'Content-Type,Accept,Authorization,Idempotency-Key',
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

const problemWith = (
  route: Route,
  status: number,
  type: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) =>
  route.fulfill({
    status,
    contentType: 'application/problem+json',
    headers: { ...cors, ...headers },
    body: JSON.stringify({
      type: `/problems/${type}`,
      title: type,
      status,
      correlationId: 'e2e-correlation',
      ...extra,
    }),
  });

export const ORDER_CODE = 'K7M4-Q9XA';
/** Cupón válido del simulador: 10 % sobre el subtotal. Cualquier otro no aplica. */
export const VALID_COUPON = 'OTONO10';
const SHIPPING = 9900;
const FREE_SHIPPING_FROM = 99900;

export const savedAddress = {
  id: '00000000-0000-4000-8000-0000000ad001',
  isDefault: true,
  recipientName: 'María López',
  phone: '5512345678',
  street: 'Av. Juárez',
  exteriorNumber: '10',
  interiorNumber: null,
  neighborhood: 'Centro',
  postalCode: '06000',
  city: null,
  stateCode: '09',
  stateName: 'Ciudad de México',
  municipalityCode: '015',
  municipalityName: 'Cuauhtémoc',
  country: 'MX',
  references: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

interface CheckoutOptions {
  /** La primera orden responde 409 `total-mismatch` y el envío sube $10 desde entonces. */
  totalChangesOnce?: boolean;
  /** La primera orden responde 409 `idempotency-request-in-progress`. */
  inProgressOnce?: boolean;
  /** El pago manual está deshabilitado (G-03). */
  paymentDisabled?: boolean;
  /** La orden ya no está pendiente al iniciar el pago. */
  orderExpired?: boolean;
  addresses?: (typeof savedAddress)[];
}

/**
 * Checkout y pago de API_SPEC §15.2–15.5 y §16.2 sobre los carritos de `mockCartApi`: cotiza con
 * `VALID_COUPON`, coloca la orden si `expectedTotal` coincide (deja el carrito CHECKED_OUT) e inicia
 * el pago manual. Con el catálogo del INEGI y la libreta del cliente que usa el formulario.
 */
export async function mockCheckoutApi(
  page: Page,
  cartApi: Awaited<ReturnType<typeof mockCartApi>>,
  options: CheckoutOptions = {},
) {
  const quotes: Record<string, unknown>[] = [];
  const orders: { path: string; key: string; body: Record<string, unknown> }[] =
    [];
  const payments: {
    path: string;
    key: string;
    body: Record<string, unknown>;
  }[] = [];
  const addresses = [...(options.addresses ?? [])];
  let shippingExtra = 0;
  const prices = new Map(detail.variants.map((v) => [v.id, v]));

  const quoteOf = (cartId: string, couponCode?: string | null) => {
    const cart = cartApi.carts.get(cartId);
    const lines = (cart?.lines ?? []).map((l) => {
      const v = prices.get(l.variantId)!;
      const sellable = l.sellable ?? true;
      const lineTotal = v.price.amount * l.quantity;
      const discount = couponCode ? Math.round(lineTotal / 10) : 0;
      return {
        variantId: l.variantId,
        options: v.options,
        sku: v.sku,
        productTitle: detail.title,
        quantity: l.quantity,
        sellable,
        canFulfill: l.canFulfill ?? true,
        unitPrice: sellable ? v.price : null,
        lineTotal: sellable ? money(lineTotal) : null,
        discountAmount: sellable ? money(discount) : null,
        taxRateBp: 1600,
        taxAmount: sellable ? money(Math.round((lineTotal * 16) / 116)) : null,
      };
    });
    const subtotal = lines.reduce((n, l) => n + (l.lineTotal?.amount ?? 0), 0);
    const discount = lines.reduce(
      (n, l) => n + (l.discountAmount?.amount ?? 0),
      0,
    );
    const shipping =
      subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING + shippingExtra;
    const grand = subtotal - discount + shipping;
    return {
      lines,
      subtotal: money(subtotal),
      discountTotal: money(discount),
      promotion: couponCode
        ? { id: 'promo-1', code: VALID_COUPON, name: 'Otoño 10 %' }
        : null,
      shippingCost: money(shipping),
      shippingTaxAmount: money(Math.round((shipping * 16) / 116)),
      taxTotal: money(Math.round((grand * 16) / 116)),
      grandTotal: money(grand),
      freeShippingThreshold: money(FREE_SHIPPING_FROM),
      estimatedDelivery: { minBusinessDays: 2, maxBusinessDays: 5 },
      readyToPlace: lines.every((l) => l.sellable && l.canFulfill),
    };
  };

  /** Errores de cotizar o colocar sobre un carrito, como la API. */
  const cartProblem = (route: Route, cartId: string | null) => {
    const cart = cartId ? cartApi.carts.get(cartId) : undefined;
    if (!cart) return problem(route, 404, 'not-found');
    if (cart.status !== 'ACTIVE') return problem(route, 409, 'cart-not-active');
    if (cart.lines.length === 0) return problem(route, 409, 'empty-cart');
    return null;
  };
  const couponProblem = (route: Route, code?: string | null) =>
    code && code.toUpperCase() !== VALID_COUPON
      ? problemWith(route, 409, 'coupon-not-applicable', {
          reason: 'unavailable',
        })
      : null;

  const order = (
    cartId: string,
    body: Record<string, unknown>,
    status = 'PENDING_PAYMENT',
  ) => {
    const q = quoteOf(cartId, body.couponCode as string | undefined);
    return {
      publicCode: ORDER_CODE,
      status,
      contactEmail: (body.contactEmail as string) ?? customerAccount.email,
      itemCount: q.lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: q.subtotal,
      discountTotal: q.discountTotal,
      promotion: q.promotion,
      shippingCost: q.shippingCost,
      shippingTaxAmount: q.shippingTaxAmount,
      taxTotal: q.taxTotal,
      grandTotal: q.grandTotal,
      fulfillment: 'SHIPPING',
      estimatedDelivery: q.estimatedDelivery,
      placedAt: '2026-10-27T18:00:00Z',
      paymentDueAt:
        status === 'PENDING_PAYMENT' ? '2026-10-29T18:00:00Z' : null,
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      expiredAt: status === 'EXPIRED' ? '2026-10-29T18:00:00Z' : null,
      refundedAt: null,
      payment: null,
      shipment: null,
      lines: [],
      shippingAddress: savedAddress,
    };
  };
  let placedFrom: string | null = null;

  await page.route(
    (url) =>
      url.pathname.startsWith('/v1/geo/') ||
      url.pathname.startsWith('/v1/me/addresses') ||
      url.pathname.endsWith('/checkout/quote') ||
      url.pathname.startsWith('/v1/orders') ||
      url.pathname.startsWith('/v1/me/orders'),
    async (route) => {
      const request = route.request();
      const method = request.method();
      if (method === 'OPTIONS') return preflight(route);
      const path = new URL(request.url()).pathname;
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      const key = request.headers()['idempotency-key'] ?? '';
      const isCustomer = path.startsWith('/v1/me/');
      if (isCustomer && !request.headers()['authorization'])
        return problem(route, 401, 'unauthenticated');
      const cartId = isCustomer
        ? cartApi.CUSTOMER_CART
        : ((body.cartId as string | undefined) ?? null);

      if (path === '/v1/geo/states')
        return json(route, 200, {
          data: [
            { code: '09', name: 'Ciudad de México' },
            { code: '14', name: 'Jalisco' },
          ],
        });
      if (path.startsWith('/v1/geo/states/'))
        return json(route, 200, {
          data: path.includes('/09/')
            ? [
                { code: '015', name: 'Cuauhtémoc' },
                { code: '014', name: 'Benito Juárez' },
              ]
            : [{ code: '039', name: 'Guadalajara' }],
        });
      if (path === '/v1/me/addresses') {
        if (method === 'GET') return json(route, 200, { data: addresses });
        const created = {
          ...savedAddress,
          ...body,
          id: `00000000-0000-4000-8000-0000000ad${String(addresses.length + 2).padStart(3, '0')}`,
          isDefault: addresses.length === 0,
        };
        addresses.push(created);
        return json(route, 201, created);
      }
      if (path.endsWith('/checkout/quote')) {
        quotes.push(body);
        return (
          cartProblem(route, cartId) ??
          couponProblem(route, body.couponCode as string | undefined) ??
          json(
            route,
            200,
            quoteOf(cartId!, body.couponCode as string | undefined),
          )
        );
      }
      if (path === '/v1/orders' || path === '/v1/me/orders') {
        orders.push({ path, key, body });
        if (!key) return problem(route, 400, 'idempotency-key-missing');
        if (options.inProgressOnce && orders.length === 1)
          return problemWith(
            route,
            409,
            'idempotency-request-in-progress',
            {},
            {
              'Retry-After': '0',
              'Access-Control-Expose-Headers': 'Retry-After',
            },
          );
        const failure =
          cartProblem(route, cartId) ??
          couponProblem(route, body.couponCode as string | undefined);
        if (failure) return failure;
        const current = quoteOf(cartId!, body.couponCode as string | undefined);
        if (options.totalChangesOnce && shippingExtra === 0) {
          shippingExtra = 1000;
          return problemWith(route, 409, 'total-mismatch', {
            currentTotal: money(current.grandTotal.amount + 1000),
          });
        }
        if (body.expectedTotal !== current.grandTotal.amount)
          return problemWith(route, 409, 'total-mismatch', {
            currentTotal: current.grandTotal,
          });
        const placed = order(cartId!, body);
        cartApi.carts.get(cartId!)!.status = 'CHECKED_OUT';
        if (isCustomer) cartApi.carts.delete(cartApi.CUSTOMER_CART);
        placedFrom = cartId;
        return json(route, 201, placed);
      }
      if (path.endsWith('/payments')) {
        payments.push({ path, key, body });
        if (options.paymentDisabled)
          return problemWith(route, 400, 'validation-error', {
            errors: [
              { field: 'provider', code: 'isEnabledProvider', message: '' },
            ],
          });
        if (!isCustomer && body.cartId !== placedFrom)
          return problem(route, 404, 'not-found');
        if (options.orderExpired)
          return problem(route, 409, 'invalid-state-transition');
        const amount = order(placedFrom!, {}).grandTotal;
        return json(route, payments.length === 1 ? 201 : 200, {
          paymentId: '00000000-0000-4000-8000-00000000fa01',
          provider: 'MANUAL',
          status: 'PENDING',
          amount,
          action: {
            type: 'PAY_IN_STORE',
            orderCode: ORDER_CODE,
            amount,
            instructions: 'Presenta este código en la tienda para pagar.',
          },
        });
      }
      if (path === '/v1/orders/lookup' || path.startsWith('/v1/me/orders/'))
        return json(
          route,
          200,
          order(placedFrom ?? cartApi.CUSTOMER_CART, body, 'EXPIRED'),
        );
      return problem(route, 404, 'not-found');
    },
  );
  return { quotes, orders, payments, addresses };
}

/** Orden de invitado con una camisa azul M de $649.00 (OrderDto, API_SPEC §8.8). */
export function guestOrder(
  status: string,
  publicCode = ORDER_CODE,
  contactEmail = 'ana@example.com',
) {
  const v = detail.variants[1]!;
  const pending = status === 'PENDING_PAYMENT';
  return {
    publicCode,
    status,
    contactEmail,
    itemCount: 1,
    subtotal: v.price,
    discountTotal: money(0),
    promotion: null,
    shippingCost: money(SHIPPING),
    shippingTaxAmount: money(1366),
    taxTotal: money(10317),
    grandTotal: money(v.price.amount + SHIPPING),
    fulfillment: 'SHIPPING',
    estimatedDelivery: { minBusinessDays: 2, maxBusinessDays: 5 },
    placedAt: '2026-10-20T18:00:00Z',
    paymentDueAt: pending ? '2026-10-29T18:00:00Z' : null,
    paidAt: null,
    shippedAt: status === 'SHIPPED' ? '2026-10-22T18:00:00Z' : null,
    deliveredAt: null,
    cancelledAt: status === 'CANCELLED' ? '2026-10-21T18:00:00Z' : null,
    expiredAt: null,
    refundedAt: null,
    payment: pending ? null : { provider: 'MANUAL', status: 'CAPTURED' },
    shipment:
      status === 'SHIPPED'
        ? {
            status: 'DISPATCHED',
            carrierName: 'Estafeta',
            trackingNumber: '123456789',
            ownDelivery: false,
            dispatchedAt: '2026-10-22T18:00:00Z',
            deliveredAt: null,
          }
        : null,
    lines: [
      {
        lineNumber: 1,
        productName: detail.title,
        sku: v.sku,
        variantOptions: v.options,
        quantity: 1,
        unitPrice: v.price,
        lineTotal: v.price,
        discountAmount: money(0),
        taxRateBp: 1600,
        taxAmount: money(8952),
      },
    ],
    shippingAddress: { ...savedAddress, recipientName: 'Ana Ruiz' },
  };
}

/**
 * Pedidos de invitado de API_SPEC §15.5, §15.6 y §14.3: consulta por email y código (sin distinguir
 * mayúsculas), enlace de acceso con `VALID_LINK_TOKEN` y recompra a los carritos de `mockCartApi`.
 */
export async function mockGuestOrdersApi(
  page: Page,
  cartApi: Awaited<ReturnType<typeof mockCartApi>>,
  orders: ReturnType<typeof guestOrder>[],
  { rateLimited = false, skipped = 0 } = {},
) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const find = (body: Record<string, unknown>) => {
    const email = String(body.contactEmail ?? '')
      .trim()
      .toLowerCase();
    const code = String(body.publicCode ?? '')
      .trim()
      .toUpperCase()
      .replace(/^(\w{4})-?(\w{4})$/, '$1-$2');
    return orders.find(
      (o) => o.contactEmail === email && o.publicCode === code,
    );
  };
  const paths = [
    '/v1/orders/lookup',
    '/v1/orders/access-links',
    '/v1/orders/access',
    '/v1/orders/reorder',
  ];
  await page.route(
    (url) => paths.includes(url.pathname),
    async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return preflight(route);
      const path = new URL(request.url()).pathname;
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      calls.push({ path, body });
      if (rateLimited)
        return problemWith(
          route,
          429,
          'rate-limit-exceeded',
          {},
          {
            'Retry-After': '30',
            'Access-Control-Expose-Headers': 'Retry-After',
          },
        );
      switch (path) {
        case '/v1/orders/access-links':
          return route.fulfill({ status: 202, headers: cors });
        case '/v1/orders/access':
          return body.token === VALID_LINK_TOKEN
            ? json(route, 200, {
                contactEmail: 'ana@example.com',
                orders: orders.map(
                  ({ lines: _l, shippingAddress: _a, ...summary }) => summary,
                ),
              })
            : problem(route, 400, 'invalid-or-expired-token');
        case '/v1/orders/lookup': {
          const order = find(body);
          return order
            ? json(route, 200, order)
            : problem(route, 404, 'not-found');
        }
        default: {
          const order = find(body);
          if (!order) return problem(route, 404, 'not-found');
          if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED')
            return problem(route, 409, 'invalid-state-transition');
          let cartId = body.cartId as string | undefined;
          if (cartId) {
            const cart = cartApi.carts.get(cartId);
            if (!cart) return problem(route, 404, 'not-found');
            if (cart.status !== 'ACTIVE')
              return problem(route, 409, 'cart-not-active');
          } else {
            cartId = `00000000-0000-4000-8000-${String(cartApi.carts.size + 1).padStart(12, '0')}`;
            cartApi.carts.set(cartId, { status: 'ACTIVE', lines: [] });
          }
          const cart = cartApi.carts.get(cartId)!;
          const variantId = detail.variants[1]!.id;
          const line = cart.lines.find((l) => l.variantId === variantId);
          if (line) line.quantity = Math.min(30, line.quantity + 1);
          else cart.lines.push({ variantId, quantity: 1 });
          return json(route, 200, {
            cartId,
            skippedVariantIds: Array.from(
              { length: skipped },
              (_, i) => `00000000-0000-4000-8000-0000000005k${i}`,
            ),
          });
        }
      }
    },
  );
  return { calls };
}
