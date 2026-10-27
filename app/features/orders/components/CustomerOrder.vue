<script setup lang="ts">
import { retryWhileInProgress } from '~/shared/api/idempotency';
import { ApiProblem } from '~/shared/api/problem';
import {
  isProviderDisabled,
  useStartPayment,
  type PaymentStart,
} from '~/shared/orders/payment';
import { canReorder } from '~/shared/orders/status';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { formatMoney } from '~/shared/utils/money';
import { useCustomerReorder } from '../api';
import type { Order, Reorder } from '../types';

/**
 * Una orden del cliente con lo que se puede hacer con ella (REQUIREMENTS §5.12): ver cómo pagar si
 * está pendiente y volver a comprar si se canceló o reembolsó.
 */
const props = defineProps<{ order: Order }>();
const emit = defineEmits<{ reordered: [result: Reorder]; stale: [] }>();

const start = useStartPayment();
const reorder = useCustomerReorder();
const cooldown = useRetryCooldown();
/** Una llave por orden mientras la pantalla vive: repetir devuelve la misma acción (§16.2). */
const paymentKey = crypto.randomUUID();

type PaymentState = 'idle' | 'ready' | 'unavailable' | 'not-pending';
const paymentState = ref<PaymentState>('idle');
const payment = ref<PaymentStart | null>(null);
const paymentProblem = ref<ApiProblem | null>(null);
const reorderProblem = ref<ApiProblem | null>(null);

async function showPayment() {
  paymentProblem.value = null;
  try {
    payment.value = await retryWhileInProgress(() =>
      start.mutateAsync({
        publicCode: props.order.publicCode,
        cartId: null,
        idempotencyKey: paymentKey,
      }),
    );
    paymentState.value = 'ready';
  } catch (e) {
    if (!(e instanceof ApiProblem)) throw e;
    if (isProviderDisabled(e)) paymentState.value = 'unavailable';
    else if (e.type === 'invalid-state-transition') {
      // Venció o se pagó mientras tanto: la orden se vuelve a pedir con su estado nuevo.
      paymentState.value = 'not-pending';
      emit('stale');
    } else {
      cooldown.track(e);
      paymentProblem.value = e;
    }
  }
}

async function buyAgain() {
  reorderProblem.value = null;
  try {
    emit('reordered', await reorder.mutateAsync(props.order.publicCode));
  } catch (e) {
    if (!(e instanceof ApiProblem)) throw e;
    cooldown.track(e);
    reorderProblem.value = e;
  }
}
</script>

<template>
  <OrderDetail :order="order">
    <template #actions>
      <section
        v-if="order.status === 'PENDING_PAYMENT' || paymentState !== 'idle'"
        aria-labelledby="payment-title"
        class="space-y-3 rounded-lg border border-default p-4"
      >
        <h3 id="payment-title" class="font-semibold">Cómo pagar</h3>
        <div aria-live="polite" class="space-y-3">
          <PaymentAction
            v-if="paymentState === 'ready' && payment"
            :action="payment.action"
          />
          <UAlert
            v-else-if="paymentState === 'unavailable'"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Ahora no podemos recibir el pago en línea; comunícate con la tienda."
            :description="`Menciona el código ${order.publicCode}.`"
          />
          <UAlert
            v-else-if="paymentState === 'not-pending'"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Esta orden ya no admite el pago."
            description="Arriba está su estado actual."
          />
          <template v-else>
            <p>
              Paga {{ formatMoney(order.grandTotal) }} con el código
              <strong class="font-mono">{{ order.publicCode }}</strong
              >.
            </p>
            <ProblemAlert v-if="paymentProblem" :problem="paymentProblem" />
            <UButton
              :loading="start.isPending.value"
              :disabled="cooldown.waiting.value"
              @click="showPayment"
              >Ver instrucciones de pago</UButton
            >
          </template>
        </div>
      </section>

      <div v-if="canReorder(order.status)" class="space-y-3">
        <ProblemAlert v-if="reorderProblem" :problem="reorderProblem" />
        <UButton
          icon="i-lucide-rotate-ccw"
          :loading="reorder.isPending.value"
          :disabled="cooldown.waiting.value"
          @click="buyAgain"
          >Volver a comprar</UButton
        >
      </div>
    </template>
  </OrderDetail>
</template>
