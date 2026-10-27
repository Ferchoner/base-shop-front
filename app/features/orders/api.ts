import { useMutation } from '@tanstack/vue-query';
import type { ApiProblem } from '~/shared/api/problem';
import { useApi } from '~/shared/api/use-api';
import type { GuestOrderKey, Order, OrderAccess, Reorder } from './types';

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
