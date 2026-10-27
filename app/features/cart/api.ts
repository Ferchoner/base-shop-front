import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/vue-query';
import { ApiProblem } from '~/shared/api/problem';
import type { ApiClient } from '~/shared/api/client';
import { useApi } from '~/shared/api/use-api';
import { useSessionStore } from '~/shared/auth/session.store';
import { useCartIdStore } from '~/shared/stores/cart-id';
import type { Cart } from './types';

const GUEST = '/v1/carts';
const CUSTOMER = '/v1/me/cart';

export const cartKeys = {
  all: ['cart'] as const,
  guest: (cartId: string | null) => [...cartKeys.all, 'guest', cartId] as const,
  customer: () => [...cartKeys.all, 'customer'] as const,
};

/**
 * Guarda el carrito que devolvió una escritura. Una lectura que sigue en curso se cancela antes: trae
 * el carrito de antes de la escritura y, si respondiera después, lo pisaría (el contador volvería a 0).
 */
async function saveCart(
  qc: QueryClient,
  queryKey: readonly unknown[],
  cart: Cart,
): Promise<void> {
  await qc.cancelQueries({ queryKey, exact: true });
  qc.setQueryData(queryKey, cart);
}

/** Aviso que la pantalla del carrito muestra cuando el carrito se olvidó (REQUIREMENTS §5.4). */
export function useCartNotice() {
  return useState<string | null>('cart-notice', () => null);
}

const USED_IN_ORDER = 'Tu carrito ya se usó en una orden. Empezamos uno nuevo.';
export const MERGED_NOTICE =
  'Combinamos los productos de tu carrito con los de tu cuenta.';

/** El carrito ya no existe o ya no está activo (REQUIREMENTS §4.5). */
export function isGoneCart(error: unknown): boolean {
  return (
    error instanceof ApiProblem &&
    (error.type === 'cart-not-active' ||
      (error.type === 'not-found' && error.status === 404))
  );
}

type CartIdStore = ReturnType<typeof useCartIdStore>;

/**
 * Pasa el carrito de invitado a la cuenta (UC-CRT-06) y olvida su `cartId`. Solo fusiona uno activo
 * con líneas; devuelve el carrito del cliente si hubo fusión. Uno que ya no existe, ya se fusionó o ya
 * se usó en una orden solo se olvida. Ante otro error el `cartId` se conserva y se vuelve a intentar
 * al leer el carrito del cliente.
 */
async function mergeGuestCart(
  api: ApiClient,
  store: CartIdStore,
): Promise<Cart | null> {
  const guestCartId = store.cartId;
  if (!guestCartId) return null;
  try {
    const guest = await api<Cart>(`${GUEST}/${guestCartId}`, { auth: false });
    if (guest.status !== 'ACTIVE' || guest.lines.length === 0) {
      store.forget();
      return null;
    }
    const cart = await api<Cart>(`${CUSTOMER}/merge`, {
      method: 'POST',
      body: { guestCartId },
    });
    store.forget();
    return cart;
  } catch (error) {
    if (!isGoneCart(error)) throw error;
    store.forget();
    return null;
  }
}

// Una sola fusión aunque la pidan a la vez el login y el contador del carrito.
let merging: Promise<Cart | null> | null = null;

/**
 * Fusión con aviso: lo que suma la API (con tope de 30, sin advertencia) no se explica línea por
 * línea; la tienda solo dice que el carrito se combinó (REQUIREMENTS §4.5).
 */
function useGuestCartMerge() {
  const api = useApi();
  const store = useCartIdStore();
  const qc = useQueryClient();
  const toast = useToast();
  return (): Promise<Cart | null> => {
    merging ??= mergeGuestCart(api, store)
      .then((cart) => {
        if (cart) {
          qc.setQueryData(cartKeys.customer(), cart);
          toast.add({
            title: MERGED_NOTICE,
            color: 'success',
            icon: 'i-lucide-shopping-cart',
          });
        }
        return cart;
      })
      .finally(() => {
        merging = null;
      });
    return merging;
  };
}

/**
 * Fusiona el carrito de invitado después de iniciar sesión, antes de regresar a la ruta de origen
 * (REQUIREMENTS §5.8). Un error no impide entrar: el `cartId` se conserva para el siguiente intento.
 */
export function useMergeGuestCart() {
  const merge = useGuestCartMerge();
  return () =>
    merge().then(
      () => undefined,
      () => undefined,
    );
}

/**
 * Carrito de la pantalla: el de la cuenta con sesión y el de invitado sin ella (REQUIREMENTS §4.5).
 * Se pide cuando ya se sabe si hay sesión. Sin `cartId` el invitado no tiene carrito y no se pide
 * nada: se crea al agregar el primer producto. Uno que ya no existe o no está activo se olvida y la
 * pantalla lo ve vacío.
 */
export function useCart() {
  const api = useApi();
  const session = useSessionStore();
  const store = useCartIdStore();
  const notice = useCartNotice();
  const merge = useGuestCartMerge();
  return useQuery<Cart | null, ApiProblem>({
    queryKey: computed(() =>
      session.isAuthenticated
        ? cartKeys.customer()
        : cartKeys.guest(store.cartId),
    ),
    enabled: computed(
      () => session.isSettled && (session.isAuthenticated || !!store.cartId),
    ),
    queryFn: async ({ queryKey, signal }) => {
      if (queryKey[1] === 'customer') {
        // Un carrito de invitado pendiente se fusiona primero.
        const merged = store.cartId ? await merge() : null;
        return merged ?? (await api<Cart>(CUSTOMER, { signal }));
      }
      const id = store.cartId;
      if (!id) return null;
      try {
        const cart = await api<Cart>(`${GUEST}/${id}`, { auth: false, signal });
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

async function ensureCart(api: ApiClient, store: CartIdStore): Promise<string> {
  if (store.cartId) return store.cartId;
  creating ??= api<Cart>(GUEST, { method: 'POST', auth: false })
    .then((cart) => {
      store.set(cart.id!);
      return cart.id!;
    })
    .finally(() => {
      creating = null;
    });
  return creating;
}

/**
 * Agrega una variante. El cliente usa el carrito de su cuenta, que la API crea si no existe. El
 * invitado crea el suyo si hace falta y otro si el guardado ya no sirve (§4.5).
 */
export function useAddToCart() {
  const api = useApi();
  const session = useSessionStore();
  const store = useCartIdStore();
  const qc = useQueryClient();
  const add = (base: string, variantId: string, quantity: number) =>
    api<Cart>(`${base}/lines`, {
      method: 'POST',
      auth: base === CUSTOMER,
      body: { variantId, quantity },
    });
  return useMutation<Cart, ApiProblem, { variantId: string; quantity: number }>(
    {
      mutationFn: async ({ variantId, quantity }) => {
        if (session.isAuthenticated) return add(CUSTOMER, variantId, quantity);
        const cartId = await ensureCart(api, store);
        try {
          return await add(`${GUEST}/${cartId}`, variantId, quantity);
        } catch (error) {
          if (!isGoneCart(error)) throw error;
          store.forget();
          const next = await ensureCart(api, store);
          return add(`${GUEST}/${next}`, variantId, quantity);
        }
      },
      onSuccess: (cart) =>
        saveCart(
          qc,
          session.isAuthenticated
            ? cartKeys.customer()
            : cartKeys.guest(cart.id),
          cart,
        ),
    },
  );
}

/** Cambia la cantidad o quita una línea; el carrito se actualiza con la respuesta de la API. */
export function useChangeLine() {
  const api = useApi();
  const session = useSessionStore();
  const store = useCartIdStore();
  const qc = useQueryClient();
  const notice = useCartNotice();
  return useMutation<
    Cart,
    ApiProblem,
    { variantId: string; quantity: number | null }
  >({
    mutationFn: ({ variantId, quantity }) => {
      const customer = session.isAuthenticated;
      const base = customer ? CUSTOMER : `${GUEST}/${store.cartId}`;
      return api<Cart>(`${base}/lines/${variantId}`, {
        method: quantity === null ? 'DELETE' : 'PATCH',
        auth: customer,
        body: quantity === null ? undefined : { quantity },
      });
    },
    onSuccess: (cart) =>
      saveCart(
        qc,
        session.isAuthenticated ? cartKeys.customer() : cartKeys.guest(cart.id),
        cart,
      ),
    onError: (error) => {
      if (error.type === 'cart-not-active') {
        notice.value = USED_IN_ORDER;
        if (session.isAuthenticated)
          qc.invalidateQueries({ queryKey: cartKeys.all });
        else store.forget();
        return;
      }
      // Una línea que ya no está (404) o que dejó de venderse: se recarga el carrito (§5.4).
      if (error.type === 'not-found' || error.type === 'variant-not-sellable')
        qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
