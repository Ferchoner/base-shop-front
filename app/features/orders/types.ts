import type { Schemas } from '~/shared/api/types';

export type Order = Schemas['OrderDto'];
export type OrderSummary = Schemas['OrderSummaryDto'];
export type OrderAccess = Schemas['OrderAccessDto'];
export type Reorder = Schemas['ReorderDto'];
export type OrderPage = Schemas['OrderListDto'];

/** Filtros de `GET /v1/me/orders` que usa la tienda (§15.4). */
export interface MyOrdersParams {
  page: number;
  status?: string;
}

/** Email y código de una orden de invitado: solo viajan en el cuerpo (base-shop ADR-0071). */
export interface GuestOrderKey {
  contactEmail: string;
  publicCode: string;
}
