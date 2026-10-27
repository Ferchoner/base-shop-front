<script setup lang="ts">
import type { CategoryNode } from '../types';

/** Categorías de primer nivel del inicio; cada una lleva al catálogo filtrado (REQUIREMENTS §5.1). */
defineProps<{ categories: readonly CategoryNode[] }>();
</script>

<template>
  <ul role="list" class="flex flex-wrap gap-2">
    <li v-for="category in categories" :key="category.id">
      <UButton
        :to="{ path: '/products', query: { category: category.slug } }"
        color="neutral"
        variant="outline"
        >{{ category.name }}</UButton
      >
    </li>
  </ul>
</template>
