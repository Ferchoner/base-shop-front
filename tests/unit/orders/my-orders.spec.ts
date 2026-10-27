import { describe, expect, it } from 'vitest';
import {
  ALL_STATUSES,
  itemCountLabel,
  statusFilterOptions,
  statusFromQuery,
} from '~/features/orders/my-orders';
import { ApiProblem } from '~/shared/api/problem';
import { isProviderDisabled } from '~/shared/orders/payment';

describe('mis pedidos (REQUIREMENTS §5.12)', () => {
  it('filtra por cualquiera de los ocho estados de la orden, o por ninguno', () => {
    const options = statusFilterOptions();
    expect(options[0]).toEqual({ value: ALL_STATUSES, label: 'Todos' });
    expect(options).toHaveLength(9);
    expect(options).toContainEqual({
      value: 'AWAITING_MANUAL_FULFILLMENT',
      label: 'Pagada, preparando el envío',
    });
  });

  it('ignora un estado de la URL que la API no conoce', () => {
    expect(statusFromQuery('SHIPPED')).toBe('SHIPPED');
    expect(statusFromQuery('shipped')).toBeUndefined();
    expect(statusFromQuery(ALL_STATUSES)).toBeUndefined();
    expect(statusFromQuery(undefined)).toBeUndefined();
  });

  it('cuenta los artículos en palabras', () => {
    expect(itemCountLabel(1)).toBe('1 artículo');
    expect(itemCountLabel(3)).toBe('3 artículos');
  });

  it('reconoce el pago en tienda apagado (G-03)', () => {
    const problem = (field: string, code: string) =>
      new ApiProblem({
        type: 'validation-error',
        status: 400,
        title: '',
        errors: [{ field, code, message: '' }],
      });
    expect(isProviderDisabled(problem('provider', 'isEnabledProvider'))).toBe(
      true,
    );
    expect(isProviderDisabled(problem('cartId', 'isUuid'))).toBe(false);
  });
});
