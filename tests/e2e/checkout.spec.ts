import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  customerAccount,
  detail,
  expectAccessible,
  mockCartApi,
  mockCheckoutApi,
  mockSessionApi,
  ORDER_CODE,
  PRIVACY_NOTICE_VERSION,
  savedAddress,
  VALID_COUPON,
} from './mock-api';

const CART_KEY = 'base-shop-front.cartId';
const azulM = detail.variants[1]!.id;

/** Carrito de invitado con 1 camisa de $649.00: envío $99.00, total $748.00. */
async function guestCart(page: Page) {
  const carts = await mockCartApi(page, {
    'cart-1': { lines: [{ variantId: azulM, quantity: 1 }] },
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
  return carts;
}

async function pick(page: Page, label: string, option: string) {
  await page.getByRole('button', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function fillGuest(page: Page) {
  await page.getByRole('button', { name: 'Continuar como invitado' }).click();
  await page.getByLabel('Email').fill('ana@example.com');
  await page.getByLabel('Nombre de quien recibe').fill('Ana Ruiz');
  await page.getByLabel('Teléfono').fill('5512345678');
  await page.getByLabel('Calle').fill('Av. Juárez');
  await page.getByLabel('Número exterior').fill('10');
  await page.getByLabel('Colonia').fill('Centro');
  await page.getByLabel('Código postal').fill('06000');
  await pick(page, 'Estado', 'Ciudad de México');
  await pick(page, 'Municipio', 'Cuauhtémoc');
  await page
    .getByRole('checkbox', { name: /Acepto el aviso de privacidad/ })
    .check();
}

const placeButton = (page: Page) =>
  page.getByRole('button', { name: 'Colocar pedido' });

test.describe('checkout de invitado (REQUIREMENTS §5.5, §5.6)', () => {
  test('coloca la orden con cupón e inicia el pago en la tienda', async ({
    page,
  }) => {
    const carts = await guestCart(page);
    const api = await mockCheckoutApi(page, carts);
    await page.goto('/cart');
    await page.getByRole('link', { name: 'Continuar al checkout' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Checkout' }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Iniciar sesión' }),
    ).toBeVisible();
    await fillGuest(page);
    const summary = page.getByRole('complementary');
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await expectAccessible(page);

    // Un cupón que no aplica se explica y la cotización sigue sin él.
    await summary.getByLabel('Código del cupón').fill('nada');
    await summary.getByRole('button', { name: 'Aplicar' }).click();
    await expect(summary.getByRole('alert')).toContainText('cupón');
    await summary
      .getByLabel('Código del cupón')
      .fill(VALID_COUPON.toLowerCase());
    await summary.getByRole('button', { name: 'Aplicar' }).click();
    // $649.00 − $64.90 + $99.00
    await expect(
      page.getByText('Total $683.10', { exact: true }),
    ).toBeAttached();

    await placeButton(page).click();
    await expect(
      page.getByRole('heading', { name: '¡Gracias! Tu orden está apartada' }),
    ).toBeVisible();
    await expect(page).toHaveURL('/checkout/done');
    await expect(
      page.getByText('Presenta este código en la tienda para pagar.'),
    ).toBeVisible();
    await expect(page.getByText(ORDER_CODE).first()).toBeVisible();
    await expect(page.getByText('Te enviamos un correo')).toContainText(
      'ana@example.com',
    );
    await expectAccessible(page);

    expect(api.orders).toHaveLength(1);
    expect(api.orders[0]!.path).toBe('/v1/orders');
    expect(api.orders[0]!.key).not.toBe('');
    expect(api.orders[0]!.body).toMatchObject({
      cartId: 'cart-1',
      contactEmail: 'ana@example.com',
      expectedTotal: 68310,
      couponCode: VALID_COUPON,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      shippingAddress: {
        recipientName: 'Ana Ruiz',
        stateCode: '09',
        municipalityCode: '015',
      },
    });
    // El pago se inicia una sola vez, con el carrito de origen.
    expect(api.payments).toHaveLength(1);
    expect(api.payments[0]!.body).toEqual({
      cartId: 'cart-1',
      provider: 'MANUAL',
    });
    expect(
      await page.evaluate((k) => localStorage.getItem(k), CART_KEY),
    ).toBeNull();
    await expect(
      page.getByRole('link', { name: 'Carrito, 0 artículos' }),
    ).toBeVisible();

    // Al recargar ya no hay datos en memoria: el invitado consulta su orden con su email.
    await page.reload();
    await expect(page).toHaveURL('/order-lookup');
  });

  test('avisa si el total cambió y coloca con el nuevo total', async ({
    page,
  }) => {
    const carts = await guestCart(page);
    const api = await mockCheckoutApi(page, carts, { totalChangesOnce: true });
    await page.goto('/checkout');
    await fillGuest(page);
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByText('El total cambió a $758.00. Revisa el resumen'),
    ).toBeVisible();
    await expect(
      page.getByText('Total $758.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByRole('heading', { name: '¡Gracias! Tu orden está apartada' }),
    ).toBeVisible();
    expect(api.orders).toHaveLength(2);
    expect(api.orders[1]!.body.expectedTotal).toBe(75800);
    // Otro total es otro intento: otra llave.
    expect(api.orders[1]!.key).not.toBe(api.orders[0]!.key);
  });

  test('reintenta con la misma llave mientras la orden está en curso', async ({
    page,
  }) => {
    const carts = await guestCart(page);
    const api = await mockCheckoutApi(page, carts, { inProgressOnce: true });
    await page.goto('/checkout');
    await fillGuest(page);
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByRole('heading', { name: '¡Gracias! Tu orden está apartada' }),
    ).toBeVisible();
    expect(api.orders).toHaveLength(2);
    expect(api.orders[1]!.key).toBe(api.orders[0]!.key);
  });

  test('sin pago manual habilitado, la orden queda apartada con su código', async ({
    page,
  }) => {
    const carts = await guestCart(page);
    await mockCheckoutApi(page, carts, { paymentDisabled: true });
    await page.goto('/checkout');
    await fillGuest(page);
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByText('ahora no podemos recibir el pago en línea'),
    ).toBeVisible();
    await expect(
      page.getByText(`Menciona el código ${ORDER_CODE}.`),
    ).toBeVisible();
  });

  test('si la orden ya no admite el pago, muestra su estado', async ({
    page,
  }) => {
    const carts = await guestCart(page);
    await mockCheckoutApi(page, carts, { orderExpired: true });
    await page.goto('/checkout');
    await fillGuest(page);
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByText('Esta orden ya no admite el pago.'),
    ).toBeVisible();
    await expect(
      page.getByText('Estado de la orden: Vencida: no se pagó a tiempo.'),
    ).toBeVisible();
  });

  test('pide los datos que faltan sin llamar a la API', async ({ page }) => {
    const carts = await guestCart(page);
    const api = await mockCheckoutApi(page, carts);
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Continuar como invitado' }).click();
    await expect(
      page.getByText('Total $748.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(page.getByText('Escribe un email válido.')).toBeVisible();
    expect(api.orders).toHaveLength(0);
  });

  test('sin carrito de invitado vuelve al carrito', async ({ page }) => {
    await mockCartApi(page);
    await page.goto('/checkout');
    await expect(page).toHaveURL('/cart');
  });
});

test.describe('checkout del cliente (REQUIREMENTS §5.5, §5.6)', () => {
  async function customerCheckout(
    page: Page,
    account: Record<string, unknown> = customerAccount,
  ) {
    await mockSessionApi(page, account);
    const carts = await mockCartApi(page, {}, [
      { variantId: azulM, quantity: 2 },
    ]);
    const api = await mockCheckoutApi(page, carts, {
      addresses: [savedAddress],
    });
    await page.goto('/login?redirect=/checkout');
    await page.getByLabel('Email').fill('maria@example.com');
    await page.getByLabel('Contraseña').fill('correcta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Checkout' }),
    ).toBeVisible();
    return api;
  }

  test('coloca con una dirección guardada e inicia el pago', async ({
    page,
  }) => {
    const api = await customerCheckout(page);
    await expect(
      page.getByRole('radio', { name: /María López/ }),
    ).toBeChecked();
    // 2 × $649.00, con envío gratis
    await expect(
      page.getByText('Total $1,298.00', { exact: true }),
    ).toBeAttached();
    await expectAccessible(page);
    await placeButton(page).click();
    await expect(
      page.getByRole('heading', { name: '¡Gracias! Tu orden está apartada' }),
    ).toBeVisible();
    expect(api.orders[0]!.path).toBe('/v1/me/orders');
    expect(api.orders[0]!.body).toEqual({
      addressId: savedAddress.id,
      expectedTotal: 129800,
    });
    expect(api.payments[0]!.path).toBe(`/v1/me/orders/${ORDER_CODE}/payments`);
    expect(api.payments[0]!.body).toEqual({ provider: 'MANUAL' });
  });

  test('guarda una dirección nueva y la usa', async ({ page }) => {
    const api = await customerCheckout(page);
    await page.getByRole('radio', { name: 'Otra dirección' }).check();
    await page.getByLabel('Nombre de quien recibe').fill('Luis Pérez');
    await page.getByLabel('Teléfono').fill('3312345678');
    await page.getByLabel('Calle').fill('Av. Vallarta');
    await page.getByLabel('Número exterior').fill('200');
    await page.getByLabel('Colonia').fill('Americana');
    await page.getByLabel('Código postal').fill('44160');
    await pick(page, 'Estado', 'Jalisco');
    await pick(page, 'Municipio', 'Guadalajara');
    await page
      .getByRole('checkbox', { name: 'Guardar esta dirección en mi cuenta' })
      .check();
    await expect(
      page.getByText('Total $1,298.00', { exact: true }),
    ).toBeAttached();
    await placeButton(page).click();
    await expect(
      page.getByRole('heading', { name: '¡Gracias! Tu orden está apartada' }),
    ).toBeVisible();
    expect(api.addresses).toHaveLength(2);
    expect(api.orders[0]!.body).toEqual({
      addressId: api.addresses[1]!.id,
      expectedTotal: 129800,
    });
  });

  test('sin email confirmado no deja colocar', async ({ page }) => {
    const api = await customerCheckout(page, {
      ...customerAccount,
      emailVerified: false,
    });
    await expect(
      page.getByText('Confirma tu email para colocar la orden.'),
    ).toBeVisible();
    await expect(
      page.getByText('Total $1,298.00', { exact: true }),
    ).toBeAttached();
    await expect(placeButton(page)).toBeDisabled();
    expect(api.orders).toHaveLength(0);
  });
});
