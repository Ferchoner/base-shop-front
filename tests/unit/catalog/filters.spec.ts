import { describe, expect, it } from 'vitest';
import {
  defaultSort,
  hasActiveFilters,
  parseBrands,
  sortOptions,
  toProductParams,
  unknownFilters,
} from '~/features/catalog/filters';
import { ApiProblem } from '~/shared/api/problem';

describe('toProductParams (REQUIREMENTS §5.2)', () => {
  it('usa pageSize 24 y omite lo vacío', () => {
    expect(toProductParams({}, 1)).toEqual({ pageSize: 24 });
  });

  it('envía los precios en centavos', () => {
    expect(toProductParams({ min: '100', max: '599.5' }, 1)).toMatchObject({
      minPrice: 10000,
      maxPrice: 59950,
    });
  });

  it('descarta lo que la API rechazaría', () => {
    const params = toProductParams(
      {
        q: 'a',
        min: '500',
        max: '100',
        sort: 'relevance',
        available: 'si',
        category: 'x'.repeat(101),
      },
      1,
    );
    expect(params).toEqual({ pageSize: 24, minPrice: 50000 });
  });

  it('acepta relevancia solo con búsqueda', () => {
    expect(toProductParams({ q: 'lino', sort: 'relevance' }, 1).sort).toBe(
      'relevance',
    );
    expect(toProductParams({ sort: 'otra' }, 1).sort).toBeUndefined();
  });

  it('limita las marcas a 20 sin repetir', () => {
    const many = Array.from({ length: 25 }, (_, i) => `m${i}`).join(',');
    expect(toProductParams({ brand: many }, 1).brand).toHaveLength(20);
    expect(parseBrands('a,,b,a')).toEqual(['a', 'b']);
  });

  it('pasa la página solo si no es la primera', () => {
    expect(toProductParams({}, 3).page).toBe(3);
    expect(toProductParams({}, 1).page).toBeUndefined();
  });
});

describe('orden', () => {
  it('"Relevancia" solo aparece con búsqueda', () => {
    expect(sortOptions(false).map((o) => o.value)).not.toContain('relevance');
    expect(sortOptions(true)[0]).toEqual({
      value: 'relevance',
      label: 'Relevancia',
    });
    expect(defaultSort(false)).toBe('-publishedAt');
  });
});

describe('filtros activos', () => {
  it('no cuenta la búsqueda ni el orden', () => {
    expect(hasActiveFilters({ q: 'lino', sort: 'price' })).toBe(false);
    expect(hasActiveFilters({ available: 'true' })).toBe(true);
  });
});

describe('unknownFilters', () => {
  it('reconoce la categoría y las marcas que ya no están visibles', () => {
    const problem = new ApiProblem({
      type: 'validation-error',
      status: 400,
      title: '',
      errors: [
        { field: 'category', code: 'unknownCategory', message: '' },
        { field: 'brand', code: 'unknownBrands', message: '' },
      ],
    });
    expect(unknownFilters(problem)).toEqual(['category', 'brand']);
    expect(
      unknownFilters(
        new ApiProblem({ type: 'internal-error', status: 500, title: '' }),
      ),
    ).toEqual([]);
  });
});
