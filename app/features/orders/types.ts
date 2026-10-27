import type { Schemas } from '~/shared/api/types';

export type Order = Schemas['OrderDto'];
export type OrderSummary = Schemas['OrderSummaryDto'];
export type OrderAccess = Schemas['OrderAccessDto'];
export type Reorder = Schemas['ReorderDto'];

/** Email y código de una orden de invitado: solo viajan en el cuerpo (base-shop ADR-0071). */
export interface GuestOrderKey {
  contactEmail: string;
  publicCode: string;
}
