<script setup lang="ts">
import { useBrands, useCategories, useProducts } from '~/features/catalog/api';
import CatalogFilters from '~/features/catalog/components/CatalogFilters.vue';
import ProductGrid from '~/features/catalog/components/ProductGrid.vue';
import {
  CATALOG_FILTERS,
  defaultSort,
  hasActiveFilters,
  sortOptions,
  toProductParams,
  unknownFilters,
  type CatalogFilter,
} from '~/features/catalog/filters';
import type { ProductSort } from '~/features/catalog/types';
import { useListParams } from '~/shared/api/use-list-params';

/** Catálogo con búsqueda, filtros, orden y paginación en la URL (REQUIREMENTS §5.2). */
const { page, filters, setFilter, setFilters, setPage } = useListParams({
  filters: CATALOG_FILTERS,
});
const params = computed(() => toProductParams(filters.value, page.value));
const products = useProducts(params);
const categories = useCategories();
const brands = useBrands();

const search = computed(() => params.value.q);
useHead({
  title: () =>
    search.value ? `Resultados para «${search.value}»` : 'Catálogo',
});

const sort = computed({
  get: () => params.value.sort ?? defaultSort(!!search.value),
  set: (value: ProductSort) =>
    setFilter(
      'sort',
      value === defaultSort(!!search.value) ? undefined : value,
    ),
});

const filtersOpen = ref(false);

function changeFilters(
  values: Partial<Record<CatalogFilter, string | undefined>>,
) {
  setFilters(values);
}
function clearFilters() {
  setFilters({
    category: undefined,
    brand: undefined,
    min: undefined,
    max: undefined,
    available: undefined,
  });
}

// Un enlace viejo con una categoría o marca que ya no está visible: se quita el filtro y se avisa (§5.2).
const notice = ref<string | null>(null);
const unknown = computed(() => unknownFilters(products.error.value));
watch(unknown, (fields) => {
  if (fields.length === 0) return;
  notice.value = fields.includes('category')
    ? 'La categoría que buscabas ya no está disponible. Quitamos ese filtro.'
    : 'Alguna de las marcas que elegiste ya no está disponible. Quitamos ese filtro.';
  setFilters(
    Object.fromEntries(fields.map((f) => [f, undefined])) as Partial<
      Record<CatalogFilter, undefined>
    >,
    { replace: true },
  );
});
const error = computed(() =>
  unknown.value.length > 0 ? null : products.error.value,
);

const meta = computed(() => products.data.value?.meta);
const items = computed(() => products.data.value?.data ?? []);
const pastLastPage = computed(
  () =>
    !!meta.value &&
    meta.value.totalItems > 0 &&
    meta.value.page > meta.value.totalPages,
);
const totalText = computed(() => {
  const total = meta.value?.totalItems ?? 0;
  return total === 1 ? '1 producto' : `${total} productos`;
});

function goToPage(value: number) {
  setPage(value);
  window.scrollTo({ top: 0 });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          <template v-if="search">Resultados para «{{ search }}»</template>
          <template v-else>Catálogo</template>
        </h1>
        <p
          class="text-sm text-muted"
          aria-live="polite"
          :aria-busy="products.isFetching.value"
        >
          <template v-if="meta">{{ totalText }}</template>
        </p>
      </div>
      <UFormField label="Ordenar por" name="sort" class="w-60">
        <USelect v-model="sort" :items="sortOptions(!!search)" class="w-full" />
      </UFormField>
    </div>

    <UAlert
      v-if="notice"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      role="status"
      :title="notice"
      close
      @update:open="notice = null"
    />

    <div class="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside aria-label="Filtros">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-sliders-horizontal"
          class="lg:hidden"
          :aria-expanded="filtersOpen"
          aria-controls="catalog-filters"
          @click="filtersOpen = !filtersOpen"
          >Filtros</UButton
        >
        <div
          id="catalog-filters"
          :class="filtersOpen ? 'mt-4 block' : 'hidden lg:block'"
        >
          <CatalogFilters
            :filters="filters"
            :categories="categories.data.value?.data"
            :brands="brands.data.value?.data"
            @change="changeFilters"
            @reset="clearFilters"
          />
        </div>
      </aside>

      <section aria-label="Productos" class="space-y-6">
        <QueryState
          :loading="products.isPending.value"
          :error="error"
          :empty="items.length === 0"
          :empty-title="
            pastLastPage ? 'Esta página no existe' : 'No encontramos productos'
          "
          :empty-description="
            pastLastPage
              ? 'Los resultados terminan antes de esta página.'
              : 'Prueba con otra búsqueda o quita algunos filtros.'
          "
          @retry="products.refetch()"
        >
          <template #loading>
            <ProductGrid :products="[]" heading-level="h2" loading />
          </template>
          <template #empty-actions>
            <UButton v-if="pastLastPage" @click="setPage(1)"
              >Ir a la página 1</UButton
            >
            <template v-else>
              <UButton v-if="hasActiveFilters(filters)" @click="clearFilters"
                >Quitar filtros</UButton
              >
              <UButton
                v-if="search"
                to="/products"
                color="neutral"
                variant="outline"
                >Ver todo el catálogo</UButton
              >
            </template>
          </template>
          <ProductGrid
            :products="items"
            heading-level="h2"
            :class="{ 'opacity-60': products.isPlaceholderData.value }"
          />
          <ListPagination :meta="meta" @update:page="goToPage" />
        </QueryState>
      </section>
    </div>
  </div>
</template>
