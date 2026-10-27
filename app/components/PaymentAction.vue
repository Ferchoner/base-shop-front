<script setup lang="ts">
import type { PaymentStart } from '~/shared/orders/payment';
import { formatMoney } from '~/shared/utils/money';

/**
 * Cómo pagar una orden según la acción del pago (API_SPEC §16.2). Hoy solo hay pago en tienda
 * (`PAY_IN_STORE`); otro tipo, como el `REDIRECT` de PayPal, remite al correo hasta que la tienda lo
 * soporte. La usan el checkout y los pedidos del cliente.
 */
defineProps<{ action: PaymentStart['action'] }>();
</script>

<template>
  <div v-if="action.type === 'PAY_IN_STORE'" class="space-y-3">
    <p>{{ action.instructions }}</p>
    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
      <dt class="text-muted">Código</dt>
      <dd class="font-mono text-lg font-semibold">
        {{ action.orderCode }}
      </dd>
      <dt class="text-muted">Monto</dt>
      <dd class="font-semibold">{{ formatMoney(action.amount) }}</dd>
    </dl>
  </div>
  <p v-else>Tu orden está apartada. Te enviaremos por correo cómo pagarla.</p>
</template>
