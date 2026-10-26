import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import ProductCard from '~/features/catalog/components/ProductCard.vue';
import type { ProductSummary } from '~/features/catalog/types';

const product: ProductSummary = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'camisa-lino',
  title: 'Camisa de lino',
  brand: { id: 'b', name: 'Marca Uno', slug: 'marca-uno' },
  fromPrice: { amount: 59900, currency: 'MXN' },
  compareAtPrice: { amount: 79900, currency: 'MXN' },
  image: null,
  available: false,
  publishedAt: '2026-10-01T00:00:00Z',
};

describe('ProductCard (REQUIREMENTS §5.1)', () => {
  it('muestra título, marca, "Desde", precio tachado y "Agotado"', async () => {
    const wrapper = await mountSuspended(ProductCard, {
      props: { product, headingLevel: 'h2' },
    });
    expect(wrapper.find('h2 a').attributes('href')).toBe(
      '/products/camisa-lino',
    );
    expect(wrapper.text()).toContain('Marca Uno');
    expect(wrapper.text()).toContain('Desde $599.00');
    expect(wrapper.find('s').text()).toBe('$799.00');
    expect(wrapper.text()).toContain('Agotado');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('carga la imagen sin repetir el título en el alt', async () => {
    const wrapper = await mountSuspended(ProductCard, {
      props: {
        product: {
          ...product,
          available: true,
          image: {
            id: 'i',
            url: 'http://localhost:3000/images/a.jpg',
            altText: 'Camisa azul',
            variantId: null,
            position: 1,
          },
        },
        headingLevel: 'h3',
      },
    });
    const img = wrapper.find('img');
    expect(img.attributes('alt')).toBe('');
    expect(img.attributes('loading')).toBe('lazy');
    expect(wrapper.text()).not.toContain('Agotado');
  });
});
