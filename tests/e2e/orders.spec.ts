import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  detail,
  expectAccessible,
  guestOrder,
  mockCartApi,
  mockGuestOrdersApi,
  ORDER_CODE,
  VALID_LINK_TOKEN,
} from './mock-api';

const CART_KEY = 'base-shop-front.cartId';
const azulM = detail.variants[1]!.id;

async function lookup(page: Page, email: string, code: string) {
  await page.getByLabel('Email', { exact: false }).first().fill(email);
  await page.getByLabel('Código del pedido').fill(code);
  await page.getByRole('button', { name: 'Consultar' }).click();
}

test.describe('pedidos de invitado (REQUIREMENTS §5.13)', () => {
  test('consulta un pedido pendiente sin dejar datos en la URL ni en el navegador', async ({
    page,
  }) => {
    const carts = await mockCartApi(page);
    const api = await mockGuestOrdersApi(page, carts, [
      guestOrder('PENDING_PAYMENT'),
    ]);
    await page.goto('/');
    await page.getByRole('link', { name: 'Consultar un pedido' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Consultar pedido' }),
    ).toBeVisible();
    await expectAccessible(page);

    await lookup(page, 'Ana@Example.com', 'k7m4q9xa');
    await expect(
      page.getByRole('heading', { name: `Orden ${ORDER_CODE}` }),
    ).toBeVisible();
    await expect(page.getByText('Pendiente de pago')).toBeVisible();
    await expect(
      page.getByText('Las instrucciones de pago están en el correo'),
    ).toBeVisible();
    await expect(
      page.getByText('El estado puede tardar unos segundos en actualizarse.'),
    ).toBeVisible();
    await expect(page.getByText('Camisa de lino')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Volver a comprar' }),
    ).toHaveCount(0);
    await expectAccessible(page);

    expect(api.calls[0]!.body).toEqual({
      contactEmail: 'Ana@Example.com',
      publicCode: 'K7M4Q9XA',
    });
    expect(page.url()).not.toContain('K7M4');
    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain('ana@example.com');
  });

  test('no dice qué dato falló', async ({ page }) => {
    const carts = await mockCartApi(page);
    await mockGuestOrdersApi(page, carts, [guestOrder('PENDING_PAYMENT')]);
    await page.goto('/order-lookup');
    await lookup(page, 'otra@example.com', ORDER_CODE);
    await expect(
      page.getByText('No encontramos un pedido con esos datos.'),
    ).toBeVisible();
  });

  test('espera el Retry-After cuando se agotan los intentos', async ({
    page,
  }) => {
    const carts = await mockCartApi(page);
    await mockGuestOrdersApi(page, carts, [], { rateLimited: true });
    await page.goto('/order-lookup');
    await lookup(page, 'ana@example.com', ORDER_CODE);
    await expect(
      page.getByRole('button', { name: /Espera \d+ s/ }),
    ).toBeDisabled();
  });

  test('pide un enlace si perdió el código', async ({ page }) => {
    const carts = await mockCartApi(page);
    const api = await mockGuestOrdersApi(page, carts, []);
    await page.goto('/order-lookup');
    await page.getByLabel('Email con el que compraste').fill('ana@example.com');
    await page.getByRole('button', { name: 'Enviarme un enlace' }).click();
    await expect(
      page.getByText('Si tienes pedidos, te enviamos un enlace.'),
    ).toBeVisible();
    expect(api.calls).toEqual([
      {
        path: '/v1/orders/access-links',
        body: { contactEmail: 'ana@example.com' },
      },
    ]);
  });

  test('vuelve a comprar una orden cancelada en el carrito actual', async ({
    page,
  }) => {
    const carts = await mockCartApi(page, {
      'cart-1': { lines: [{ variantId: azulM, quantity: 2 }] },
    });
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k!, v!),
      [CART_KEY, 'cart-1'],
    );
    const api = await mockGuestOrdersApi(
      page,
      carts,
      [guestOrder('CANCELLED')],
      { skipped: 1 },
    );
    await page.goto('/order-lookup');
    await lookup(page, 'ana@example.com', ORDER_CODE);
    await expect(page.getByText('Cancelada')).toBeVisible();
    await expect(page.getByText('Tu reembolso está en proceso.')).toBeVisible();
    await page.getByRole('button', { name: 'Volver a comprar' }).click();

    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByText(
        'Agregamos los productos de tu orden al carrito. Uno ya no está a la venta y no se agregó.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Carrito, 3 artículos' }),
    ).toBeVisible();
    expect(api.calls.at(-1)!.body).toMatchObject({ cartId: 'cart-1' });
  });

  test('si el carrito actual ya no sirve, vuelve a comprar en uno nuevo', async ({
    page,
  }) => {
    const carts = await mockCartApi(page, {
      'cart-1': { lines: [{ variantId: azulM, quantity: 2 }] },
    });
    await page.addInitScript(
      ([k, v]) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(k!, v!);
          sessionStorage.setItem('seeded', '1');
        }
      },
      [CART_KEY, 'cart-1'],
    );
    const api = await mockGuestOrdersApi(page, carts, [guestOrder('REFUNDED')]);
    await page.goto('/order-lookup');
    await lookup(page, 'ana@example.com', ORDER_CODE);
    // Otra pestaña colocó una orden con este carrito mientras tanto.
    carts.carts.get('cart-1')!.status = 'CHECKED_OUT';
    await page.getByRole('button', { name: 'Volver a comprar' }).click();
    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('link', { name: 'Carrito, 1 artículo' }),
    ).toBeVisible();
    const reorders = api.calls.filter((c) => c.path === '/v1/orders/reorder');
    expect(reorders.map((c) => c.body.cartId)).toEqual(['cart-1', undefined]);
    expect(
      await page.evaluate((k) => localStorage.getItem(k), CART_KEY),
    ).not.toBe('cart-1');
  });
});

test.describe('enlace de acceso a pedidos (REQUIREMENTS §5.13)', () => {
  test('lista los pedidos del email y abre uno sin poner datos en la URL', async ({
    page,
  }) => {
    const carts = await mockCartApi(page);
    const api = await mockGuestOrdersApi(page, carts, [
      guestOrder('SHIPPED', 'AB12-CD34'),
      guestOrder('PENDING_PAYMENT'),
    ]);
    await page.goto(`/order-access?token=${VALID_LINK_TOKEN}`);
    await expect(page.getByText('Pedidos de ana@example.com')).toBeVisible();
    await expect(page).toHaveURL('/order-access');
    await expectAccessible(page);

    await page
      .getByRole('button', { name: 'Ver detalle del pedido AB12-CD34' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Orden AB12-CD34' }),
    ).toBeVisible();
    await expect(page.getByText('En camino · Estafeta · guía')).toBeVisible();
    expect(api.calls.at(-1)).toEqual({
      path: '/v1/orders/lookup',
      body: { contactEmail: 'ana@example.com', publicCode: 'AB12-CD34' },
    });
    expect(page.url()).not.toContain('AB12');

    await page.getByRole('button', { name: 'Volver a mis pedidos' }).click();
    await expect(
      page.getByRole('button', {
        name: `Ver detalle del pedido ${ORDER_CODE}`,
      }),
    ).toBeVisible();
  });

  test('un enlace vencido ofrece pedir otro', async ({ page }) => {
    const carts = await mockCartApi(page);
    await mockGuestOrdersApi(page, carts, []);
    await page.goto('/order-access?token=vencido');
    await expect(page.getByText('Este enlace ya no sirve.')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enviarme un enlace' }),
    ).toBeVisible();
  });
});
