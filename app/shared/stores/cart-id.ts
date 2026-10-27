import { defineStore } from 'pinia';

/** Llave propia de la tienda en `localStorage` (ADR-F006). */
export const CART_ID_KEY = 'base-shop-front.cartId';

function read(): string | null {
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function write(id: string | null) {
  try {
    if (id) localStorage.setItem(CART_ID_KEY, id);
    else localStorage.removeItem(CART_ID_KEY);
  } catch {
    // Sin almacenamiento (modo privado estricto), el carrito dura lo que la pestaña.
  }
}

/**
 * `cartId` del carrito de invitado: su única credencial (base-shop ADR-0059, REQUIREMENTS §4.5).
 * Vive en `localStorage`, compartido por las pestañas. Está en `shared` porque lo usan el carrito y,
 * al fusionarlo, la sesión (TF-010).
 */
export const useCartIdStore = defineStore('cart-id', () => {
  const cartId = ref<string | null>(import.meta.client ? read() : null);

  if (import.meta.client) {
    window.addEventListener('storage', (event) => {
      if (event.key === CART_ID_KEY) cartId.value = event.newValue;
    });
  }

  function set(id: string) {
    cartId.value = id;
    write(id);
  }

  /** Un carrito que ya no existe o ya no está activo se olvida; el siguiente agregado crea otro. */
  function forget() {
    cartId.value = null;
    write(null);
  }

  return { cartId, set, forget };
});
