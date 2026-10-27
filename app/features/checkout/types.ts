import type { Schemas } from '~/shared/api/types';

export type CheckoutQuote = Schemas['CheckoutQuoteDto'];
export type QuoteLine = Schemas['CheckoutQuoteLineDto'];
export type PlaceGuestOrderInput = Schemas['PlaceGuestOrderDto'];
export type PlaceCustomerOrderInput = Schemas['PlaceCustomerOrderDto'];
export type Order = Schemas['OrderDto'];
export type PaymentStart = Schemas['PaymentStartDto'];

/** Qué carrito se cotiza: el de la cuenta, o el de invitado con su `cartId`. */
export type QuoteInput =
  | { customer: true; couponCode: string }
  | { customer: false; cartId: string; couponCode: string };
