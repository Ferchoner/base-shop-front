import { expect, test } from '@playwright/test';
import {
  detail,
  expectAccessible,
  mockCartApi,
  mockProductDetail,
} from './mock-api';

const CART_KEY = 'base-shop-front.cartId';
const azulM = detail.variants[1]!.id;
const rojoM = detail.variants[2]!.id;

test.describe('carrito de invitado (REQUIREMENTS §4.5, §5.3, §5.4)', () => {
  test('agrega desde el producto, cambia la cantidad y quita', async ({
    page,
  }) => {
    await mockProductDetail(page);
    const api = await mockCartApi(page);
    await page.goto('/products/camisa-lino');
    const add = page.getByRole('button', { name: 'Agregar al carrito' });
    await expect(add).toBeDisabled();

    await page.getByRole('radio', { name: 'Azul' }).click();
    await page.getByRole('radio', { name: 'M' }).click();
    await page.getByRole('combobox', { name: 'Cantidad' }).click();
    await page.getByRole('option', { name: '2', exact: true }).click();
    await add.click();
    await expect(
      page.getByText('Agregaste 2 de Camisa de lino al carrito.'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Carrito, 2 artículos' }),
    ).toBeVisible();
    expect(api.created).toHaveLength(1);
    expect(await page.evaluate((k) => localStorage.getItem(k), CART_KEY)).toBe(
      api.created[0],
    );

    // El segundo agregado usa el mismo carrito.
    await add.click();
    await expect(
      page.getByRole('link', { name: 'Carrito, 3 artículos' }),
    ).toBeVisible();
    expect(api.created).toHaveLength(1);

    await page.getByRole('link', { name: 'Ver carrito' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Carrito' }),
    ).toBeVisible();
    await expect(page.getByText('$1,947.00').first()).toBeVisible();
    await expect(
      page.getByText('No incluye envío ni descuentos'),
    ).toBeVisible();
    await expectAccessible(page);

    await page
      .getByRole('combobox', { name: 'Cantidad de Camisa de lino' })
      .click();
    await page.getByRole('option', { name: '1', exact: true }).click();
    await expect(page.getByText('1 artículo, subtotal $649.00')).toBeAttached();

    await page.getByRole('button', { name: 'Quitar Camisa de lino' }).click();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Carrito, 0 artículos' }),
    ).toBeVisible();
  });

  test('una lectura lenta del carrito no borra lo que se agregó', async ({
    page,
  }) => {
    await mockProductDetail(page);
    const api = await mockCartApi(page, {}, null, { slowReadMs: 500 });
    await page.goto('/products/camisa-lino');
    await page.getByRole('radio', { name: 'Azul' }).click();
    await page.getByRole('radio', { name: 'M' }).click();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    const link = page.getByRole('link', { name: 'Carrito, 1 artículo' });
    await expect(link).toBeVisible();

    // La lectura que empezó al crear el carrito responde después, con el carrito vacío.
    await expect.poll(() => api.slowReads.served).toBeGreaterThan(0);
    await page.waitForTimeout(100);
    await expect(link).toBeVisible();
  });

  test('avisa del tope de 30 unidades por producto', async ({ page }) => {
    await mockProductDetail(page);
    await mockCartApi(page, {
      'cart-1': { lines: [{ variantId: azulM, quantity: 30 }] },
    });
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k!, v!),
      [CART_KEY, 'cart-1'],
    );
    await page.goto('/products/camisa-lino');
    await page.getByRole('radio', { name: 'Azul' }).click();
    await page.getByRole('radio', { name: 'M' }).click();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(
      page.getByText('Puedes tener hasta 30 unidades de cada producto'),
    ).toBeVisible();
  });

  test('olvida un carrito que ya se usó en una orden', async ({ page }) => {
    await mockCartApi(page, {
      'cart-old': {
        status: 'CHECKED_OUT',
        lines: [{ variantId: azulM, quantity: 1 }],
      },
    });
    await page.addInitScript(
      ([k, v]) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(k!, v!);
          sessionStorage.setItem('seeded', '1');
        }
      },
      [CART_KEY, 'cart-old'],
    );
    await page.goto('/cart');
    await expect(
      page.getByText('Tu carrito ya se usó en una orden'),
    ).toBeVisible();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    expect(
      await page.evaluate((k) => localStorage.getItem(k), CART_KEY),
    ).toBeNull();
  });

  test('marca lo que ya no se vende o no alcanza', async ({ page }) => {
    await mockCartApi(page, {
      'cart-1': {
        lines: [
          { variantId: azulM, quantity: 2, canFulfill: false },
          { variantId: rojoM, quantity: 1, sellable: false },
        ],
      },
    });
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k!, v!),
      [CART_KEY, 'cart-1'],
    );
    await page.goto('/cart');
    await expect(page.getByText('Ya no está disponible')).toBeVisible();
    await expect(
      page.getByText('No hay suficientes para la cantidad pedida'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Continuar al checkout' }),
    ).toBeVisible();
    await expectAccessible(page);
  });
});
