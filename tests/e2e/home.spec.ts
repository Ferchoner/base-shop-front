import { expect, test } from '@playwright/test';
import {
  expectAccessible,
  json,
  mockCategories,
  mockProducts,
  problem,
  productPage,
} from './mock-api';

test.describe('inicio (REQUIREMENTS §5.1)', () => {
  test('muestra categorías y lo más nuevo, y es accesible', async ({
    page,
  }) => {
    await mockCategories(page);
    const requests = await mockProducts(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Bienvenido a la tienda' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Producto 1' }),
    ).toBeVisible();
    expect(requests[0]?.get('sort')).toBe('-publishedAt');
    expect(requests[0]?.get('pageSize')).toBe('12');
    await expectAccessible(page);

    await page.getByRole('link', { name: 'Camisas' }).click();
    await expect(page).toHaveURL(/\/products\?category=camisas$/);
  });

  test('sin productos dice que pronto habrá', async ({ page }) => {
    await mockCategories(page);
    await mockProducts(page, (_p, route) => json(route, 200, productPage(0)));
    await page.goto('/');
    await expect(page.getByText('Pronto tendremos productos')).toBeVisible();
    await expectAccessible(page);
  });

  test('avisa cuando la API falla y deja reintentar', async ({ page }) => {
    await mockCategories(page, 500);
    await mockProducts(page, (_p, route) =>
      problem(route, 500, 'internal-error'),
    );
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Algo salió mal');
    await expect(
      page.getByRole('button', { name: 'Reintentar' }),
    ).toBeVisible();
    await expectAccessible(page);
  });
});
