import { keepPreviousData, useMutation, useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import type { ApiProblem } from '~/shared/api/problem';
import { useApi } from '~/shared/api/use-api';
import type {
  CheckoutQuote,
  Order,
  PaymentStart,
  PlaceCustomerOrderInput,
  PlaceGuestOrderInput,
  QuoteInput,
} from './types';

export const checkoutKeys = {
  all: ['checkout'] as const,
  quote: (input: QuoteInput) => [...checkoutKeys.all, 'quote', input] as const,
};

/**
 * Cotización del carrito (UC-ORD-01, API_SPEC §15.2). Sin caché en la API ni aquí: se pide al entrar,
 * al aplicar o quitar un cupón y al elegir la dirección (REQUIREMENTS §5.5), no al volver a la pestaña,
 * para que el total no cambie mientras el cliente lo revisa.
 */
export function useQuote(input: MaybeRefOrGetter<QuoteInput | null>) {
  const api = useApi();
  return useQuery<CheckoutQuote, ApiProblem>({
    queryKey: computed(() => checkoutKeys.quote(toValue(input)!)),
    queryFn: ({ signal }) => {
      const q = toValue(input)!;
      const couponCode = q.couponCode || undefined;
      return q.customer
        ? api<CheckoutQuote>('/v1/me/checkout/quote', {
            method: 'POST',
            body: { couponCode },
            signal,
          })
        : api<CheckoutQuote>('/v1/checkout/quote', {
            method: 'POST',
            body: { cartId: q.cartId, couponCode },
            auth: false,
            signal,
          });
    },
    enabled: computed(() => toValue(input) !== null),
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

type PlaceOrderVariables =
  | { customer: true; input: PlaceCustomerOrderInput; idempotencyKey: string }
  | { customer: false; input: PlaceGuestOrderInput; idempotencyKey: string };

/**
 * Coloca la orden (UC-ORD-02, API_SPEC §15.3). Exige `Idempotency-Key`: quien llama conserva la misma
 * llave mientras reenvía el mismo intento (REQUIREMENTS §4.4).
 */
export function usePlaceOrder() {
  const api = useApi();
  return useMutation<Order, ApiProblem, PlaceOrderVariables>({
    mutationFn: ({ customer, input, idempotencyKey }) =>
      api<Order>(customer ? '/v1/me/orders' : '/v1/orders', {
        method: 'POST',
        body: { ...input },
        auth: customer,
        idempotencyKey,
      }),
  });
}

/**
 * Inicia el pago manual (UC-PAY-01, API_SPEC §16.2), también con `Idempotency-Key`. El invitado
 * prueba que es quien compró con el `cartId` de origen.
 */
export function useStartPayment() {
  const api = useApi();
  return useMutation<
    PaymentStart,
    ApiProblem,
    { publicCode: string; cartId: string | null; idempotencyKey: string }
  >({
    mutationFn: ({ publicCode, cartId, idempotencyKey }) => {
      const code = encodeURIComponent(publicCode);
      return cartId
        ? api<PaymentStart>(`/v1/orders/${code}/payments`, {
            method: 'POST',
            body: { cartId, provider: 'MANUAL' },
            auth: false,
            idempotencyKey,
          })
        : api<PaymentStart>(`/v1/me/orders/${code}/payments`, {
            method: 'POST',
            body: { provider: 'MANUAL' },
            idempotencyKey,
          });
    },
  });
}

/** Estado actual de la orden: la del invitado se consulta con su email (§15.5), la del cliente por código. */
export function useFindOrder() {
  const api = useApi();
  return useMutation<
    Order,
    ApiProblem,
    { publicCode: string; contactEmail: string | null }
  >({
    mutationFn: ({ publicCode, contactEmail }) =>
      contactEmail
        ? api<Order>('/v1/orders/lookup', {
            method: 'POST',
            body: { contactEmail, publicCode },
            auth: false,
          })
        : api<Order>(`/v1/me/orders/${encodeURIComponent(publicCode)}`),
  });
}

/**
 * La orden recién colocada, solo en memoria (REQUIREMENTS §5.5): el `cartId` de origen prueba al
 * pagar que el invitado es quien compró, y no se guarda en el navegador.
 */
export interface CheckoutResult {
  order: Order;
  /** `cartId` de origen del invitado; `null` para el cliente. */
  cartId: string | null;
  /** Email de contacto del invitado, para consultar la orden; `null` para el cliente. */
  contactEmail: string | null;
  /** Una llave para iniciar el pago de esta orden, la misma en cada reintento. */
  paymentKey: string;
  payment: PaymentStart | null;
}

export function useCheckoutResult() {
  return useState<CheckoutResult | null>('checkout-result', () => null);
}
