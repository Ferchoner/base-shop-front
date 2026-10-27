<script setup lang="ts">
import type { ProductImage } from '../types';

/**
 * Galería del detalle (REQUIREMENTS §5.3): imagen grande y miniaturas que la cambian. Las imágenes
 * llegan en su tamaño original (G-02).
 */
const props = defineProps<{
  images: readonly ProductImage[];
  title: string;
}>();

const current = ref(0);
// Al cambiar de variante cambia el orden: se vuelve a la primera, que es la suya.
watch(
  () => props.images.map((i) => i.id).join(),
  () => {
    current.value = 0;
  },
);
const main = computed(() => props.images[current.value] ?? props.images[0]);
const alt = (image: ProductImage) => image.altText ?? props.title;
</script>

<template>
  <div class="space-y-3">
    <div
      class="aspect-square overflow-hidden rounded-lg border border-default bg-elevated"
    >
      <img
        v-if="main"
        :src="main.url"
        :alt="alt(main)"
        width="800"
        height="800"
        fetchpriority="high"
        class="size-full object-contain"
      />
      <div v-else class="flex size-full items-center justify-center">
        <UIcon
          name="i-lucide-image-off"
          class="size-16 text-muted"
          aria-hidden="true"
        />
        <span class="sr-only">Sin imagen</span>
      </div>
    </div>
    <ul v-if="images.length > 1" role="list" class="flex flex-wrap gap-2">
      <li v-for="(image, index) in images" :key="image.id">
        <button
          type="button"
          class="size-16 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-primary"
          :class="index === current ? 'border-primary' : 'border-default'"
          :aria-label="`Ver imagen ${index + 1} de ${images.length}`"
          :aria-pressed="index === current"
          @click="current = index"
        >
          <img
            :src="image.url"
            alt=""
            width="64"
            height="64"
            loading="lazy"
            class="size-full object-cover"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
