// Adaptado de base-ecomm-admin app/features/orders/schemas.ts (commit bbcd5af, ADR-F009): el
// `storeOrderSchema` del pedido en tienda, reducido a lo que llena el comprador en línea.
import { z } from 'zod';
import {
  addressFieldsSchema,
  checkAddress,
  toAddressInput,
} from '~/shared/address/address-form';
import type { PlaceCustomerOrderInput, PlaceGuestOrderInput } from './types';

/** Contacto (solo invitado), dirección y aviso de privacidad (REQUIREMENTS §5.5, API_SPEC §15.3). */
export const checkoutSchema = z
  .object({
    customer: z.boolean(),
    contactEmail: z.string().trim(),
    privacy: z.boolean(),
    addressMode: z.enum(['saved', 'new']),
    addressId: z.string().optional(),
    address: addressFieldsSchema,
    /** El cliente guarda la dirección nueva en su libreta antes de colocar. */
    saveAddress: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: Array<string | number>, message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (!v.customer) {
      if (!z.email().max(254).safeParse(v.contactEmail).success)
        issue(['contactEmail'], 'Escribe un email válido.');
      if (!v.privacy)
        issue(['privacy'], 'Acepta el aviso de privacidad para continuar.');
    }
    if (v.customer && v.addressMode === 'saved') {
      if (!v.addressId) issue(['addressId'], 'Elige la dirección.');
    } else checkAddress(v.address, ctx, ['address']);
  });
export type CheckoutForm = z.input<typeof checkoutSchema>;

/** Cuerpo de `POST /v1/orders` a partir del formulario ya válido. */
export function toGuestOrderInput(
  v: CheckoutForm,
  cartId: string,
  expectedTotal: number,
  privacyNoticeVersion: string,
  couponCode: string,
): PlaceGuestOrderInput {
  return {
    cartId,
    contactEmail: v.contactEmail.trim(),
    shippingAddress: toAddressInput(v.address),
    expectedTotal,
    privacyNoticeVersion,
    ...(couponCode && { couponCode }),
  };
}

/** Cuerpo de `POST /v1/me/orders`: exactamente uno de `addressId` o `shippingAddress`. */
export function toCustomerOrderInput(
  v: CheckoutForm,
  expectedTotal: number,
  couponCode: string,
): PlaceCustomerOrderInput {
  return {
    ...(v.addressMode === 'saved' && v.addressId
      ? { addressId: v.addressId }
      : { shippingAddress: toAddressInput(v.address) }),
    expectedTotal,
    ...(couponCode && { couponCode }),
  };
}

/** Rutas de la API de los campos del formulario, para poner sus 400 junto a cada uno. */
export const API_FIELD_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(addressFieldsSchema.shape).map((f) => [
    `shippingAddress.${f}`,
    `address.${f}`,
  ]),
);
