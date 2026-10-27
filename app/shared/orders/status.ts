// Adaptado de base-ecomm-admin app/shared/status/sales.ts (commit bbcd5af, ADR-F009): solo los estados
// de la orden, con los textos que ve el comprador. Los usan el checkout y los pedidos.
import type { Schemas } from '~/shared/api/types';

export type OrderStatus = Schemas['OrderDto']['status'];

/** API_SPEC §8.8. Un valor nuevo de la API se muestra tal cual. */
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagada',
  AWAITING_MANUAL_FULFILLMENT: 'Pagada, preparando el envío',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Vencida: no se pagó a tiempo',
  REFUNDED: 'Reembolsada',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
}
