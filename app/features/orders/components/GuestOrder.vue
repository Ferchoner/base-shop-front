<script setup lang="ts">
import { ApiProblem } from '~/shared/api/problem';
import { canReorder } from '~/shared/orders/status';
import { useCartIdStore } from '~/shared/stores/cart-id';
import { useSessionStore } from '~/shared/auth/session.store';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { formatMoney } from '~/shared/utils/money';
import { useGuestReorder } from '../api';
import type { Order, Reorder } from '../types';

/**
 * Una orden de invitado con lo que se puede hacer con ella (REQUIREMENTS §5.13): ver cómo pagar si
 * está pendiente y volver a comprar si se canceló o reembolsó.
 */
const props = defineProps<{
  order: Order;
  contactEmail: string;
  /** La tienda aún tiene el `cartId` de origen y puede mostrar las instrucciones de pago (G-11). */
  paymentInstructions?: boolean;
}>();
const emit = defineEmits<{
  reordered: [result: Reorder];
  'show-payment': [];
}>();

const cartStore = useCartIdStore();
const session = useSessionStore();
const reorder = useGuestReorder();
const cooldown = useRetryCooldown();
const problem = ref<ApiProblem | null>(null);

/**
 * Copia la orden al carrito de invitado actual o a uno nuevo. Con sesión va a uno nuevo, que el
 * carrito del cliente fusiona al leerse (REQUIREMENTS §4.5).
 */
async function buyAgain() {
  problem.value = null;
  const key = {
    contactEmail: props.contactEmail,
    publicCode: props.order.publicCode,
  };
  const current = session.isAuthenticated ? null : cartStore.cartId;
  try {
    let result: Reorder;
    try {
      result = await reorder.mutateAsync({
        ...key,
        ...(current && { cartId: current }),
      });
    } catch (e) {
      // El carrito actual ya no sirve (la orden se validó antes, §14.3): se olvida y va a uno nuevo.
      const gone =
        e instanceof ApiProblem &&
        (e.type === 'cart-not-active' || e.type === 'not-found');
      if (!current || !gone) throw e;
      cartStore.forget();
      result = await reorder.mutateAsync(key);
    }
    cartStore.set(result.cartId);
    emit('reordered', result);
  } catch (e) {
    if (!(e instanceof ApiProblem)) throw e;
    cooldown.track(e);
    problem.value = e;
  }
}
</script>

<template>
  <OrderDetail :order="order">
    <template #actions>
      <div
        v-if="order.status === 'PENDING_PAYMENT'"
        class="space-y-3 rounded-lg border border-default p-4"
      >
        <p>
          Paga {{ formatMoney(order.grandTotal) }} con el código
          <strong class="font-mono">{{ order.publicCode }}</strong
          >.
        </p>
        <UButton v-if="paymentInstructions" @click="emit('show-payment')"
          >Ver instrucciones de pago</UButton
        >
        <p v-else class="text-sm text-muted">
          Las instrucciones de pago están en el correo que te enviamos al
          colocar la orden.
        </p>
      </div>

      <div v-if="canReorder(order.status)" class="space-y-3">
        <ProblemAlert v-if="problem" :problem="problem" />
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
