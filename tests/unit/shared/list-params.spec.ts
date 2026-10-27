import { describe, expect, it } from 'vitest';
import { readFilters, readPage } from '~/shared/api/use-list-params';

describe('lectura de la URL de un listado', () => {
  it('toma la página si es un entero positivo y si no la primera', () => {
    expect(readPage({ page: '3' })).toBe(3);
    expect(readPage({})).toBe(1);
    expect(readPage({ page: '0' })).toBe(1);
    expect(readPage({ page: '2.5' })).toBe(1);
    expect(readPage({ page: 'dos' })).toBe(1);
    expect(readPage({ page: ['4', '5'] })).toBe(4);
  });

  it('toma solo los filtros nombrados, el primero de cada uno y sin vacíos', () => {
    expect(
      readFilters({ category: ['camisas', 'pantalones'], q: '', otro: 'x' }, [
        'category',
        'q',
      ] as const),
    ).toEqual({ category: 'camisas', q: undefined });
  });
});
