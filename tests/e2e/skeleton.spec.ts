import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Debe coincidir con NUXT_PUBLIC_API_BASE_URL del build (por defecto http://localhost:3000). */
const API = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000';

async function mockCategories(page: Page, status = 200) {
  await page.route(`${API}/v1/catalog/categories`, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        status === 200
          ? {
              data: [
                {
                  id: 'c1',
                  name: 'Camisas',
                  slug: 'camisas',
                  position: 1,
                  children: [],
                },
              ],
            }
          : {
              type: '/problems/internal-error',
              title: 'Error',
              status,
              correlationId: 'e2e',
            },
      ),
    }),
  );
}

/** WCAG 2.2 A y AA con axe (ADR-F008); sin violaciones graves ni críticas (REQUIREMENTS §4.6). */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

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

test('una ruta inexistente muestra la página 404', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByText('Página no encontrada')).toBeVisible();
  await expectAccessible(page);
});
