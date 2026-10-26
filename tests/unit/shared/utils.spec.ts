// Copiado de base-ecomm-admin tests/unit/shared/utils.spec.ts (commit bbcd5af, ADR-F009). Solo los casos de lo que se copió.
import { describe, expect, it } from 'vitest';
import { toQuery } from '~/shared/api/client';
import { formatDateTime } from '~/shared/utils/dates';
import { formatMoney, pesosToCents } from '~/shared/utils/money';

describe('dinero', () => {
  it('muestra centavos como pesos MXN', () => {
    expect(formatMoney({ amount: 129900, currency: 'MXN' })).toBe('$1,299.00');
    expect(formatMoney(null)).toBe('—');
  });
  it('convierte pesos a centavos sin errores de redondeo', () => {
    expect(pesosToCents(599.99)).toBe(59999);
    expect(pesosToCents(0.1 + 0.2)).toBe(30);
  });
});

describe('fechas', () => {
  it('tolera nulos y valores inválidos', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('no-es-fecha')).toBe('—');
    expect(formatDateTime('2026-09-25T18:30:00.000Z')).toMatch(/2026/);
  });
});

describe('toQuery (API_SPEC §5.3)', () => {
  it('une listas con coma y quita vacíos', () => {
    expect(
      toQuery({
        status: ['PAID', 'SHIPPED'],
        q: '',
        page: 2,
        guest: false,
        x: undefined,
        y: null,
        z: [],
      }),
    ).toEqual({
      status: 'PAID,SHIPPED',
      page: '2',
      guest: 'false',
    });
  });
});
