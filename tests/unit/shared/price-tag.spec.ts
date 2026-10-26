import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import PriceTag from '~/components/PriceTag.vue';

const mxn = (amount: number) => ({ amount, currency: 'MXN' as const });

describe('PriceTag (REQUIREMENTS §4.2)', () => {
  it('muestra el precio de la API y el de comparación tachado', async () => {
    const wrapper = await mountSuspended(PriceTag, {
      props: { price: mxn(59900), compareAt: mxn(79900), from: true },
    });
    expect(wrapper.text()).toContain('Desde $599.00');
    expect(wrapper.find('s').text()).toBe('$799.00');
  });

  it('no tacha un precio de comparación que no es mayor', async () => {
    const wrapper = await mountSuspended(PriceTag, {
      props: { price: mxn(59900), compareAt: mxn(59900), withTax: true },
    });
    expect(wrapper.find('s').exists()).toBe(false);
    expect(wrapper.text()).toContain('IVA incluido');
  });
});
