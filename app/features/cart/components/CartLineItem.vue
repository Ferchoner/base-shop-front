<script setup lang="ts">
import { formatMoney } from '~/shared/utils/money';
import type { CartLine } from '../types';
import QuantitySelect from './QuantitySelect.vue';

/**
 * Línea del carrito (REQUIREMENTS §5.4). Una línea no vendible no tiene precio y solo se puede quitar;
 * una que no se puede surtir lo dice, sin revelar existencias.
 */
const props = defineProps<{ line: CartLine; busy: boolean }>();
const emit = defineEmits<{ quantity: [value: number]; remove: [] }>();

const options = computed(() =>
  Object.entries(props.line.options)
    .map(
      ([name, value]) =>
        `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${value}`,
    )
    .join(' · '),
);
const quantity = computed({
  get: () => props.line.quantity,
  set: (value: number) => emit('quantity', value),
});
</script>

<template>
  <article class="flex gap-4 py-4">
    <div class="size-20 shrink-0 overflow-hidden rounded-md bg-elevated">
      <img
        v-if="line.image"
        :src="line.image.url"
        alt=""
        width="80"
        height="80"
        loading="lazy"
        class="size-full object-cover"
      />
      <div v-else class="flex size-full items-center justify-center">
        <UIcon
          name="i-lucide-image-off"
          class="size-6 text-muted"
          aria-hidden="true"
        />
      </div>
    </div>
    <div
      class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between"
    >
      <div class="min-w-0 space-y-1">
        <h2 class="font-medium">
          <NuxtLink
            :to="`/products/${line.product.slug}`"
            class="hover:underline"
            >{{ line.product.title }}</NuxtLink
          >
        </h2>
        <p v-if="options" class="text-sm text-muted">{{ options }}</p>
        <p v-if="line.sellable && line.unitPrice" class="text-sm">
          {{ formatMoney(line.unitPrice) }} c/u
        </p>
        <p v-if="!line.sellable" class="text-sm font-medium text-error">
          Ya no está disponible
        </p>
        <p
          v-else-if="!line.canFulfill"
          class="text-sm font-medium text-warning"
        >
          No hay suficientes para la cantidad pedida
        </p>
      </div>
      <div class="flex items-center gap-3 sm:flex-col sm:items-end">
        <QuantitySelect
          v-model="quantity"
          :label="`Cantidad de ${line.product.title}`"
          :disabled="!line.sellable || busy"
        />
        <p v-if="line.lineTotal" class="font-semibold">
          {{ formatMoney(line.lineTotal) }}
        </p>
        <UButton
          color="neutral"
          variant="link"
          icon="i-lucide-trash-2"
          :aria-label="`Quitar ${line.product.title}`"
          :disabled="busy"
          @click="emit('remove')"
          >Quitar</UButton
        >
      </div>
    </div>
  </article>
</template>
