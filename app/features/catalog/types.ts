import type { Page, Schemas } from '~/shared/api/types';

export type ProductSummary = Schemas['ProductSummaryDto'];
export type ProductPage = Page<ProductSummary>;
export type ProductDetail = Schemas['ProductDetailDto'];
export type ProductVariant = Schemas['StoreVariantDto'];
export type ProductImage = Schemas['ImageDto'];
export type CategoryNode = Schemas['PublicCategoryDto'];
export type CategoryTree = Schemas['PublicCategoryTreeDto'];
export type Brand = Schemas['StoreBrandDto'];
export type BrandList = Schemas['StoreBrandListDto'];

/** Órdenes de `GET /v1/catalog/products` (API_SPEC §11.2). */
export type ProductSort =
  'relevance' | '-publishedAt' | 'price' | '-price' | 'title' | '-title';

/** Parámetros ya validados de `GET /v1/catalog/products`; precios en centavos. */
export interface ProductListParams {
  q?: string;
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize: number;
}
