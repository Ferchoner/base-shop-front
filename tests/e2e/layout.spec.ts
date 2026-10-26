import { expect, test } from '@playwright/test';
import { expectAccessible, mockCategories } from './mock-api';

test.describe('encabezado y navegación (REQUIREMENTS §4.6, §5.15)', () => {
  test('el buscador exige dos letras y lleva al catálogo', async ({ page }) => {
    await mockCategories(page);
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Buscar productos' });
    await search.fill('a');
    await search.press('Enter');
    await expect(
      page.getByText('Escribe al menos 2 letras para buscar.'),
    ).toBeVisible();
    await search.fill('camisa');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/products\?q=camisa$/);
  });

  test('el enlace para saltar al contenido es el primero del teclado', async ({
    page,
  }) => {
    await mockCategories(page);
    await page.goto('/');
    // Esperar a que la app monte; antes, el Tab cae en el documento vacío.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Saltar al contenido' }),
    ).toBeFocused();
    await expectAccessible(page);
  });

  test('una ruta inexistente ofrece volver al inicio o al catálogo', async ({
    page,
  }) => {
    await page.goto('/no-existe');
    await expect(
      page.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ir al inicio' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ver el catálogo' }),
    ).toBeVisible();
    await expectAccessible(page);
  });
});
