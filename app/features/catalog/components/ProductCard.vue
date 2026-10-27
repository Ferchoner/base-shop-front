<script setup lang="ts">
import type { ProductSummary } from '../types';

/**
 * Tarjeta de producto del inicio y del catálogo (REQUIREMENTS §5.1). Toda la tarjeta lleva al detalle,
 * pero el lector de pantalla solo oye el título como enlace.
 */
defineProps<{
  product: ProductSummary;
  headingLevel: 'h2' | 'h3';
  /** Las primeras tarjetas se cargan sin esperar (Largest Contentful Paint, §6.2). */
  priority?: boolean;
}>();
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default focus-within:ring-2 focus-within:ring-primary"
  >
    <div class="relative aspect-square bg-elevated">
      <!-- La imagen repite el título del enlace: va con alt vacío (G-02: tamaño original). -->
      <img
        v-if="product.image"
        :src="product.image.url"
        alt=""
        width="400"
        height="400"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        class="size-full object-cover"
      />
      <div v-else class="flex size-full items-center justify-center">
        <UIcon
          name="i-lucide-image-off"
          class="size-10 text-muted"
          aria-hidden="true"
        />
      </div>
      <UBadge
        v-if="!product.available"
        color="neutral"
        variant="solid"
        class="absolute left-2 top-2"
        >Agotado</UBadge
      >
    </div>
    <div class="flex flex-1 flex-col gap-1 p-3">
      <component :is="headingLevel" class="font-medium leading-snug">
        <NuxtLink
          :to="`/products/${product.slug}`"
          class="after:absolute after:inset-0 focus:outline-none group-hover:underline"
          >{{ product.title }}</NuxtLink
        >
      </component>
      <p v-if="product.brand" class="text-sm text-muted">
        {{ product.brand.name }}
      </p>
      <PriceTag
        class="mt-auto pt-1"
        :price="product.fromPrice"
        :compare-at="product.compareAtPrice"
        from
      />
    </div>
  </article>
</template>
