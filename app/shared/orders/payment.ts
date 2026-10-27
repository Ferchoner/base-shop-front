import { useMutation } from '@tanstack/vue-query';
import type { ApiProblem } from '~/shared/api/problem';
import type { Schemas } from '~/shared/api/types';
import { useApi } from '~/shared/api/use-api';

export type PaymentStart = Schemas['PaymentStartDto'];

/**
 * Inicia el pago manual (UC-PAY-01, API_SPEC §16.2) con `Idempotency-Key`. El invitado prueba que es
 * quien compró con el `cartId` de origen; el cliente, con su sesión. Lo usan el checkout y los pedidos
 * del cliente, por eso vive en la capa compartida.
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

/** El pago en tienda está apagado (G-03): `validation-error` con `isEnabledProvider` en `provider`. */
export function isProviderDisabled(p: ApiProblem): boolean {
  return (
    p.type === 'validation-error' &&
    p.errors.some(
      (e) => e.field === 'provider' && e.code === 'isEnabledProvider',
    )
  );
}
