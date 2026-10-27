<script setup lang="ts">
import { useGuestCart } from '../api';

/** Enlace al carrito del encabezado con `itemCount` en todas las pantallas (REQUIREMENTS §5.4, §5.15). */
const cart = useGuestCart();
const count = computed(() => cart.data.value?.itemCount ?? 0);
const label = computed(() =>
  count.value === 1
    ? 'Carrito, 1 artículo'
    : `Carrito, ${count.value} artículos`,
);
</script>

<template>
  <UButton
    to="/cart"
    color="neutral"
    variant="ghost"
    icon="i-lucide-shopping-cart"
    :aria-label="label"
  >
    <span aria-hidden="true" class="tabular-nums">{{ count }}</span>
  </UButton>
</template>
