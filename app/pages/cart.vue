<script setup lang="ts">
import {
  useChangeLine,
  useCartNotice,
  useGuestCart,
} from '~/features/cart/api';
import CartLineItem from '~/features/cart/components/CartLineItem.vue';
import { cartErrorMessage } from '~/features/cart/errors';
import { formatMoney } from '~/shared/utils/money';

/** Carrito de invitado (REQUIREMENTS §5.4). Todo sale de la respuesta de la API, sin recalcular. */
useHead({ title: 'Carrito' });

const cart = useGuestCart();
const change = useChangeLine();
const notice = useCartNotice();
onBeforeUnmount(() => {
  notice.value = null;
});

const data = computed(() => cart.data.value ?? null);
const lines = computed(() => data.value?.lines ?? []);
const canCheckout = computed(() => lines.value.some((l) => l.sellable));
const changeMessage = computed(() =>
  change.error.value ? cartErrorMessage(change.error.value) : null,
);
const summary = computed(() => {
  const c = data.value;
  if (!c) return '';
  const items = c.itemCount === 1 ? '1 artículo' : `${c.itemCount} artículos`;
  return `${items}, subtotal ${formatMoney(c.subtotal)}`;
});

function setQuantity(variantId: string, quantity: number) {
  change.mutate({ variantId, quantity });
}
function remove(variantId: string) {
  change.mutate({ variantId, quantity: null });
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Carrito</h1>

    <UAlert
      v-if="notice"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      role="status"
      :title="notice"
    />

    <!-- Los cambios del carrito se anuncian (REQUIREMENTS §4.6). -->
    <p class="sr-only" aria-live="polite">{{ summary }}</p>

    <QueryState
      :loading="cart.isPending.value && cart.fetchStatus.value !== 'idle'"
      :error="cart.error.value"
      :empty="lines.length === 0"
      empty-title="Tu carrito está vacío"
      empty-description="Agrega productos desde el catálogo."
      @retry="cart.refetch()"
    >
      <template #empty-actions>
        <UButton to="/products">Ver el catálogo</UButton>
      </template>

      <div class="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Productos del carrito">
          <UAlert
            v-if="changeMessage"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            role="alert"
            :title="changeMessage"
            class="mb-4"
          />
          <ProblemAlert
            v-else-if="change.error.value"
            :problem="change.error.value"
            class="mb-4"
          />
          <ul role="list" class="divide-y divide-default">
            <li v-for="line in lines" :key="line.variantId">
              <CartLineItem
                :line="line"
                :busy="change.isPending.value"
                @quantity="(q) => setQuantity(line.variantId, q)"
                @remove="remove(line.variantId)"
              />
            </li>
          </ul>
        </section>

        <aside
          aria-labelledby="cart-summary"
          class="h-fit space-y-3 rounded-lg border border-default p-4"
        >
          <h2 id="cart-summary" class="font-semibold">Resumen</h2>
          <dl class="space-y-1">
            <div class="flex justify-between">
              <dt>Artículos</dt>
              <dd class="tabular-nums">{{ data?.itemCount }}</dd>
            </div>
            <div class="flex justify-between font-semibold">
              <dt>Subtotal</dt>
              <dd class="tabular-nums">{{ formatMoney(data?.subtotal) }}</dd>
            </div>
          </dl>
          <p class="text-sm text-muted">
            IVA incluido. No incluye envío ni descuentos: los verás en el
            checkout.
          </p>
          <UButton to="/checkout" block size="lg" :disabled="!canCheckout"
            >Continuar al checkout</UButton
          >
          <p v-if="!canCheckout" class="text-sm text-muted">
            Ningún producto del carrito está a la venta.
          </p>
        </aside>
      </div>
    </QueryState>
  </div>
</template>
