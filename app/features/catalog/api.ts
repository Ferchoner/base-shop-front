import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import type { ApiClient } from '~/shared/api/client';
import type { ApiProblem } from '~/shared/api/problem';
import { useApi } from '~/shared/api/use-api';
import type {
  BrandList,
  CategoryTree,
  ProductDetail,
  ProductListParams,
  ProductPage,
} from './types';

const BASE = '/v1/catalog';

/** Las cachés de la API duran 120 s (API_SPEC §11.2 a §11.5): no tiene caso pedir antes. */
const STALE_TIME = 60_000;

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  brands: () => [...catalogKeys.all, 'brands'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  productList: (params: ProductListParams) =>
    [...catalogKeys.products(), 'list', params] as const,
  product: (slug: string) =>
    [...catalogKeys.products(), 'detail', slug] as const,
};

// Opciones de cada lectura, compartidas por los `use*` de las pantallas y por los `prefetch*` que
// las piden antes de pintar (plugins/04.page-prefetch.ts): la misma clave evita pedir dos veces.

function categoriesQuery(api: ApiClient) {
  return {
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api<CategoryTree>(`${BASE}/categories`, { auth: false, signal }),
    staleTime: STALE_TIME,
  };
}

function brandsQuery(api: ApiClient) {
  return {
    queryKey: catalogKeys.brands(),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api<BrandList>(`${BASE}/brands`, { auth: false, signal }),
    staleTime: STALE_TIME,
  };
}

function productsQuery(api: ApiClient, params: ProductListParams) {
  return {
    queryKey: catalogKeys.productList(params),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api<ProductPage>(`${BASE}/products`, {
        auth: false,
        query: { ...params },
        signal,
      }),
    staleTime: STALE_TIME,
  };
}

function productQuery(api: ApiClient, slug: string) {
  return {
    queryKey: catalogKeys.product(slug),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api<ProductDetail>(`${BASE}/products/${encodeURIComponent(slug)}`, {
        auth: false,
        signal,
      }),
    staleTime: STALE_TIME,
  };
}

export function useCategories() {
  return useQuery<CategoryTree, ApiProblem>(categoriesQuery(useApi()));
}

export function useBrands() {
  return useQuery<BrandList, ApiProblem>(brandsQuery(useApi()));
}

export function useProducts(params: MaybeRefOrGetter<ProductListParams>) {
  const api = useApi();
  const query = computed(() => productsQuery(api, toValue(params)));
  return useQuery<ProductPage, ApiProblem>({
    queryKey: computed(() => query.value.queryKey),
    queryFn: (context) => query.value.queryFn(context),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });
}

export function useProduct(slug: MaybeRefOrGetter<string>) {
  const api = useApi();
  const query = computed(() => productQuery(api, toValue(slug)));
  return useQuery<ProductDetail, ApiProblem>({
    queryKey: computed(() => query.value.queryKey),
    queryFn: (context) => query.value.queryFn(context),
    staleTime: STALE_TIME,
  });
}

/** Catálogo: la página de productos de la URL, con las categorías y marcas de los filtros. */
export function prefetchCatalog(params: ProductListParams) {
  const api = useApi();
  const qc = useQueryClient();
  void qc.prefetchQuery(productsQuery(api, params));
  void qc.prefetchQuery(categoriesQuery(api));
  void qc.prefetchQuery(brandsQuery(api));
}

export function prefetchProduct(slug: string) {
  void useQueryClient().prefetchQuery(productQuery(useApi(), slug));
}
