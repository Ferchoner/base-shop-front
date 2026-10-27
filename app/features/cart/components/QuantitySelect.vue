<script setup lang="ts">
import { MAX_QUANTITY, MIN_QUANTITY } from '../types';

/** Cantidad de 1 a 30 (BR-CRT-02); una lista evita valores fuera de rango y un cambio por elección. */
defineProps<{ label: string; disabled?: boolean }>();
const quantity = defineModel<number>({ required: true });

const items = Array.from(
  { length: MAX_QUANTITY - MIN_QUANTITY + 1 },
  (_, i) => ({ label: String(i + MIN_QUANTITY), value: i + MIN_QUANTITY }),
);
</script>

<template>
  <USelect
    v-model="quantity"
    :items="items"
    :aria-label="label"
    :disabled="disabled"
    class="w-20"
  />
</template>
