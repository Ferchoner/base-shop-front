import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { ApiProblem } from '~/shared/api/problem';
import type { ApiClient } from '~/shared/api/client';
import { useApi } from '~/shared/api/use-api';
import { useCartIdStore } from '~/shared/stores/cart-id';
import type { Cart } from './types';

const BASE = '/v1/carts';

export const cartKeys = {
  all: ['cart'] as const,
  guest: (cartId: string | null) => [...cartKeys.all, 'guest', cartId] as const,
};

/** Aviso que la pantalla del carrito muestra cuando el carrito se olvidó (REQUIREMENTS §5.4). */
export function useCartNotice() {
  return useState<string | null>('cart-notice', () => null);
}

const USED_IN_ORDER = 'Tu carrito ya se usó en una orden. Empezamos uno nuevo.';

/** El carrito ya no existe o ya no está activo (REQUIREMENTS §4.5). */
export function isGoneCart(error: unknown): boolean {
  return (
    error instanceof ApiProblem &&
    (error.type === 'cart-not-active' ||
      (error.type === 'not-found' && error.status === 404))
  );
}

/**
 * Carrito de invitado. Sin `cartId` no hay carrito y no se pide nada: se crea al agregar el primer
 * producto. Uno que ya no existe o no está activo se olvida y la pantalla lo ve vacío.
 */
export function useGuestCart() {
  const api = useApi();
  const store = useCartIdStore();
  const notice = useCartNotice();
  return useQuery<Cart | null, ApiProblem>({
    queryKey: computed(() => cartKeys.guest(store.cartId)),
    enabled: computed(() => !!store.cartId),
    queryFn: async ({ signal }) => {
      const id = store.cartId;
      if (!id) return null;
      try {
        const cart = await api<Cart>(`${BASE}/${id}`, { auth: false, signal });
        if (cart.status === 'ACTIVE') return cart;
        if (cart.status === 'CHECKED_OUT') notice.value = USED_IN_ORDER;
      } catch (error) {
        if (!isGoneCart(error)) throw error;
      }
      store.forget();
      return null;
    },
  });
}

// Un solo carrito aunque se agregue dos veces seguidas antes de que responda el primero.
let creating: Promise<string> | null = null;

async function ensureCart(
  api: ApiClient,
  store: ReturnType<typeof useCartIdStore>,
): Promise<string> {
  if (store.cartId) return store.cartId;
  creating ??= api<Cart>(BASE, { method: 'POST', auth: false })
    .then((cart) => {
      store.set(cart.id!);
      return cart.id!;
    })
    .finally(() => {
      creating = null;
    });
  return creating;
}

/** Agrega una variante; crea el carrito si hace falta y otro si el guardado ya no sirve (§4.5). */
export function useAddToCart() {
  const api = useApi();
  const store = useCartIdStore();
  const qc = useQueryClient();
  const add = (cartId: string, variantId: string, quantity: number) =>
    api<Cart>(`${BASE}/${cartId}/lines`, {
      method: 'POST',
      auth: false,
      body: { variantId, quantity },
    });
  return useMutation<Cart, ApiProblem, { variantId: string; quantity: number }>(
    {
      mutationFn: async ({ variantId, quantity }) => {
        const cartId = await ensureCart(api, store);
        try {
          return await add(cartId, variantId, quantity);
        } catch (error) {
          if (!isGoneCart(error)) throw error;
          store.forget();
          return add(await ensureCart(api, store), variantId, quantity);
        }
      },
      onSuccess: (cart) => qc.setQueryData(cartKeys.guest(cart.id), cart),
    },
  );
}

/** Cambia la cantidad o quita una línea; el carrito se actualiza con la respuesta de la API. */
export function useChangeLine() {
  const api = useApi();
  const store = useCartIdStore();
  const qc = useQueryClient();
  const notice = useCartNotice();
  return useMutation<
    Cart,
    ApiProblem,
    { variantId: string; quantity: number | null }
  >({
    mutationFn: ({ variantId, quantity }) =>
      api<Cart>(`${BASE}/${store.cartId}/lines/${variantId}`, {
        method: quantity === null ? 'DELETE' : 'PATCH',
        auth: false,
        body: quantity === null ? undefined : { quantity },
      }),
    onSuccess: (cart) => qc.setQueryData(cartKeys.guest(cart.id), cart),
    onError: (error) => {
      if (error.type === 'cart-not-active') {
        notice.value = USED_IN_ORDER;
        store.forget();
        return;
      }
      // Una línea que ya no está (404) o que dejó de venderse: se recarga el carrito (§5.4).
      if (error.type === 'not-found' || error.type === 'variant-not-sellable')
        qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
