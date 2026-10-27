<script setup lang="ts">
import { useCategories, useProducts } from '~/features/catalog/api';
import CategoryLinks from '~/features/catalog/components/CategoryLinks.vue';
import ProductGrid from '~/features/catalog/components/ProductGrid.vue';

/** Inicio: categorías de primer nivel y los productos más recientes (REQUIREMENTS §5.1). */
useHead({ title: 'Tienda' });

const categories = useCategories();
const latest = useProducts({ sort: '-publishedAt', pageSize: 12 });
const products = computed(() => latest.data.value?.data ?? []);
</script>

<template>
  <div class="space-y-10">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold">Bienvenido a la tienda</h1>
      <p class="text-muted">
        Busca un producto en la parte de arriba o explora por categoría.
      </p>
    </div>

    <section
      v-if="
        !categories.isError.value && categories.data.value?.data.length !== 0
      "
      aria-labelledby="home-categories"
      class="space-y-3"
    >
      <h2 id="home-categories" class="text-xl font-semibold">Categorías</h2>
      <div
        v-if="categories.isPending.value"
        aria-hidden="true"
        class="flex gap-2"
      >
        <USkeleton v-for="n in 4" :key="n" class="h-8 w-24" />
      </div>
      <CategoryLinks v-else :categories="categories.data.value?.data ?? []" />
    </section>

    <section aria-labelledby="home-latest" class="space-y-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="home-latest" class="text-xl font-semibold">Lo más nuevo</h2>
        <NuxtLink
          v-if="products.length > 0"
          to="/products"
          class="text-sm font-medium text-primary hover:underline"
          >Ver todo el catálogo</NuxtLink
        >
      </div>
      <QueryState
        :loading="latest.isPending.value"
        :error="latest.error.value"
        :empty="products.length === 0"
        empty-title="Pronto tendremos productos"
        empty-description="Todavía no hay productos a la venta. Vuelve pronto."
        @retry="latest.refetch()"
      >
        <template #loading>
          <ProductGrid :products="[]" heading-level="h3" loading />
        </template>
        <ProductGrid :products="products" heading-level="h3" />
      </QueryState>
    </section>
  </div>
</template>
