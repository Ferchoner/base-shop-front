import { describe, expect, it } from 'vitest';
import { normalizeOrderCode } from '~/features/orders/api';
import { reorderNotice } from '~/features/orders/reorder';
import {
  canReorder,
  orderStatus,
  paymentStatusLabel,
  promotionLabel,
  refundPending,
  shipmentStatusLabel,
} from '~/shared/orders/status';

describe('pedidos de invitado (REQUIREMENTS §5.12, §5.13)', () => {
  it('normaliza el código como la API', () => {
    expect(normalizeOrderCode('  k7m4q9xa ')).toBe('K7M4Q9XA');
  });

  it('solo deja volver a comprar una orden cancelada o reembolsada', () => {
    expect(canReorder('CANCELLED')).toBe(true);
    expect(canReorder('REFUNDED')).toBe(true);
    expect(canReorder('EXPIRED')).toBe(false);
    expect(canReorder('PENDING_PAYMENT')).toBe(false);
  });

  it('avisa del reembolso pendiente de una orden cancelada ya cobrada', () => {
    expect(refundPending('CANCELLED', 'CAPTURED')).toBe(true);
    expect(refundPending('CANCELLED', undefined)).toBe(false);
    expect(refundPending('REFUNDED', 'REFUNDED')).toBe(false);
  });

  it('nombra y explica los estados, también uno nuevo de la API', () => {
    expect(orderStatus('EXPIRED').hint).toContain('regresaron a tu carrito');
    expect(orderStatus('NUEVO')).toEqual({
      label: 'NUEVO',
      hint: '',
      color: 'neutral',
    });
    expect(paymentStatusLabel('CAPTURED')).toBe('Pagado');
    expect(shipmentStatusLabel('DISPATCHED')).toBe('En camino');
    expect(
      promotionLabel({ id: 'p', code: 'OTONO10', name: 'Otoño 10 %' }),
    ).toBe('Otoño 10 %, cupón OTONO10');
  });

  it('cuenta las variantes que no se copiaron al volver a comprar', () => {
    expect(reorderNotice({ cartId: 'c', skippedVariantIds: [] })).toBe(
      'Agregamos los productos de tu orden al carrito.',
    );
    expect(reorderNotice({ cartId: 'c', skippedVariantIds: ['a'] })).toContain(
      'Uno ya no está a la venta',
    );
    expect(
      reorderNotice({ cartId: 'c', skippedVariantIds: ['a', 'b'] }),
    ).toContain('2 ya no están a la venta');
  });
});
