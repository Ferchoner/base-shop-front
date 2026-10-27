<script setup lang="ts">
import { useAddToCart } from '../api';
import { cartErrorMessage } from '../errors';
import QuantitySelect from './QuantitySelect.vue';

/**
 * Cantidad y "Agregar al carrito" del detalle de producto (REQUIREMENTS §5.3). Se habilita con una
 * combinación que existe; el aviso de éxito enlaza al carrito.
 */
const props = defineProps<{
  variantId: string | null;
  productTitle: string;
}>();
const emit = defineEmits<{ unsellable: [] }>();

const quantity = ref(1);
const add = useAddToCart();
const added = ref<string | null>(null);
const message = computed(() =>
  add.error.value ? cartErrorMessage(add.error.value) : null,
);

watch(
  () => props.variantId,
  () => {
    added.value = null;
    add.reset();
  },
);

async function submit() {
  if (!props.variantId) return;
  added.value = null;
  try {
    const units = quantity.value;
    await add.mutateAsync({ variantId: props.variantId, quantity: units });
    added.value =
      units === 1
        ? `Agregaste ${props.productTitle} al carrito.`
        : `Agregaste ${units} de ${props.productTitle} al carrito.`;
    quantity.value = 1;
  } catch (error) {
    if (add.error.value?.type === 'variant-not-sellable') emit('unsellable');
    void error;
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="Cantidad" name="quantity">
        <QuantitySelect v-model="quantity" label="Cantidad" />
      </UFormField>
      <UButton
        type="submit"
        size="lg"
        icon="i-lucide-shopping-cart"
        :disabled="!variantId"
        :loading="add.isPending.value"
        >Agregar al carrito</UButton
      >
    </div>
    <p v-if="!variantId" class="text-sm text-muted">
      Elige una combinación de opciones para agregarla.
    </p>
    <div aria-live="polite">
      <UAlert
        v-if="added"
        color="success"
        variant="subtle"
        icon="i-lucide-circle-check"
        :title="added"
      >
        <template #description>
          <NuxtLink to="/cart" class="font-medium underline"
            >Ver carrito</NuxtLink
          >
        </template>
      </UAlert>
    </div>
    <UAlert
      v-if="message"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      role="alert"
      :title="message"
    />
    <ProblemAlert v-else-if="add.error.value" :problem="add.error.value" />
  </form>
</template>
