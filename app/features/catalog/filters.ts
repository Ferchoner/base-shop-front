import { ApiProblem } from '~/shared/api/problem';
import { PESOS_PATTERN, pesosTextToCents } from '~/shared/utils/money';
import type { ProductListParams, ProductSort } from './types';

/** Filtros del catálogo en la URL. Los precios van en pesos, como los escribe el cliente. */
export const CATALOG_FILTERS = [
  'q',
  'category',
  'brand',
  'min',
  'max',
  'available',
  'sort',
] as const;
export type CatalogFilter = (typeof CATALOG_FILTERS)[number];
export type CatalogFilters = Record<CatalogFilter, string | undefined>;

/** Tamaño de página fijo del catálogo (REQUIREMENTS §5.2). */
export const CATALOG_PAGE_SIZE = 24;

// Límites de `GET /v1/catalog/products` (API_SPEC §11.2 y openapi/v1.json).
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;
export const MAX_BRANDS = 20;
const MAX_SLUG = 100;
const MAX_CENTS = 2_147_483_647;

const SORTS: readonly ProductSort[] = [
  'relevance',
  '-publishedAt',
  'price',
  '-price',
  'title',
  '-title',
];

const SORT_LABELS: Record<ProductSort, string> = {
  relevance: 'Relevancia',
  '-publishedAt': 'Más recientes',
  price: 'Precio: de menor a mayor',
  '-price': 'Precio: de mayor a menor',
  title: 'Nombre: de la A a la Z',
  '-title': 'Nombre: de la Z a la A',
};

/** "Relevancia" solo con búsqueda; sin ella, el predeterminado es "Más recientes" (§5.2). */
export function defaultSort(hasSearch: boolean): ProductSort {
  return hasSearch ? 'relevance' : '-publishedAt';
}

export function sortOptions(hasSearch: boolean) {
  return SORTS.filter((s) => hasSearch || s !== 'relevance').map((value) => ({
    value,
    label: SORT_LABELS[value],
  }));
}

/** Marcas de la URL (`a,b`), sin vacías ni repetidas. */
export function parseBrands(value: string | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(',').map((s) => s.trim()))].filter(
    (s) => s.length >= 1 && s.length <= MAX_SLUG,
  );
}

function priceCents(value: string | undefined): number | undefined {
  if (!value || !PESOS_PATTERN.test(value)) return undefined;
  const cents = pesosTextToCents(value);
  return cents <= MAX_CENTS ? cents : undefined;
}

/**
 * Filtros de la URL → parámetros de la API. Lo que la API rechazaría se descarta aquí, para que un
 * enlace viejo o editado a mano no termine en un error (`priceRange`, `relevanceNeedsQ`, §5.2).
 */
export function toProductParams(
  filters: Partial<CatalogFilters>,
  page: number,
): ProductListParams {
  const params: ProductListParams = { pageSize: CATALOG_PAGE_SIZE };
  const q = filters.q?.trim();
  if (q && q.length >= SEARCH_MIN && q.length <= SEARCH_MAX) params.q = q;
  if (filters.category && filters.category.length <= MAX_SLUG)
    params.category = filters.category;
  const brands = parseBrands(filters.brand).slice(0, MAX_BRANDS);
  if (brands.length > 0) params.brand = brands;
  const min = priceCents(filters.min);
  const max = priceCents(filters.max);
  if (min !== undefined) params.minPrice = min;
  if (max !== undefined && (min === undefined || max >= min))
    params.maxPrice = max;
  if (filters.available === 'true') params.available = true;
  const sort = filters.sort as ProductSort | undefined;
  if (sort && SORTS.includes(sort) && (sort !== 'relevance' || params.q))
    params.sort = sort;
  if (page > 1) params.page = page;
  return params;
}

/** Hay filtros aparte de la búsqueda y el orden. */
export function hasActiveFilters(filters: Partial<CatalogFilters>): boolean {
  return !!(
    filters.category ||
    filters.brand ||
    filters.min ||
    filters.max ||
    filters.available
  );
}

/**
 * Filtros que la API rechazó porque la categoría o alguna marca ya no está visible (un enlace viejo,
 * §5.2). Se quitan de la URL y se avisa.
 */
export function unknownFilters(error: unknown): ('category' | 'brand')[] {
  if (!(error instanceof ApiProblem) || error.type !== 'validation-error')
    return [];
  const out: ('category' | 'brand')[] = [];
  for (const e of error.errors) {
    if (e.field === 'category' && e.code === 'unknownCategory')
      out.push('category');
    if (e.field === 'brand' && e.code === 'unknownBrands') out.push('brand');
  }
  return out;
}
