<script setup lang="ts">
import type { Schemas } from '~/shared/api/types';
import {
  orderStatus,
  paymentStatusLabel,
  refundPending,
  shipmentStatusLabel,
} from '~/shared/orders/status';
import { formatDate, formatDateTime } from '~/shared/utils/dates';

/**
 * Detalle de una orden para el comprador (REQUIREMENTS §5.12): estado con su explicación, fechas,
 * pago, envío, dirección y líneas. Las acciones de cada pantalla van en el slot `actions`.
 */
const props = defineProps<{ order: Schemas['OrderDto'] }>();
const status = computed(() => orderStatus(props.order.status));
// El estado cambia en segundo plano tras un pago o un vencimiento (REQUIREMENTS §4.3).
const mayLag = computed(
  () =>
    props.order.status === 'PENDING_PAYMENT' ||
    props.order.status === 'EXPIRED',
);
const delivery = computed(() => {
  const d = props.order.estimatedDelivery;
  return d
    ? `De ${d.minBusinessDays} a ${d.maxBusinessDays} días hábiles después del pago`
    : null;
});
</script>

<template>
  <article class="space-y-6" :aria-labelledby="`order-${order.publicCode}`">
    <header class="space-y-2">
      <h2
        :id="`order-${order.publicCode}`"
        class="flex flex-wrap items-center gap-3 text-xl font-semibold"
      >
        Orden <span class="font-mono">{{ order.publicCode }}</span>
        <UBadge :color="status.color" variant="subtle">{{
          status.label
        }}</UBadge>
      </h2>
      <p v-if="status.hint">{{ status.hint }}</p>
      <p v-if="refundPending(order.status, order.payment?.status)">
        Tu reembolso está en proceso.
      </p>
      <p v-if="mayLag" class="text-sm text-muted">
        El estado puede tardar unos segundos en actualizarse.
      </p>
    </header>

    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <dt class="text-muted">Fecha</dt>
      <dd>{{ formatDate(order.placedAt) }}</dd>
      <template v-if="order.paymentDueAt">
        <dt class="text-muted">Pagar antes del</dt>
        <dd>{{ formatDateTime(order.paymentDueAt) }}</dd>
      </template>
      <template v-if="order.payment">
        <dt class="text-muted">Pago</dt>
        <dd>{{ paymentStatusLabel(order.payment.status) }}</dd>
      </template>
      <template v-if="delivery && !order.shipment">
        <dt class="text-muted">Entrega estimada</dt>
        <dd>{{ delivery }}</dd>
      </template>
      <template v-if="order.shipment">
        <dt class="text-muted">Envío</dt>
        <dd>
          {{ shipmentStatusLabel(order.shipment.status) }}
          <template v-if="order.shipment.ownDelivery">
            · lo entrega la tienda</template
          >
          <template v-else-if="order.shipment.carrierName">
            · {{ order.shipment.carrierName }}</template
          >
          <template v-if="order.shipment.trackingNumber">
            · guía
            <span class="font-mono">{{
              order.shipment.trackingNumber
            }}</span></template
          >
        </dd>
      </template>
    </dl>

    <slot name="actions" />

    <section v-if="order.shippingAddress" class="space-y-2">
      <h3 class="font-semibold">Dirección de envío</h3>
      <PostalAddress :address="order.shippingAddress" />
    </section>

    <section class="space-y-2">
      <h3 class="font-semibold">Productos</h3>
      <OrderLines :order="order" />
    </section>
  </article>
</template>
