import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API, expectAccessible, json, problem } from './mock-api';

const money = (amount: number) => ({ amount, currency: 'MXN' });
const variant = (
  id: string,
  options: Record<string, string>,
  amount: number,
  available = true,
) => ({
  id: `00000000-0000-0000-0001-${id.padStart(12, '0')}`,
  sku: `SKU-${id}`,
  options,
  price: money(amount),
  compareAtPrice: null,
  available,
});

const detail = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'camisa-lino',
  title: 'Camisa de lino',
  brand: { id: 'b1', name: 'Marca Uno', slug: 'marca-uno' },
  fromPrice: money(59900),
  compareAtPrice: null,
  image: null,
  available: true,
  publishedAt: '2026-10-01T00:00:00Z',
  description: 'Fresca para el verano.\n<script>alert(1)</script>',
  categories: [{ id: 'c1', name: 'Camisas', slug: 'camisas' }],
  images: [],
  optionNames: ['color', 'talla'],
  variants: [
    variant('1', { color: 'Azul', talla: 'S' }, 59900),
    variant('2', { color: 'Azul', talla: 'M' }, 64900),
    variant('3', { color: 'Rojo', talla: 'M' }, 59900, false),
  ],
};

async function mockProduct(page: Page, body: unknown, status = 200) {
  await page.route(`${API}/v1/catalog/products/camisa-lino`, (route) =>
    status === 200
      ? json(route, 200, body)
      : problem(route, status, 'not-found'),
  );
}

test.describe('detalle de producto (REQUIREMENTS §5.3)', () => {
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
