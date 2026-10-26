<script setup lang="ts">
import type { Money } from '~/shared/api/types';
import { formatMoney } from '~/shared/utils/money';

/**
 * Precio tal como lo da la API, sin calcular nada (REQUIREMENTS §4.2, CLAUDE.md regla 15), con el
 * precio de comparación tachado cuando existe.
 */
const props = defineProps<{
  price: Money | null | undefined;
  compareAt?: Money | null;
  /** "Desde $…" en el listado, donde las variantes pueden tener otros precios. */
  from?: boolean;
  size?: 'sm' | 'lg';
  /** Muestra "IVA incluido" junto al precio. */
  withTax?: boolean;
}>();

const showCompare = computed(
  () =>
    !!props.compareAt &&
    !!props.price &&
    props.compareAt.amount > props.price.amount,
);
</script>

<template>
  <p class="flex flex-wrap items-baseline gap-x-2">
    <span :class="size === 'lg' ? 'text-2xl font-semibold' : 'font-semibold'">
      <template v-if="from">Desde </template>{{ formatMoney(price) }}
    </span>
    <span v-if="showCompare" class="text-sm text-muted">
      <span class="sr-only">Antes</span>
      <s>{{ formatMoney(compareAt) }}</s>
    </span>
    <span v-if="withTax" class="text-xs text-muted">IVA incluido</span>
  </p>
</template>
