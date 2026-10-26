<script setup lang="ts">
import type { ProductSummary } from '../types';
import ProductCard from './ProductCard.vue';

/** Rejilla de tarjetas, con esqueletos mientras carga (REQUIREMENTS §5.1). */
withDefaults(
  defineProps<{
    products: readonly ProductSummary[];
    headingLevel: 'h2' | 'h3';
    loading?: boolean;
    skeletons?: number;
    /** Tarjetas de la primera fila, que se cargan sin esperar. */
    priorityCount?: number;
  }>(),
  { skeletons: 8, priorityCount: 4 },
);
</script>

<template>
  <!-- El anuncio de carga lo hace QueryState; los esqueletos no se leen. -->
  <div
    v-if="loading"
    aria-hidden="true"
    class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
  >
    <div v-for="n in skeletons" :key="n" class="space-y-2">
      <USkeleton class="aspect-square w-full" />
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-4 w-1/3" />
    </div>
  </div>
  <ul
    v-else
    role="list"
    class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
  >
    <li v-for="(product, index) in products" :key="product.id">
      <ProductCard
        :product="product"
        :heading-level="headingLevel"
        :priority="index < priorityCount"
      />
    </li>
  </ul>
</template>
