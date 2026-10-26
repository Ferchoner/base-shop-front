<script setup lang="ts">
import { PESOS_PATTERN, pesosTextToCents } from '~/shared/utils/money';
import {
  MAX_BRANDS,
  hasActiveFilters,
  parseBrands,
  type CatalogFilter,
  type CatalogFilters,
} from '../filters';
import { flattenTree } from '../tree';
import type { Brand, CategoryNode } from '../types';

/**
 * Filtros del catálogo (REQUIREMENTS §5.2). Categoría, marcas y disponibilidad se aplican al cambiar;
 * el precio, con su botón, porque se escribe. El rango se valida aquí para no recibir `priceRange`.
 */
const props = defineProps<{
  filters: CatalogFilters;
  categories: readonly CategoryNode[] | undefined;
  brands: readonly Brand[] | undefined;
}>();
const emit = defineEmits<{
  change: [values: Partial<Record<CatalogFilter, string | undefined>>];
  reset: [];
}>();

const ALL = '__all';

const categoryItems = computed(() => [
  { label: 'Todas', value: ALL },
  ...flattenTree(props.categories ?? []).map(({ node, depth }) => ({
    label: `${'— '.repeat(depth)}${node.name}`,
    value: node.slug,
  })),
]);
const category = computed({
  get: () => props.filters.category ?? ALL,
  set: (value: string) =>
    emit('change', { category: value === ALL ? undefined : value }),
});

const selectedBrands = computed(() => parseBrands(props.filters.brand));
const brandItems = computed(() =>
  (props.brands ?? []).map((b) => ({
    label: b.name,
    value: b.slug,
    // La API acepta hasta 20 marcas a la vez (API_SPEC §11.2).
    disabled:
      selectedBrands.value.length >= MAX_BRANDS &&
      !selectedBrands.value.includes(b.slug),
  })),
);
function onBrands(value: (string | number | boolean)[]) {
  const slugs = value.map(String);
  emit('change', { brand: slugs.length > 0 ? slugs.join(',') : undefined });
}

const available = computed({
  get: () => props.filters.available === 'true',
  set: (value: boolean) =>
    emit('change', { available: value ? 'true' : undefined }),
});

const minText = ref('');
const maxText = ref('');
const priceError = ref<string | null>(null);
watch(
  () => [props.filters.min, props.filters.max],
  ([min, max]) => {
    minText.value = min ?? '';
    maxText.value = max ?? '';
    priceError.value = null;
  },
  { immediate: true },
);

function applyPrice() {
  const min = minText.value.trim();
  const max = maxText.value.trim();
  if ((min && !PESOS_PATTERN.test(min)) || (max && !PESOS_PATTERN.test(max))) {
    priceError.value =
      'Escribe el precio en pesos, sin signos, con hasta dos decimales.';
    return;
  }
  if (min && max && pesosTextToCents(min) > pesosTextToCents(max)) {
    priceError.value = 'El mínimo no puede ser mayor que el máximo.';
    return;
  }
  priceError.value = null;
  emit('change', { min: min || undefined, max: max || undefined });
}
</script>

<template>
  <div class="space-y-6">
    <UFormField label="Categoría" name="category">
      <USelect v-model="category" :items="categoryItems" class="w-full" />
    </UFormField>

    <UCheckboxGroup
      v-if="brandItems.length > 0"
      legend="Marca"
      :model-value="selectedBrands"
      :items="brandItems"
      @update:model-value="onBrands"
    />

    <form novalidate class="space-y-2" @submit.prevent="applyPrice">
      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">Precio en pesos</legend>
        <div class="flex gap-2">
          <UFormField label="Mínimo" name="min" class="flex-1">
            <UInput
              v-model="minText"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!priceError"
              :aria-describedby="priceError ? 'price-error' : undefined"
            />
          </UFormField>
          <UFormField label="Máximo" name="max" class="flex-1">
            <UInput
              v-model="maxText"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!priceError"
              :aria-describedby="priceError ? 'price-error' : undefined"
            />
          </UFormField>
        </div>
      </fieldset>
      <p
        v-if="priceError"
        id="price-error"
        class="text-sm text-error"
        aria-live="polite"
      >
        {{ priceError }}
      </p>
      <UButton type="submit" color="neutral" variant="outline" size="sm"
        >Aplicar precio</UButton
      >
    </form>

    <UCheckbox v-model="available" label="Solo disponibles" />

    <UButton
      v-if="hasActiveFilters(filters)"
      color="neutral"
      variant="link"
      icon="i-lucide-x"
      class="px-0"
      @click="emit('reset')"
      >Quitar filtros</UButton
    >
  </div>
</template>
