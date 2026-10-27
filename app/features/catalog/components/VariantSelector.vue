<script setup lang="ts">
import type { ProductDetail } from '../types';
import {
  optionLabel,
  optionValues,
  selectOption,
  type OptionSelection,
} from '../variants';

/**
 * Selector de opciones según `optionNames` (REQUIREMENTS §5.3). Las combinaciones que no existen no
 * se pueden elegir; las agotadas se marcan, pero se pueden ver.
 */
const props = defineProps<{
  product: Pick<ProductDetail, 'optionNames' | 'variants'>;
}>();
const selection = defineModel<OptionSelection>({ required: true });

const values = computed(() => optionValues(props.product, selection.value));

function items(name: string) {
  return (values.value[name] ?? []).map((v) => ({
    label: v.value,
    value: v.value,
    description: v.selectable && !v.available ? 'Agotado' : undefined,
    disabled: !v.selectable,
  }));
}

function choose(name: string, value: unknown) {
  selection.value = selectOption(
    props.product,
    selection.value,
    name,
    String(value),
  );
}
</script>

<template>
  <div class="space-y-4">
    <URadioGroup
      v-for="name in product.optionNames"
      :key="name"
      :legend="optionLabel(name)"
      :model-value="selection[name]"
      :items="items(name)"
      orientation="horizontal"
      variant="card"
      :ui="{ fieldset: 'flex-wrap gap-2', legend: 'mb-2 font-medium' }"
      @update:model-value="(value) => choose(name, value)"
    />
  </div>
</template>
