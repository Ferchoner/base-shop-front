import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import type { ApiProblem } from '~/shared/api/problem';
import { useApi } from '~/shared/api/use-api';
import type {
  GuestOrderKey,
  MyOrdersParams,
  Order,
  OrderAccess,
  OrderPage,
  Reorder,
} from './types';

/**
 * Pedidos de invitado (API_SPEC §15.5, §15.6 y §14.3). Son mutaciones aunque lean: el email y el
 * código van en el cuerpo, nunca en la URL ni en la caché, y cada consulta gasta el límite de la IP.
 */
const post = <T>(path: string) => {
  const api = useApi();
  return (body: Record<string, unknown>) =>
    api<T>(path, { method: 'POST', body, auth: false });
};

/** 200 `Order` o el mismo 404 sin decir qué dato falló (BR-ORD-11). */
export function useLookupOrder() {
  const send = post<Order>('/v1/orders/lookup');
  return useMutation<Order, ApiProblem, GuestOrderKey>({
    mutationFn: (key) => send({ ...key }),
  });
}

/** 202 siempre: no dice si el email tiene pedidos. */
export function useRequestAccessLink() {
  const send = post<undefined>('/v1/orders/access-links');
  return useMutation<undefined, ApiProblem, string>({
    mutationFn: (contactEmail) => send({ contactEmail }),
  });
}

/** Las órdenes del email del enlace; el token sirve una vez. */
export function useOrderAccess() {
  const send = post<OrderAccess>('/v1/orders/access');
  return useMutation<OrderAccess, ApiProblem, string>({
    mutationFn: (token) => send({ token }),
  });
}

/**
 * Copia las líneas de una orden CANCELLED o REFUNDED a un carrito de invitado: el actual si se da
 * su `cartId`, o uno nuevo.
 */
export function useGuestReorder() {
  const send = post<Reorder>('/v1/orders/reorder');
  return useMutation<Reorder, ApiProblem, GuestOrderKey & { cartId?: string }>({
    mutationFn: (body) => send({ ...body }),
  });
}

/** Mismo formato que acepta la API (§15.5): sin espacios a los lados y en mayúsculas. */
export function normalizeOrderCode(text: string): string {
  return text.trim().toUpperCase();
}

// Pedidos del cliente (REQUIREMENTS §5.12, API_SPEC §15.4 y §14.3): lecturas con su token, que la
// caché olvida al cerrar la sesión (plugins/02.vue-query.ts).

export const orderKeys = {
  all: ['my-orders'] as const,
  list: (params: MyOrdersParams) => [...orderKeys.all, 'list', params] as const,
  detail: (publicCode: string) =>
    [...orderKeys.all, 'detail', publicCode] as const,
};

/** Pedidos por página, del más reciente al más antiguo (§15.4). */
export const MY_ORDERS_PAGE_SIZE = 20;

export function useMyOrders(params: MaybeRefOrGetter<MyOrdersParams>) {
  const api = useApi();
  return useQuery<OrderPage, ApiProblem>({
    queryKey: computed(() => orderKeys.list(toValue(params))),
    queryFn: ({ signal }) =>
      api<OrderPage>('/v1/me/orders', {
        query: { ...toValue(params), pageSize: MY_ORDERS_PAGE_SIZE },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

/** 404 si el código no existe o es de otra cuenta: la pantalla dice "Pedido no encontrado". */
export function useMyOrder(publicCode: MaybeRefOrGetter<string>) {
  const api = useApi();
  return useQuery<Order, ApiProblem>({
    queryKey: computed(() => orderKeys.detail(toValue(publicCode))),
    queryFn: ({ signal }) =>
      api<Order>(`/v1/me/orders/${encodeURIComponent(toValue(publicCode))}`, {
        signal,
      }),
  });
}

/** Copia una orden CANCELLED o REFUNDED al carrito de la cuenta (lo crea si no hay). */
export function useCustomerReorder() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<Reorder, ApiProblem, string>({
    mutationFn: (publicCode) =>
      api<Reorder>(`/v1/me/orders/${encodeURIComponent(publicCode)}/reorder`, {
        method: 'POST',
      }),
    // Un 409 dice que el estado cambió: la orden se vuelve a pedir.
    onError: (_e, publicCode) =>
      qc.invalidateQueries({ queryKey: orderKeys.detail(publicCode) }),
  });
}
