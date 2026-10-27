<script setup lang="ts">
import { useCheckoutResult, useFindOrder } from '~/features/checkout/api';
import { retryWhileInProgress } from '~/shared/api/idempotency';
import { ApiProblem } from '~/shared/api/problem';
import { useSessionStore } from '~/shared/auth/session.store';
import { isProviderDisabled, useStartPayment } from '~/shared/orders/payment';
import { orderStatusLabel } from '~/shared/orders/status';
import { formatDateTime } from '~/shared/utils/dates';
import { formatMoney } from '~/shared/utils/money';

/**
 * Orden colocada e instrucciones de pago (REQUIREMENTS §5.6). Los datos de la orden y el `cartId` de
 * origen solo viven en memoria: al recargar, la orden se busca donde corresponde, sin perderla.
 */
useHead({ title: 'Orden colocada' });

const session = useSessionStore();
const result = useCheckoutResult();
const start = useStartPayment();
const find = useFindOrder();

// Sin la orden en memoria (se recargó la página): el invitado la consulta con su email y el cliente
// la encuentra en sus pedidos.
watch(
  () => !result.value && session.isSettled,
  (lost) => {
    if (lost)
      void navigateTo(
        session.isAuthenticated ? '/account/orders' : '/order-lookup',
        {
          replace: true,
        },
      );
  },
  { immediate: true },
);

type Status = 'starting' | 'ready' | 'unavailable' | 'not-pending' | 'error';
const status = ref<Status>(result.value?.payment ? 'ready' : 'starting');
const problem = ref<ApiProblem | null>(null);
/** Estado de la orden cuando ya no admite pago (por ejemplo, venció). */
const orderStatus = ref<string | null>(null);

async function showOrderStatus() {
  const c = result.value;
  if (!c) return;
  try {
    const order = await find.mutateAsync({
      publicCode: c.order.publicCode,
      contactEmail: c.contactEmail,
    });
    orderStatus.value = orderStatusLabel(order.status);
  } catch {
    orderStatus.value = null;
  }
}

/** Inicia el pago con la llave de la orden: un reintento devuelve la misma acción (§16.2). */
async function startPayment() {
  const c = result.value;
  if (!c || c.payment || start.isPending.value) return;
  status.value = 'starting';
  problem.value = null;
  try {
    const payment = await retryWhileInProgress(() =>
      start.mutateAsync({
        publicCode: c.order.publicCode,
        cartId: c.cartId,
        idempotencyKey: c.paymentKey,
      }),
    );
    c.payment = payment;
    status.value = 'ready';
  } catch (e) {
    if (!(e instanceof ApiProblem)) throw e;
    if (isProviderDisabled(e)) status.value = 'unavailable';
    else if (e.type === 'invalid-state-transition') {
      status.value = 'not-pending';
      await showOrderStatus();
    } else {
      problem.value = e;
      status.value = 'error';
    }
  }
}

// Una sola vez al llegar; la llave de la orden evita un segundo pago si la pantalla se monta otra vez.
onMounted(() => void startPayment());

const order = computed(() => result.value?.order);
const action = computed(() => result.value?.payment?.action);
</script>

<template>
  <div v-if="order" class="max-w-2xl space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">¡Gracias! Tu orden está apartada</h1>
      <p class="text-muted">
        Código de tu orden:
        <strong class="font-mono text-default">{{ order.publicCode }}</strong>
      </p>
    </div>

    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
      <dt class="text-muted">Total</dt>
      <dd class="font-semibold">{{ formatMoney(order.grandTotal) }}</dd>
      <template v-if="order.paymentDueAt">
        <dt class="text-muted">Pago</dt>
        <dd>
          Apartamos tus productos hasta el
          {{ formatDateTime(order.paymentDueAt) }}.
        </dd>
      </template>
    </dl>

    <section
      aria-labelledby="payment-title"
      class="space-y-3 rounded-lg border border-default p-4"
      aria-live="polite"
    >
      <h2 id="payment-title" class="text-lg font-semibold">Cómo pagar</h2>

      <p v-if="status === 'starting'" class="text-muted">
        Preparando tu forma de pago…
      </p>

      <PaymentAction
        v-else-if="status === 'ready' && action"
        :action="action"
      />

      <UAlert
        v-else-if="status === 'unavailable'"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Tu orden está apartada, pero ahora no podemos recibir el pago en línea; comunícate con la tienda."
        :description="`Menciona el código ${order.publicCode}.`"
      />

      <UAlert
        v-else-if="status === 'not-pending'"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Esta orden ya no admite el pago."
        :description="
          orderStatus ? `Estado de la orden: ${orderStatus}.` : undefined
        "
      />

      <template v-else-if="status === 'error' && problem">
        <ProblemAlert :problem="problem" />
        <UButton :loading="start.isPending.value" @click="startPayment()"
          >Reintentar</UButton
        >
      </template>
    </section>

    <div class="space-y-2 text-sm text-muted">
      <p>
        Te enviamos un correo con tu orden<template v-if="result?.contactEmail">
          a {{ result.contactEmail }}</template
        >.
      </p>
      <p>
        Si no se paga a tiempo, la orden vence y los productos regresan a tu
        carrito.
      </p>
    </div>

    <UButton to="/products" color="neutral" variant="outline"
      >Seguir comprando</UButton
    >
  </div>
  <QueryState v-else :loading="true" :error="null" />
</template>
