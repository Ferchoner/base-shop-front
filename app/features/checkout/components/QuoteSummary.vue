<script setup lang="ts">
import type { Money } from '~/shared/api/types';
import { formatMoney } from '~/shared/utils/money';
import { normalizeCoupon } from '../coupon';
import type { CheckoutQuote, QuoteLine } from '../types';

/**
 * Resumen de la cotización (REQUIREMENTS §5.5): todo sale de `CheckoutQuote`, sin recalcular, salvo
 * cuánto falta para el envío gratis, que es solo un aviso: el costo del envío lo decide la API.
 */
const props = defineProps<{
  quote: CheckoutQuote;
  /** Cupón aplicado; vacío, solo la promoción automática. */
  couponCode: string;
  couponMessage: string | null;
  busy: boolean;
}>();
const emit = defineEmits<{ apply: [code: string]; remove: [] }>();

const draft = ref('');
function apply() {
  const code = normalizeCoupon(draft.value);
  if (code) emit('apply', code);
}
function remove() {
  draft.value = '';
  emit('remove');
}

const options = (line: QuoteLine) =>
  Object.entries(line.options)
    .map(
      ([name, value]) =>
        `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${value}`,
    )
    .join(' · ');
const hasDiscount = computed(() => props.quote.discountTotal.amount > 0);
const freeShippingLeft = computed<Money | null>(() => {
  const q = props.quote;
  const threshold = q.freeShippingThreshold;
  if (!threshold || q.shippingCost.amount === 0) return null;
  const left = threshold.amount - (q.subtotal.amount - q.discountTotal.amount);
  return left > 0 ? { amount: left, currency: threshold.currency } : null;
});
const delivery = computed(() => {
  const d = props.quote.estimatedDelivery;
  if (!d) return null;
  return d.minBusinessDays === d.maxBusinessDays
    ? `${d.minBusinessDays} días hábiles`
    : `De ${d.minBusinessDays} a ${d.maxBusinessDays} días hábiles`;
});
</script>

<template>
  <div class="space-y-4">
    <ul role="list" class="divide-y divide-default">
      <li
        v-for="line in quote.lines"
        :key="line.variantId"
        class="flex justify-between gap-3 py-3 text-sm"
      >
        <div class="min-w-0 space-y-0.5">
          <p class="font-medium">
            {{ line.productTitle }}
            <span class="font-normal text-muted">× {{ line.quantity }}</span>
          </p>
          <p v-if="options(line)" class="text-muted">{{ options(line) }}</p>
          <p v-if="!line.sellable" class="font-medium text-error">
            Ya no está disponible
          </p>
          <p v-else-if="!line.canFulfill" class="font-medium text-error">
            No hay suficientes para la cantidad pedida
          </p>
          <p
            v-if="line.discountAmount && line.discountAmount.amount > 0"
            class="text-success"
          >
            Descuento −{{ formatMoney(line.discountAmount) }}
          </p>
        </div>
        <span v-if="line.lineTotal" class="shrink-0 tabular-nums">{{
          formatMoney(line.lineTotal)
        }}</span>
      </li>
    </ul>

    <div class="space-y-2">
      <form
        v-if="!couponCode"
        class="flex gap-2"
        aria-label="Cupón"
        @submit.prevent="apply"
      >
        <UInput
          v-model="draft"
          aria-label="Código del cupón"
          placeholder="Código del cupón"
          :maxlength="30"
          autocomplete="off"
          class="min-w-0 flex-1"
        />
        <UButton
          type="submit"
          color="neutral"
          variant="outline"
          :disabled="busy || !draft.trim()"
          >Aplicar</UButton
        >
      </form>
      <div v-else class="flex items-center justify-between gap-2 text-sm">
        <span
          >Cupón <strong>{{ couponCode }}</strong></span
        >
        <UButton
          color="neutral"
          variant="link"
          :disabled="busy"
          :aria-label="`Quitar el cupón ${couponCode}`"
          @click="remove"
          >Quitar</UButton
        >
      </div>
      <p v-if="couponMessage" role="alert" class="text-sm text-error">
        {{ couponMessage }}
      </p>
    </div>

    <dl class="space-y-1 text-sm">
      <div class="flex justify-between">
        <dt>Subtotal</dt>
        <dd class="tabular-nums">{{ formatMoney(quote.subtotal) }}</dd>
      </div>
      <div v-if="hasDiscount" class="flex justify-between text-success">
        <dt>
          Descuento<template v-if="quote.promotion">
            ({{ quote.promotion.name }})</template
          >
        </dt>
        <dd class="tabular-nums">−{{ formatMoney(quote.discountTotal) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Envío</dt>
        <dd class="tabular-nums">
          {{
            quote.shippingCost.amount === 0
              ? 'Gratis'
              : formatMoney(quote.shippingCost)
          }}
        </dd>
      </div>
      <div class="flex justify-between text-base font-semibold">
        <dt>Total</dt>
        <dd class="tabular-nums">{{ formatMoney(quote.grandTotal) }}</dd>
      </div>
      <div class="flex justify-between text-muted">
        <dt>IVA incluido</dt>
        <dd class="tabular-nums">{{ formatMoney(quote.taxTotal) }}</dd>
      </div>
    </dl>
    <p v-if="freeShippingLeft" class="text-sm text-muted">
      Te faltan {{ formatMoney(freeShippingLeft) }} para el envío gratis.
    </p>
    <p v-if="delivery" class="text-sm text-muted">
      Entrega estimada: {{ delivery }} después del pago.
    </p>
  </div>
</template>
