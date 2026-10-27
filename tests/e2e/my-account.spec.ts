import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  COMMON_PASSWORD,
  customerAccount,
  expectAccessible,
  guestOrder,
  mockCartApi,
  mockCheckoutApi,
  mockMyOrdersApi,
  mockSessionApi,
  savedAddress,
  TAKEN_EMAIL,
} from './mock-api';

async function login(page: Page, to: string) {
  await page.goto(`/login?redirect=${to}`);
  await page.getByLabel('Email').fill('maria@example.com');
  await page.getByLabel('Contraseña').fill('correcta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();
  await expect(page).toHaveURL(to);
}

async function pick(page: Page, label: string, option: string) {
  await page.getByRole('button', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

const myOrder = (status: string, code: string) =>
  guestOrder(status, code, customerAccount.email);

test.describe('mis datos (REQUIREMENTS §5.10)', () => {
  test('cambia su nombre, su email y su contraseña', async ({ page }) => {
    const auth = await mockSessionApi(page);
    await mockCartApi(page);
    await login(page, '/account');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mi cuenta' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mis datos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByLabel('Nombre o nombres')).toHaveValue('María');
    await expectAccessible(page);

    await page.getByLabel('Apellidos').fill('López Ruiz');
    await page.getByRole('button', { name: 'Guardar datos' }).click();
    await expect(page.getByText('Guardamos tus datos.')).toBeVisible();
    expect(auth.bodies.at(-1)).toEqual({
      firstNames: 'María',
      lastNames: 'López Ruiz',
    });

    // Email: contraseña incorrecta, email ocupado y por fin el cambio.
    const email = page.getByLabel('Email nuevo');
    const emailPassword = page
      .getByRole('region', { name: 'Email' })
      .getByLabel('Contraseña actual');
    await email.fill('maria.nueva@example.com');
    await emailPassword.fill('incorrecta');
    await page.getByRole('button', { name: 'Cambiar email' }).click();
    await expect(page.getByText('La contraseña no es correcta.')).toBeVisible();
    await email.fill(TAKEN_EMAIL);
    await emailPassword.fill('correcta');
    await page.getByRole('button', { name: 'Cambiar email' }).click();
    await expect(
      page.getByText('Ese email ya tiene una cuenta.'),
    ).toBeVisible();
    await email.fill('maria.nueva@example.com');
    await page.getByRole('button', { name: 'Cambiar email' }).click();
    await expect(
      page.getByText('Tu email ahora es maria.nueva@example.com.'),
    ).toBeVisible();
    await expect(page.getByText('Sin verificar')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Reenviar el correo' }),
    ).toBeVisible();
    await expectAccessible(page);

    // Contraseña: actual incorrecta, nueva común y por fin el cambio, sin cerrar esta sesión.
    const section = page.getByRole('region', { name: 'Cambiar contraseña' });
    const current = section.getByLabel('Contraseña actual');
    await current.fill('incorrecta');
    await section
      .getByLabel('Contraseña nueva', { exact: true })
      .fill(COMMON_PASSWORD);
    await section
      .getByLabel('Confirma la contraseña nueva')
      .fill(COMMON_PASSWORD);
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(
      page.getByText('La contraseña actual no es correcta.'),
    ).toBeVisible();
    await current.fill('correcta');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(
      page.getByText('Es una contraseña muy común. Elige otra.'),
    ).toBeVisible();
    await section
      .getByLabel('Contraseña nueva', { exact: true })
      .fill('una frase larga y nueva');
    await section
      .getByLabel('Confirma la contraseña nueva')
      .fill('una frase larga y nueva');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('Cambiamos tu contraseña.')).toBeVisible();
    expect(auth.calls).not.toContain('POST /v1/auth/logout');
    await expect(
      page.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeVisible();
  });
});

test.describe('mis direcciones (REQUIREMENTS §5.11)', () => {
  async function addressBook(
    page: Page,
    addresses = [savedAddress],
    retiredMunicipality?: string,
  ) {
    await mockSessionApi(page);
    const carts = await mockCartApi(page);
    const api = await mockCheckoutApi(page, carts, {
      addresses,
      retiredMunicipality,
    });
    await login(page, '/account/addresses');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mis direcciones' }),
    ).toBeVisible();
    return api;
  }

  test('agrega, edita, cambia la predeterminada y borra', async ({ page }) => {
    const api = await addressBook(page, [savedAddress], '014');
    await expect(page.getByText('Predeterminada')).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Agregar dirección' }).click();
    await expect(
      page.getByRole('heading', { name: 'Agregar dirección' }),
    ).toBeFocused();
    await page.getByLabel('Nombre de quien recibe').fill('Luis Pérez');
    await page.getByLabel('Teléfono').fill('3312345678');
    await page.getByLabel('Calle').fill('Av. Vallarta');
    await page.getByLabel('Número exterior').fill('200');
    await page.getByLabel('Colonia').fill('Americana');
    await page.getByLabel('Código postal').fill('44160');
    await pick(page, 'Estado', 'Jalisco');
    await pick(page, 'Municipio', 'Guadalajara');
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(page.getByText('Agregamos la dirección.')).toBeVisible();
    await expect(page.getByText('Av. Vallarta 200')).toBeVisible();
    expect(api.addresses).toHaveLength(2);
    expect(api.addresses[1]).toMatchObject({
      recipientName: 'Luis Pérez',
      stateCode: '14',
      municipalityCode: '039',
      interiorNumber: null,
      isDefault: false,
    });

    // Al cambiar el estado se vuelve a pedir el municipio; uno retirado se marca en su campo.
    await page.getByRole('button', { name: 'Editar Av. Vallarta 200' }).click();
    await pick(page, 'Estado', 'Ciudad de México');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(page.getByText('Elige el municipio.')).toBeVisible();
    await pick(page, 'Municipio', 'Benito Juárez');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(
      page.getByText('Ese municipio ya no está en el catálogo. Elige otro.'),
    ).toBeVisible();
    await pick(page, 'Municipio', 'Cuauhtémoc');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(page.getByText('Guardamos los cambios.')).toBeVisible();
    expect(api.addresses[1]).toMatchObject({
      stateCode: '09',
      municipalityCode: '015',
    });

    await page
      .getByRole('button', {
        name: 'Usar como predeterminada Av. Vallarta 200',
      })
      .click();
    await expect(
      page.getByText('Av. Vallarta 200 es ahora tu dirección predeterminada.'),
    ).toBeVisible();
    // La predeterminada va primero, como la devuelve la API.
    await expect(page.locator('li address').first()).toContainText(
      'Av. Vallarta 200',
    );

    await page.getByRole('button', { name: 'Borrar Av. Juárez 10' }).click();
    const dialog = page.getByRole('dialog', {
      name: '¿Borrar esta dirección?',
    });
    await expect(dialog).toBeVisible();
    await expectAccessible(page);
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    expect(api.addresses).toHaveLength(2);
    await page.getByRole('button', { name: 'Borrar Av. Juárez 10' }).click();
    await dialog.getByRole('button', { name: 'Borrar' }).click();
    await expect(page.getByText('Borramos la dirección.')).toBeVisible();
    await expect(page.getByText('Av. Juárez 10')).toHaveCount(0);
    expect(api.addresses.map((a) => a.street)).toEqual(['Av. Vallarta']);
  });

  test('con 10 direcciones no ofrece agregar otra', async ({ page }) => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      ...savedAddress,
      id: `00000000-0000-4000-8000-0000000ad1${String(i).padStart(2, '0')}`,
      isDefault: i === 0,
      exteriorNumber: String(i + 1),
    }));
    await addressBook(page, ten);
    await expect(
      page
        .getByRole('list', { name: 'Direcciones guardadas' })
        .getByRole('listitem'),
    ).toHaveCount(10);
    await expect(
      page.getByText('Tienes 10 direcciones, el máximo.'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Agregar dirección' }),
    ).toHaveCount(0);
  });

  test('sin direcciones invita a guardar una', async ({ page }) => {
    await addressBook(page, []);
    await expect(page.getByText('Aún no tienes direcciones')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Agregar dirección' }),
    ).toBeVisible();
  });
});

test.describe('mis pedidos (REQUIREMENTS §5.12)', () => {
  async function myOrders(
    page: Page,
    orders: ReturnType<typeof myOrder>[],
    options: Parameters<typeof mockMyOrdersApi>[3] = {},
  ) {
    await mockSessionApi(page);
    const carts = await mockCartApi(page);
    const api = await mockMyOrdersApi(page, carts, orders, options);
    return { api, carts };
  }

  test('filtra por estado y pagina de 20 en 20', async ({ page }) => {
    const orders = Array.from({ length: 23 }, (_, i) =>
      myOrder(
        i < 3 ? 'CANCELLED' : 'DELIVERED',
        `AB${String(i).padStart(2, '0')}-Q9XA`,
      ),
    );
    const { api } = await myOrders(page, orders);
    await login(page, '/account/orders');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mis pedidos' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /^Orden / })).toHaveCount(20);
    await expect(
      page.getByRole('link', { name: /Orden AB00-Q9XA/ }),
    ).toContainText('Cancelada');
    await expect(
      page.getByRole('link', { name: /Orden AB00-Q9XA/ }),
    ).toContainText('1 artículo');
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Página 2' }).click();
    await expect(page).toHaveURL('/account/orders?page=2');
    await expect(page.getByRole('link', { name: /^Orden / })).toHaveCount(3);

    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Cancelada' }).click();
    await expect(page).toHaveURL('/account/orders?status=CANCELLED');
    await expect(page.getByRole('link', { name: /^Orden / })).toHaveCount(3);
    expect(api.calls.at(-1)!.query).toBe(
      '?page=1&status=CANCELLED&pageSize=20',
    );

    // Un estado que la API no conoce se ignora.
    await page.goto('/account/orders?status=PERDIDA');
    await expect(page.getByRole('link', { name: /^Orden / })).toHaveCount(20);
  });

  test('sin pedidos lo dice', async ({ page }) => {
    await myOrders(page, []);
    await login(page, '/account/orders');
    await expect(page.getByText('Aún no tienes pedidos')).toBeVisible();
  });

  test('muestra cómo pagar una orden pendiente', async ({ page }) => {
    const { api } = await myOrders(page, [
      myOrder('PENDING_PAYMENT', 'K7M4-Q9XA'),
    ]);
    await login(page, '/account/orders');
    await page.getByRole('link', { name: /Orden K7M4-Q9XA/ }).click();
    await expect(page).toHaveURL('/account/orders/K7M4-Q9XA');
    await expect(
      page.getByRole('heading', { name: /Orden K7M4-Q9XA/ }),
    ).toBeVisible();
    await expect(page.getByText('Pendiente de pago')).toBeVisible();
    await expectAccessible(page);

    await page
      .getByRole('button', { name: 'Ver instrucciones de pago' })
      .click();
    await expect(
      page.getByText('Presenta este código en la tienda para pagar.'),
    ).toBeVisible();
    const payment = api.calls.find((c) => c.path.endsWith('/payments'))!;
    expect(payment.path).toBe('/v1/me/orders/K7M4-Q9XA/payments');
    expect(payment.key).not.toBe('');
    await expectAccessible(page);
  });

  test('una orden que venció al pedir el pago muestra su estado nuevo', async ({
    page,
  }) => {
    await myOrders(page, [myOrder('PENDING_PAYMENT', 'K7M4-Q9XA')], {
      expiresOnPayment: true,
    });
    await login(page, '/account/orders/K7M4-Q9XA');
    await page
      .getByRole('button', { name: 'Ver instrucciones de pago' })
      .click();
    await expect(
      page.getByText('Esta orden ya no admite el pago.'),
    ).toBeVisible();
    await expect(page.getByText('Vencida: no se pagó a tiempo')).toBeVisible();
  });

  test('vuelve a comprar una orden cancelada', async ({ page }) => {
    const { carts } = await myOrders(
      page,
      [myOrder('CANCELLED', 'K7M4-Q9XA')],
      { skipped: 1 },
    );
    await login(page, '/account/orders/K7M4-Q9XA');
    await expect(page.getByText('Cancelada', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ver instrucciones de pago' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Volver a comprar' }).click();
    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByText(
        'Agregamos los productos de tu orden al carrito. Uno ya no está a la venta y no se agregó.',
      ),
    ).toBeVisible();
    expect(carts.carts.get(carts.CUSTOMER_CART)!.lines).toHaveLength(1);
  });

  test('un código que no es suyo dice "Pedido no encontrado"', async ({
    page,
  }) => {
    await myOrders(page, [myOrder('DELIVERED', 'K7M4-Q9XA')]);
    await login(page, '/account/orders/ZZZZ-ZZZZ');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pedido no encontrado' }),
    ).toBeVisible();
    await expectAccessible(page);
  });
});
