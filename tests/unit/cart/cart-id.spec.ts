import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { CART_ID_KEY, useCartIdStore } from '~/shared/stores/cart-id';

describe('cartId del invitado (REQUIREMENTS §4.5)', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('se guarda en localStorage con la llave de la tienda', () => {
    const store = useCartIdStore();
    expect(store.cartId).toBeNull();
    store.set('cart-1');
    expect(localStorage.getItem(CART_ID_KEY)).toBe('cart-1');
  });

  it('lo recupera al abrir la tienda y lo olvida', () => {
    localStorage.setItem(CART_ID_KEY, 'cart-2');
    const store = useCartIdStore();
    expect(store.cartId).toBe('cart-2');
    store.forget();
    expect(localStorage.getItem(CART_ID_KEY)).toBeNull();
  });

  it('sigue a las otras pestañas', () => {
    const store = useCartIdStore();
    window.dispatchEvent(
      new StorageEvent('storage', { key: CART_ID_KEY, newValue: 'cart-3' }),
    );
    expect(store.cartId).toBe('cart-3');
  });
});
