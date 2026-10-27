import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  customerAccount,
  detail,
  expectAccessible,
  mockCartApi,
  mockProductDetail,
  mockSessionApi,
} from './mock-api';

const CART_KEY = 'base-shop-front.cartId';
const TOKEN_KEY = 'base-shop-front.refreshToken';
const GUEST = '00000000-0000-4000-8000-000000000777';
const azulM = detail.variants[1]!.id;
const rojoM = detail.variants[2]!.id;

async function login(page: Page, password = 'correcta') {
  await page.getByLabel('Email').fill('maria@example.com');
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();
}

const stored = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), key);

test.describe('sesión del cliente (REQUIREMENTS §4.5, §5.8)', () => {
  test('inicia sesión, fusiona el carrito de invitado y regresa al carrito', async ({
    page,
  }) => {
    await mockSessionApi(page);
    const api = await mockCartApi(
      page,
      { [GUEST]: { lines: [{ variantId: azulM, quantity: 2 }] } },
      [{ variantId: azulM, quantity: 29 }],
    );
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k!, v!),
      [CART_KEY, GUEST],
    );
    await page.goto('/cart');
    await expect(
      page.getByRole('link', { name: 'Carrito, 2 artículos' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=\/cart$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeVisible();
    await expectAccessible(page);
    await login(page);

    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByText(
        'Combinamos los productos de tu carrito con los de tu cuenta.',
        { exact: true },
      ),
    ).toBeVisible();
    // La API suma con tope de 30 sin avisar (§4.5).
    await expect(
      page.getByRole('link', { name: 'Carrito, 30 artículos' }),
    ).toBeVisible();
    expect(api.merges).toEqual([GUEST]);
    expect(await stored(page, CART_KEY)).toBeNull();
    expect(await stored(page, TOKEN_KEY)).toBe('rt_1');
    await expect(page.getByRole('link', { name: 'Mi cuenta' })).toBeVisible();
  });

  test('credenciales inválidas muestran un solo mensaje', async ({ page }) => {
    await mockSessionApi(page);
    await page.goto('/login');
    await login(page, 'incorrecta');
    await expect(page.getByRole('alert')).toHaveText(
      'El email o la contraseña no son correctos.',
    );
    expect(await stored(page, TOKEN_KEY)).toBeNull();
  });

  test('una cuenta de staff ve el aviso y queda sin sesión (§1)', async ({
    page,
  }) => {
    const auth = await mockSessionApi(page, {
      ...customerAccount,
      type: 'STAFF',
      permissions: ['orders.read'],
    });
    await page.goto('/login');
    await login(page);
    await expect(page.getByRole('alert')).toContainText(
      'Las cuentas de personal no compran en la tienda en línea',
    );
    await expect(page).toHaveURL(/\/login$/);
    expect(await stored(page, TOKEN_KEY)).toBeNull();
    expect(auth.calls).toContain('POST /v1/auth/logout');
    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' }),
    ).toBeVisible();
  });

  test('Mi cuenta pide sesión, regresa después del login y se recupera al recargar', async ({
    page,
  }) => {
    const auth = await mockSessionApi(page);
    await mockCartApi(page);
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login\?redirect=\/account$/);
    await login(page);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mi cuenta' }),
    ).toBeVisible();
    await expect(page.getByText('María López Hernández')).toBeVisible();
    await expectAccessible(page);

    await page.reload();
    await expect(page.getByText('maria@example.com')).toBeVisible();
    expect(auth.calls).toContain('POST /v1/auth/refresh');
    expect(await stored(page, TOKEN_KEY)).toBe('rt_2');

    // Con sesión, /login lleva al inicio.
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);
  });

  test('el cliente agrega a su carrito y cierra sesión en todas las pestañas', async ({
    page,
    context,
  }) => {
    // Las dos pestañas comparten la API simulada, como comparten la real.
    const auth = await mockSessionApi(context);
    const api = await mockCartApi(context);
    await mockProductDetail(page);
    await page.goto('/login?redirect=/products/camisa-lino');
    await login(page);
    await expect(page).toHaveURL(/\/products\/camisa-lino$/);
    await page.getByRole('radio', { name: 'Rojo' }).click();
    await page.getByRole('radio', { name: 'M' }).click();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(
      page.getByRole('link', { name: 'Carrito, 1 artículo' }),
    ).toBeVisible();
    expect(api.created).toHaveLength(0);
    expect(api.carts.get(api.CUSTOMER_CART)?.lines).toEqual([
      { variantId: rojoM, quantity: 1 },
    ]);

    const other = await context.newPage();
    await other.goto('/account');
    await expect(
      other.getByRole('heading', { level: 1, name: 'Mi cuenta' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Carrito, 0 artículos' }),
    ).toBeVisible();
    expect(auth.calls).toContain('POST /v1/auth/logout');
    expect(await stored(page, TOKEN_KEY)).toBeNull();
    // La otra pestaña se entera por el evento storage y deja la página que pide sesión.
    await expect(other).toHaveURL(/\/login\?redirect=\/account$/);
  });
});
