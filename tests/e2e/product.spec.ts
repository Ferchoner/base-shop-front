import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  API,
  detail,
  expectAccessible,
  json,
  problem,
  variant,
} from './mock-api';

async function mockProduct(page: Page, body: unknown, status = 200) {
  await page.route(`${API}/v1/catalog/products/camisa-lino`, (route) =>
    status === 200
      ? json(route, 200, body)
      : problem(route, status, 'not-found'),
  );
}

test.describe('detalle de producto (REQUIREMENTS §5.3)', () => {
  test('pide el producto una sola vez (TF-017)', async ({ page }) => {
    let reads = 0;
    await page.route(`${API}/v1/catalog/products/camisa-lino`, (route) => {
      reads++;
      return json(route, 200, detail);
    });
    await page.goto('/products/camisa-lino');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Camisa de lino' }),
    ).toBeVisible();
    expect(reads).toBe(1);
  });

  test('elige variante, ve su precio y su disponibilidad', async ({ page }) => {
    await mockProduct(page, detail);
    await page.goto('/products/camisa-lino');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Camisa de lino' }),
    ).toBeVisible();
    await expect(page.getByText('Desde $599.00')).toBeVisible();
    // La descripción es texto: el HTML se ve tal cual y no se ejecuta.
    await expect(page.getByText('<script>alert(1)</script>')).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('radio', { name: 'Rojo' }).click();
    await expect(page.getByRole('radio', { name: 'S' })).toBeDisabled();
    await page.getByRole('radio', { name: 'M' }).click();
    await expect(page.getByText('Agotado').first()).toBeVisible();

    await page.getByRole('radio', { name: 'Azul' }).click();
    await expect(page.getByText('$649.00')).toBeVisible();
    await expect(page.getByText('Disponible')).toBeVisible();
    await expectAccessible(page);
  });

  test('con una sola variante no hay selector', async ({ page }) => {
    await mockProduct(page, {
      ...detail,
      optionNames: [],
      variants: [variant('9', {}, 59900)],
    });
    await page.goto('/products/camisa-lino');
    await expect(page.getByText('Disponible')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });

  test('un producto que no existe ofrece ir al catálogo', async ({ page }) => {
    await mockProduct(page, null, 404);
    await page.goto('/products/camisa-lino');
    await expect(
      page.getByRole('heading', { name: 'Producto no disponible' }),
    ).toBeVisible();
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Ver el catálogo' })
      .click();
    await expect(page).toHaveURL(/\/products$/);
  });
});
