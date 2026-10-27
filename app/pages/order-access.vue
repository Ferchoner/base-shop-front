<script setup lang="ts">
import { useLinkToken } from '~/features/account/api';
import { useQueryClient } from '@tanstack/vue-query';
import { cartKeys, useCartNotice } from '~/features/cart/api';
import { useLookupOrder, useOrderAccess } from '~/features/orders/api';
import AccessLinkForm from '~/features/orders/components/AccessLinkForm.vue';
import GuestOrder from '~/features/orders/components/GuestOrder.vue';
import { reorderNotice } from '~/features/orders/reorder';
import type { Reorder } from '~/features/orders/types';
import { orderStatus } from '~/shared/orders/status';
import { formatDate } from '~/shared/utils/dates';
import { formatMoney } from '~/shared/utils/money';

/**
 * Pedidos de invitado desde el enlace del correo (REQUIREMENTS §5.13). La ruta la fija la API:
 * `FRONTEND_BASE_URL/order-access?token=…` (API_SPEC §15.6). El token sirve una vez; el email y los
 * códigos quedan solo en la página.
 */
useHead({
  title: 'Mis pedidos de invitado',
  // El token ya salió de la URL, pero por si acaso no viaja en ningún Referer (SECURITY.md).
  meta: [{ name: 'referrer', content: 'no-referrer' }],
});

const token = useLinkToken();
const access = useOrderAccess();
const lookup = useLookupOrder();
const cartNotice = useCartNotice();
const qc = useQueryClient();
const selected = ref<string | null>(null);

const expired = computed(
  () => !token || access.error.value?.type === 'invalid-or-expired-token',
);
const otherProblem = computed(() =>
  access.error.value?.type === 'invalid-or-expired-token'
    ? null
    : access.error.value,
);

onMounted(() => {
  if (token) access.mutate(token);
});

/** El detalle se consulta con el email y el código, en el cuerpo (§15.5). */
function open(publicCode: string) {
  const contactEmail = access.data.value?.contactEmail;
  if (!contactEmail) return;
  selected.value = publicCode;
  lookup.mutate({ contactEmail, publicCode });
}

function back() {
  selected.value = null;
  lookup.reset();
}

function onReordered(result: Reorder) {
  cartNotice.value = reorderNotice(result);
  // El carrito cambió en la API: el contador y la página del carrito se vuelven a pedir.
  void qc.invalidateQueries({ queryKey: cartKeys.all });
  void navigateTo('/cart');
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Mis pedidos de invitado</h1>

    <div aria-live="polite">
      <p v-if="access.isPending.value" class="text-muted">
        Buscando tus pedidos…
      </p>
    </div>

    <div v-if="expired" class="max-w-md space-y-4">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-link-2-off"
        title="Este enlace ya no sirve."
        description="Vence a los 30 minutos y sirve una sola vez. Pide otro con tu email."
        role="alert"
      />
      <AccessLinkForm />
    </div>

    <ProblemAlert v-else-if="otherProblem" :problem="otherProblem" />

    <template v-else-if="access.data.value">
      <div v-if="selected" class="space-y-6">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="back"
          >Volver a mis pedidos</UButton
        >
        <QueryState
          :loading="lookup.isPending.value"
          :error="lookup.error.value"
          @retry="open(selected)"
        >
          <GuestOrder
            v-if="lookup.data.value"
            :order="lookup.data.value"
            :contact-email="access.data.value.contactEmail"
            @reordered="onReordered"
          />
        </QueryState>
      </div>

      <template v-else>
        <p class="text-muted">
          Pedidos de {{ access.data.value.contactEmail }}, del más reciente al
          más antiguo.
        </p>
        <p v-if="access.data.value.orders.length === 0">
          No hay pedidos de invitado con este email.
        </p>
        <ul
          v-else
          class="divide-y divide-default rounded-lg border border-default"
        >
          <li
            v-for="order in access.data.value.orders"
            :key="order.publicCode"
            class="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div class="space-y-1">
              <p class="font-mono font-medium">{{ order.publicCode }}</p>
              <p class="text-sm text-muted">
                {{ formatDate(order.placedAt) }} ·
                {{ order.itemCount }}
                {{ order.itemCount === 1 ? 'artículo' : 'artículos' }} ·
                {{ formatMoney(order.grandTotal) }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <UBadge
                :color="orderStatus(order.status).color"
                variant="subtle"
                >{{ orderStatus(order.status).label }}</UBadge
              >
              <UButton
                color="neutral"
                variant="outline"
                :aria-label="`Ver detalle del pedido ${order.publicCode}`"
                @click="open(order.publicCode)"
                >Ver detalle</UButton
              >
            </div>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
