import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  expectAccessible,
  json,
  mockBrands,
  mockCategories,
  mockProducts,
  productPage,
} from './mock-api';

/** En móvil los filtros están detrás de un botón. */
async function openFilters(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Filtros' });
  if (await toggle.isVisible()) await toggle.click();
}

test.describe('catálogo (REQUIREMENTS §5.2)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCategories(page);
    await mockBrands(page);
  });

  test('pide cada dato una sola vez al abrir con filtros (TF-017)', async ({
    page,
  }) => {
    const reads: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (request.method() === 'GET' && url.pathname.startsWith('/v1/'))
        reads.push(url.pathname);
    });
    const requests = await mockProducts(page, (_p, route) =>
      json(route, 200, productPage(3, 2, 30)),
    );
    await page.goto('/products?category=camisas&sort=price&page=2');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Catálogo' }),
    ).toBeVisible();
    await expect(page.getByText('Producto 1', { exact: true })).toBeVisible();

    expect(requests).toHaveLength(1);
    expect(Object.fromEntries(requests[0]!)).toMatchObject({
      category: 'camisas',
      sort: 'price',
      page: '2',
    });
    const count = (path: string) => reads.filter((p) => p === path).length;
    expect(count('/v1/catalog/categories')).toBe(1);
    expect(count('/v1/catalog/brands')).toBe(1);
  });

  test('los filtros viven en la URL y "atrás" los deshace', async ({
    page,
  }) => {
    const requests = await mockProducts(page, (_p, route) =>
      json(route, 200, productPage(3)),
    );
    await page.goto('/products');
    await expect(page.getByText('3 productos')).toBeVisible();
    expect(requests.at(-1)?.get('pageSize')).toBe('24');
    await expectAccessible(page);

    await openFilters(page);
    // Marcar navega; el estado sale de la URL, así que se hace clic y se espera la URL.
    await page.getByRole('checkbox', { name: 'Marca Dos' }).click();
    await expect(page).toHaveURL(/brand=marca-dos/);

    await page.getByLabel('Mínimo').fill('100');
    await page.getByLabel('Máximo').fill('599.50');
    await page.getByRole('button', { name: 'Aplicar precio' }).click();
    await expect(page).toHaveURL(/min=100&max=599.50/);
    await expect.poll(() => requests.at(-1)?.get('maxPrice')).toBe('59950');
    expect(requests.at(-1)?.get('minPrice')).toBe('10000');
    expect(requests.at(-1)?.get('brand')).toBe('marca-dos');

    await page.goBack();
    await expect(page).not.toHaveURL(/min=/);
    await expect(page).toHaveURL(/brand=marca-dos/);
  });

  test('no deja un rango de precio al revés', async ({ page }) => {
    await mockProducts(page);
    await page.goto('/products');
    await openFilters(page);
    await page.getByLabel('Mínimo').fill('500');
    await page.getByLabel('Máximo').fill('100');
    await page.getByRole('button', { name: 'Aplicar precio' }).click();
    await expect(
      page.getByText('El mínimo no puede ser mayor que el máximo.'),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/min=/);
  });

  test('"Relevancia" solo se ofrece con búsqueda', async ({ page }) => {
    const requests = await mockProducts(page);
    await page.goto('/products?q=lino');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Resultados para «lino»' }),
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Ordenar por' }),
    ).toHaveText(/Relevancia/);
    expect(requests.at(-1)?.get('q')).toBe('lino');

    await page.goto('/products?sort=relevance');
    await expect(
      page.getByRole('combobox', { name: 'Ordenar por' }),
    ).toHaveText(/Más recientes/);
    expect(requests.at(-1)?.has('sort')).toBe(false);
  });

  test('quita una categoría que ya no existe y avisa', async ({ page }) => {
    const requests = await mockProducts(page, (params, route) =>
      params.has('category')
        ? route.fulfill({
            status: 400,
            contentType: 'application/problem+json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              type: '/problems/validation-error',
              title: 'validation-error',
              status: 400,
              errors: [
                {
                  field: 'category',
                  code: 'unknownCategory',
                  message: 'La categoría no existe.',
                },
              ],
            }),
          })
        : json(route, 200, productPage(2)),
    );
    await page.goto('/products?category=vieja');
    await expect(
      page.getByText('La categoría que buscabas ya no está disponible'),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page.getByText('2 productos')).toBeVisible();
    expect(requests.at(-1)?.has('category')).toBe(false);
  });

  test('una página que no existe ofrece volver a la primera', async ({
    page,
  }) => {
    await mockProducts(page, (params, route) =>
      json(
        route,
        200,
        params.get('page') === '9'
          ? {
              data: [],
              meta: { page: 9, pageSize: 24, totalItems: 3, totalPages: 1 },
            }
          : productPage(3),
      ),
    );
    await page.goto('/products?page=9');
    await expect(page.getByText('Esta página no existe')).toBeVisible();
    await page.getByRole('button', { name: 'Ir a la página 1' }).click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText('3 productos')).toBeVisible();
    await expectAccessible(page);
  });

  test('sin resultados ofrece quitar los filtros', async ({ page }) => {
    await mockProducts(page, (params, route) =>
      json(route, 200, productPage(params.has('available') ? 0 : 3)),
    );
    await page.goto('/products?available=true');
    await expect(page.getByText('No encontramos productos')).toBeVisible();
    await page
      .getByRole('main')
      .getByRole('button', { name: 'Quitar filtros' })
      .last()
      .click();
    await expect(page).not.toHaveURL(/available/);
    await expect(page.getByText('3 productos')).toBeVisible();
  });
});
