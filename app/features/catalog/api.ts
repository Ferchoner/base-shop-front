import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
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

export function useCategories() {
  const api = useApi();
  return useQuery<CategoryTree, ApiProblem>({
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }) =>
      api<CategoryTree>(`${BASE}/categories`, { auth: false, signal }),
    staleTime: STALE_TIME,
  });
}

export function useBrands() {
  const api = useApi();
  return useQuery<BrandList, ApiProblem>({
    queryKey: catalogKeys.brands(),
    queryFn: ({ signal }) =>
      api<BrandList>(`${BASE}/brands`, { auth: false, signal }),
    staleTime: STALE_TIME,
  });
}

export function useProducts(params: MaybeRefOrGetter<ProductListParams>) {
  const api = useApi();
  return useQuery<ProductPage, ApiProblem>({
    queryKey: computed(() => catalogKeys.productList(toValue(params))),
    queryFn: ({ signal }) =>
      api<ProductPage>(`${BASE}/products`, {
        auth: false,
        query: { ...toValue(params) },
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });
}

export function useProduct(slug: MaybeRefOrGetter<string>) {
  const api = useApi();
  return useQuery<ProductDetail, ApiProblem>({
    queryKey: computed(() => catalogKeys.product(toValue(slug))),
    queryFn: ({ signal }) =>
      api<ProductDetail>(
        `${BASE}/products/${encodeURIComponent(toValue(slug))}`,
        { auth: false, signal },
      ),
    staleTime: STALE_TIME,
  });
}
