<script setup lang="ts">
import AddToCart from '~/features/cart/components/AddToCart.vue';
import { useProduct } from '~/features/catalog/api';
import ProductGallery from '~/features/catalog/components/ProductGallery.vue';
import VariantSelector from '~/features/catalog/components/VariantSelector.vue';
import {
  findVariant,
  galleryImages,
  type OptionSelection,
} from '~/features/catalog/variants';

/** Detalle de producto con selector de variantes (REQUIREMENTS §5.3). */
const route = useRoute();
const slug = computed(() => String(route.params.slug));
const product = useProduct(slug);
const data = computed(() => product.data.value);

const selection = ref<OptionSelection>({});
watch(slug, () => {
  selection.value = {};
});

const variant = computed(() =>
  data.value ? findVariant(data.value, selection.value) : null,
);
const images = computed(() =>
  galleryImages(data.value?.images ?? [], variant.value?.id),
);
const notFound = computed(() => product.error.value?.type === 'not-found');

useHead({
  title: () =>
    data.value?.title ??
    (notFound.value ? 'Producto no disponible' : 'Producto'),
});
</script>

<template>
  <div>
    <div v-if="notFound" class="space-y-4">
      <h1 class="text-2xl font-semibold">Producto no disponible</h1>
      <p class="text-muted">
        Este producto ya no está a la venta o el enlace no es correcto.
      </p>
      <UButton to="/products">Ver el catálogo</UButton>
    </div>
    <QueryState
      v-else
      :loading="product.isPending.value"
      :error="product.error.value"
      @retry="product.refetch()"
    >
      <template #loading>
        <div class="grid gap-8 md:grid-cols-2">
          <USkeleton class="aspect-square w-full" />
          <div class="space-y-3">
            <USkeleton class="h-8 w-3/4" />
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="h-24 w-full" />
          </div>
        </div>
      </template>
      <article v-if="data" class="grid gap-8 md:grid-cols-2">
        <ProductGallery :images="images" :title="data.title" />
        <div class="space-y-6">
          <div class="space-y-1">
            <p v-if="data.brand" class="text-sm text-muted">
              <NuxtLink
                :to="{ path: '/products', query: { brand: data.brand.slug } }"
                class="hover:underline"
                >{{ data.brand.name }}</NuxtLink
              >
            </p>
            <h1 class="text-2xl font-semibold">{{ data.title }}</h1>
          </div>

          <div aria-live="polite" class="space-y-1">
            <PriceTag
              v-if="variant"
              :price="variant.price"
              :compare-at="variant.compareAtPrice"
              size="lg"
              with-tax
            />
            <PriceTag
              v-else
              :price="data.fromPrice"
              :compare-at="data.compareAtPrice"
              size="lg"
              from
              with-tax
            />
            <p v-if="variant" class="text-sm">
              <UBadge v-if="!variant.available" color="neutral" variant="solid"
                >Agotado</UBadge
              >
              <span v-else class="text-success">Disponible</span>
            </p>
            <p v-else-if="!data.available" class="text-sm">
              <UBadge color="neutral" variant="solid">Agotado</UBadge>
            </p>
            <p v-else class="text-sm text-muted">
              Elige las opciones para ver el precio y la disponibilidad.
            </p>
          </div>

          <VariantSelector
            v-if="data.variants.length > 1"
            v-model="selection"
            :product="data"
          />

          <AddToCart
            :variant-id="variant?.id ?? null"
            :product-title="data.title"
            @unsellable="product.refetch()"
          />

          <section
            v-if="data.description"
            aria-labelledby="product-description"
          >
            <h2 id="product-description" class="mb-2 font-semibold">
              Descripción
            </h2>
            <!-- Texto, nunca HTML (SECURITY.md): los saltos de línea se respetan con CSS. -->
            <p class="whitespace-pre-line text-default">
              {{ data.description }}
            </p>
          </section>

          <section
            v-if="data.categories.length > 0"
            aria-labelledby="product-categories"
          >
            <h2 id="product-categories" class="mb-2 font-semibold">
              Categorías
            </h2>
            <ul role="list" class="flex flex-wrap gap-2">
              <li v-for="category in data.categories" :key="category.id">
                <UButton
                  :to="{
                    path: '/products',
                    query: { category: category.slug },
                  }"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  >{{ category.name }}</UButton
                >
              </li>
            </ul>
          </section>
        </div>
      </article>
    </QueryState>
  </div>
</template>
