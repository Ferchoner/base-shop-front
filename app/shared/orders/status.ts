// Adaptado de base-ecomm-admin app/shared/status/sales.ts (commit bbcd5af, ADR-F009): los estados de
// la orden, del pago y del envío, con los textos que ve el comprador. Los usan el checkout y los pedidos.
import type { Schemas } from '~/shared/api/types';

export type OrderStatus = Schemas['OrderDto']['status'];
type PaymentStatus = Schemas['OrderPaymentDto']['status'];
type ShipmentStatus = Schemas['OrderShipmentDto']['status'];
type BadgeColor = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface StatusText {
  label: string;
  /** Explicación corta (REQUIREMENTS §5.12). */
  hint: string;
  color: BadgeColor;
}

/** API_SPEC §8.8. Un valor nuevo de la API se muestra tal cual. */
const ORDER_STATUS: Record<OrderStatus, StatusText> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    hint: 'Tus productos están apartados hasta la fecha límite de pago.',
    color: 'warning',
  },
  PAID: { label: 'Pagada', hint: 'Recibimos tu pago.', color: 'info' },
  AWAITING_MANUAL_FULFILLMENT: {
    label: 'Pagada, preparando el envío',
    hint: 'Estamos preparando tu pedido.',
    color: 'info',
  },
  SHIPPED: { label: 'Enviada', hint: 'Tu pedido va en camino.', color: 'info' },
  DELIVERED: {
    label: 'Entregada',
    hint: 'Tu pedido fue entregado.',
    color: 'success',
  },
  CANCELLED: {
    label: 'Cancelada',
    hint: 'La orden se canceló.',
    color: 'neutral',
  },
  EXPIRED: {
    label: 'Vencida: no se pagó a tiempo',
    hint: 'Venció sin pago; los productos regresaron a tu carrito.',
    color: 'neutral',
  },
  REFUNDED: {
    label: 'Reembolsada',
    hint: 'Te devolvimos el pago de esta orden.',
    color: 'neutral',
  },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status as OrderStatus]?.label ?? status;
}

export function orderStatus(status: string): StatusText {
  return (
    ORDER_STATUS[status as OrderStatus] ?? {
      label: status,
      hint: '',
      color: 'neutral',
    }
  );
}

/** Solo una orden cancelada o reembolsada se puede volver a comprar (API_SPEC §14.3). */
export function canReorder(status: string): boolean {
  return status === 'CANCELLED' || status === 'REFUNDED';
}

/** Un pago cobrado de una orden cancelada espera su reembolso (REQUIREMENTS §5.12). */
export function refundPending(
  status: string,
  paymentStatus: string | undefined,
): boolean {
  return (
    status === 'CANCELLED' &&
    (paymentStatus === 'CAPTURED' || paymentStatus === 'PARTIALLY_REFUNDED')
  );
}

const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  REQUIRES_ACTION: 'Pendiente',
  AUTHORIZED: 'Autorizado',
  CAPTURED: 'Pagado',
  FAILED: 'No se completó',
  CANCELLED: 'Cancelado',
  PARTIALLY_REFUNDED: 'Reembolso parcial',
  REFUNDED: 'Reembolsado',
};

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS[status as PaymentStatus] ?? status;
}

/** API_SPEC §17 (ADR-0140). */
const SHIPMENT_STATUS: Record<ShipmentStatus, string> = {
  PENDING: 'Por enviar',
  DISPATCHED: 'En camino',
  DELIVERED: 'Entregado',
  DELIVERY_FAILED: 'No se pudo entregar',
  RETURNED: 'Devuelto a la tienda',
  CANCELLED: 'Cancelado',
};

export function shipmentStatusLabel(status: string): string {
  return SHIPMENT_STATUS[status as ShipmentStatus] ?? status;
}

/** Promoción de una orden (API_SPEC §26.7): nombre y, si es cupón, su código. */
export function promotionLabel(p: Schemas['AppliedPromotionDto']): string {
  return p.code ? `${p.name}, cupón ${p.code}` : p.name;
}
