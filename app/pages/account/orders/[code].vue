<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { cartKeys, useCartNotice } from '~/features/cart/api';
import {
  normalizeOrderCode,
  orderKeys,
  useMyOrder,
} from '~/features/orders/api';
import CustomerOrder from '~/features/orders/components/CustomerOrder.vue';
import { reorderNotice } from '~/features/orders/reorder';
import type { Reorder } from '~/features/orders/types';

/**
 * Detalle de uno de mis pedidos (REQUIREMENTS §5.12). Un código que no es del cliente responde 404,
 * igual que uno que no existe: la pantalla dice "Pedido no encontrado".
 */
const route = useRoute();
const code = computed(() => normalizeOrderCode(String(route.params.code)));
definePageMeta({ auth: true });
useHead({ title: () => `Pedido ${code.value}` });

const order = useMyOrder(code);
const notFound = computed(() => order.error.value?.type === 'not-found');
const cartNotice = useCartNotice();
const qc = useQueryClient();

function onReordered(result: Reorder) {
  cartNotice.value = reorderNotice(result);
  void qc.invalidateQueries({ queryKey: cartKeys.all });
  void navigateTo('/cart');
}

function onStale() {
  void qc.invalidateQueries({ queryKey: orderKeys.all });
}
</script>

<template>
  <div class="space-y-6">
    <AccountNav />
    <div class="max-w-3xl space-y-6">
      <UButton
        to="/account/orders"
        color="neutral"
        variant="link"
        icon="i-lucide-arrow-left"
        class="px-0"
        >Mis pedidos</UButton
      >

      <div v-if="notFound" class="space-y-4">
        <h1 class="text-2xl font-semibold">Pedido no encontrado</h1>
        <p>
          No encontramos el pedido {{ code }} en tu cuenta. Si compraste sin
          iniciar sesión, consúltalo con tu email.
        </p>
        <UButton to="/order-lookup" color="neutral" variant="outline"
          >Consultar un pedido</UButton
        >
      </div>

      <template v-else>
        <h1 class="sr-only">Pedido {{ code }}</h1>
        <QueryState
          :loading="order.isPending.value"
          :error="order.error.value"
          @retry="order.refetch()"
        >
          <CustomerOrder
            v-if="order.data.value"
            :order="order.data.value"
            @reordered="onReordered"
            @stale="onStale"
          />
        </QueryState>
      </template>
    </div>
  </div>
</template>
