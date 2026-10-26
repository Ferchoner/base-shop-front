import { expect, test } from '@playwright/test';
import { expectAccessible, mockCategories } from './mock-api';

test('la tienda llega a la API y es accesible', async ({ page }) => {
  await mockCategories(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tienda en construcción',
  );
  await expect(page.getByText('1 categorías visibles')).toBeVisible();
  await expectAccessible(page);
});

test('avisa cuando la API no responde', async ({ page }) => {
  await mockCategories(page, 500);
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'No se pudo conectar con la API',
  );
  await expectAccessible(page);
});
