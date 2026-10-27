import { describe, expect, it } from 'vitest';
import {
  couponProblemMessage,
  normalizeCoupon,
} from '~/features/checkout/coupon';
import {
  checkoutSchema,
  toCustomerOrderInput,
  toGuestOrderInput,
  type CheckoutForm,
} from '~/features/checkout/schemas';
import { emptyAddress } from '~/shared/address/address-form';
import { orderStatusLabel } from '~/shared/orders/status';

const address = {
  ...emptyAddress(),
  recipientName: 'Ana Ruiz',
  phone: '5512345678',
  street: 'Av. Juárez',
  exteriorNumber: '10',
  neighborhood: 'Centro',
  postalCode: '06000',
  stateCode: '09',
  municipalityCode: '015',
};

const guest = (extra: Partial<CheckoutForm> = {}): CheckoutForm => ({
  customer: false,
  contactEmail: ' ana@example.com ',
  privacy: true,
  addressMode: 'new',
  addressId: undefined,
  address,
  saveAddress: false,
  ...extra,
});

const issues = (form: CheckoutForm) =>
  checkoutSchema.safeParse(form).error?.issues.map((i) => i.path.join('.')) ??
  [];

describe('formulario del checkout (REQUIREMENTS §5.5)', () => {
  it('pide email y aviso de privacidad solo al invitado', () => {
    expect(issues(guest())).toEqual([]);
    expect(issues(guest({ contactEmail: 'ana', privacy: false }))).toEqual([
      'contactEmail',
      'privacy',
    ]);
    expect(
      issues(guest({ customer: true, contactEmail: '', privacy: false })),
    ).toEqual([]);
  });

  it('con dirección guardada no valida la nueva, pero exige elegirla', () => {
    const saved = guest({
      customer: true,
      addressMode: 'saved',
      address: emptyAddress(),
    });
    expect(issues(saved)).toEqual(['addressId']);
    expect(issues({ ...saved, addressId: 'a-1' })).toEqual([]);
    expect(issues(guest({ address: emptyAddress() }))).toContain(
      'address.recipientName',
    );
  });

  it('arma el cuerpo de la orden de invitado', () => {
    expect(toGuestOrderInput(guest(), 'cart-1', 74800, 'v1', '')).toEqual({
      cartId: 'cart-1',
      contactEmail: 'ana@example.com',
      shippingAddress: expect.objectContaining({
        recipientName: 'Ana Ruiz',
        interiorNumber: null,
      }),
      expectedTotal: 74800,
      privacyNoticeVersion: 'v1',
    });
    expect(
      toGuestOrderInput(guest(), 'cart-1', 74800, 'v1', 'OTONO10').couponCode,
    ).toBe('OTONO10');
  });

  it('el cliente manda la dirección guardada o la nueva, nunca las dos', () => {
    const saved = guest({
      customer: true,
      addressMode: 'saved',
      addressId: 'a-1',
    });
    expect(toCustomerOrderInput(saved, 129800, '')).toEqual({
      addressId: 'a-1',
      expectedTotal: 129800,
    });
    const fresh = toCustomerOrderInput(
      guest({ customer: true, addressId: 'a-1' }),
      129800,
      'OTONO10',
    );
    expect(fresh).not.toHaveProperty('addressId');
    expect(fresh).toMatchObject({
      shippingAddress: { street: 'Av. Juárez' },
      couponCode: 'OTONO10',
    });
  });
});

describe('cupones y estados (REQUIREMENTS §5.5, §5.6)', () => {
  it('explica por qué no aplica un cupón, también un motivo nuevo', () => {
    expect(couponProblemMessage('minimumNotMet')).toContain('mínimo');
    expect(couponProblemMessage('otroMotivo')).toBe(
      'El cupón no aplica a esta compra.',
    );
    expect(normalizeCoupon('  otono10 ')).toBe('OTONO10');
  });

  it('nombra el estado de la orden para el comprador', () => {
    expect(orderStatusLabel('EXPIRED')).toBe('Vencida: no se pagó a tiempo');
    expect(orderStatusLabel('NUEVO')).toBe('NUEVO');
  });
});
