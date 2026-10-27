<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { useQueryClient } from '@tanstack/vue-query';
import ResendVerification from '~/features/account/components/ResendVerification.vue';
import {
  cartKeys,
  isGoneCart,
  useCartNotice,
  USED_IN_ORDER,
} from '~/features/cart/api';
import {
  useCheckoutResult,
  usePlaceOrder,
  useQuote,
} from '~/features/checkout/api';
import QuoteSummary from '~/features/checkout/components/QuoteSummary.vue';
import { couponProblemMessage } from '~/features/checkout/coupon';
import {
  API_FIELD_MAP,
  checkoutSchema,
  toCustomerOrderInput,
  toGuestOrderInput,
  type CheckoutForm,
} from '~/features/checkout/schemas';
import type { QuoteInput } from '~/features/checkout/types';
import {
  ADDRESS_FIELDS,
  emptyAddress,
  toAddressInput,
} from '~/shared/address/address-form';
import { useCreateAddress, useMyAddresses } from '~/shared/address/api';
import {
  createIdempotencyKeys,
  retryWhileInProgress,
} from '~/shared/api/idempotency';
import { ApiProblem } from '~/shared/api/problem';
import type { Money } from '~/shared/api/types';
import { loginRedirect } from '~/shared/auth/redirect';
import { useSessionStore } from '~/shared/auth/session.store';
import { useCartIdStore } from '~/shared/stores/cart-id';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { problemFieldErrors } from '~/shared/utils/form-errors';
import { formatMoney } from '~/shared/utils/money';

/**
 * Checkout de invitado y de cliente (REQUIREMENTS §5.5): contacto (solo invitado), dirección,
 * resumen y confirmación en una sola página. Los totales salen de la cotización de la API.
 */
useHead({ title: 'Checkout' });

const session = useSessionStore();
const cartStore = useCartIdStore();
const cartNotice = useCartNotice();
const result = useCheckoutResult();
const qc = useQueryClient();
// Versión del aviso por variable mientras G-01 siga abierta; vacía, no hay compra como invitado.
const privacyNoticeVersion = useRuntimeConfig().public.privacyNoticeVersion;

const customer = computed(() => session.isAuthenticated);
const guestChosen = ref(false);
const mode = computed<'loading' | 'choose' | 'guest' | 'customer'>(() => {
  if (!session.isSettled) return 'loading';
  if (customer.value) return 'customer';
  return guestChosen.value ? 'guest' : 'choose';
});
const emailVerified = computed(
  () => !customer.value || session.account?.emailVerified !== false,
);
const unverifiedAfterPlacing = ref(false);

/** La orden ya se colocó: el carrito olvidado ya no manda al carrito. */
const placed = ref(false);
// Sin carrito de invitado no hay nada que comprar: el carrito dice que está vacío.
watch(
  () =>
    session.isSettled && !customer.value && !cartStore.cartId && !placed.value,
  (empty) => {
    if (empty) void navigateTo('/cart', { replace: true });
  },
  { immediate: true },
);

// ── Cotización ──
const couponCode = ref('');
const couponMessage = ref<string | null>(null);
const quoteInput = computed<QuoteInput | null>(() => {
  if (mode.value === 'customer')
    return { customer: true, couponCode: couponCode.value };
  if (mode.value === 'guest' && cartStore.cartId)
    return {
      customer: false,
      cartId: cartStore.cartId,
      couponCode: couponCode.value,
    };
  return null;
});
const quote = useQuote(quoteInput);
/** La cotización corresponde a lo que se ve: sin otra en curso ni la anterior de reemplazo. */
const quoteCurrent = computed(
  () =>
    !!quote.data.value &&
    !quote.isPlaceholderData.value &&
    !quote.isFetching.value,
);

function applyCoupon(code: string) {
  couponMessage.value = null;
  couponCode.value = code;
}
function removeCoupon() {
  couponMessage.value = null;
  couponCode.value = '';
}

/** El carrito ya no sirve para colocar: se vuelve a él con su aviso (§5.5). */
function leaveToCart(problem: ApiProblem) {
  if (!customer.value && (isGoneCart(problem) || problem.type === 'empty-cart'))
    cartStore.forget();
  if (problem.type === 'cart-not-active') cartNotice.value = USED_IN_ORDER;
  void qc.invalidateQueries({ queryKey: cartKeys.all });
  void navigateTo('/cart', { replace: true });
}

watch(quote.error, (problem) => {
  if (!problem) return;
  if (problem.type === 'coupon-not-applicable') {
    // La cotización sigue sin el cupón.
    couponMessage.value = couponProblemMessage(problem.extensions.reason);
    couponCode.value = '';
  } else if (problem.type === 'rate-limit-exceeded' && couponCode.value) {
    // Demasiados cupones inexistentes desde esta red (§4.1): se sigue sin cupón.
    couponMessage.value =
      'Hiciste muchos intentos con cupones. Espera unos minutos para probar otro.';
    couponCode.value = '';
  } else if (problem.type === 'empty-cart' || isGoneCart(problem)) {
    leaveToCart(problem);
  }
});

// ── Formulario ──
const state = reactive<CheckoutForm>({
  customer: false,
  contactEmail: '',
  privacy: false,
  addressMode: 'new',
  addressId: undefined,
  address: emptyAddress(),
  saveAddress: false,
});
watchEffect(() => {
  state.customer = customer.value;
});
const form = useTemplateRef('form');

const addresses = useMyAddresses(() => mode.value === 'customer');
const savedAddresses = computed(() => addresses.data.value ?? []);
watch(
  savedAddresses,
  (list) => {
    if (state.addressId && list.some((a) => a.id === state.addressId)) return;
    const preferred = list.find((a) => a.isDefault) ?? list[0];
    state.addressId = preferred?.id;
    state.addressMode = preferred ? 'saved' : 'new';
  },
  { immediate: true },
);
const addressOptions = computed(() => [
  ...savedAddresses.value.map((a) => ({
    value: a.id,
    label: `${a.recipientName}: ${a.street} ${a.exteriorNumber}, ${a.neighborhood}, ${a.municipalityName}, ${a.stateName}`,
  })),
  { value: 'new', label: 'Otra dirección' },
]);
const addressChoice = computed({
  get: () => (state.addressMode === 'saved' ? state.addressId : 'new'),
  set: (value: string | undefined) => {
    if (value === 'new' || !value) state.addressMode = 'new';
    else {
      state.addressMode = 'saved';
      state.addressId = value;
    }
  },
});
// Se vuelve a cotizar al elegir la dirección (§5.5).
watch(addressChoice, () => {
  if (quote.data.value) void quote.refetch();
});
const showAddressForm = computed(
  () => mode.value === 'guest' || state.addressMode === 'new',
);

// ── Colocar ──
const place = usePlaceOrder();
const createAddress = useCreateAddress();
const keyFor = createIdempotencyKeys();
const cooldown = useRetryCooldown();
const submitting = ref(false);
const problem = ref<ApiProblem | null>(null);
const messages = ref<string[]>([]);
const info = ref<string | null>(null);

const FORM_FIELDS = [
  'contactEmail',
  'addressId',
  ...ADDRESS_FIELDS.map((f) => `address.${f}`),
];

const total = computed(() => quote.data.value?.grandTotal);
const canPlace = computed(
  () =>
    quoteCurrent.value &&
    !!quote.data.value?.readyToPlace &&
    emailVerified.value &&
    !unverifiedAfterPlacing.value &&
    !submitting.value &&
    !cooldown.waiting.value,
);

/** Guarda la dirección nueva en la libreta y la usa por su id; con la libreta llena, la usa sin guardar. */
async function saveAddressFirst(data: CheckoutForm) {
  try {
    const saved = await createAddress.mutateAsync({
      ...toAddressInput(data.address),
    });
    state.addressId = saved.id;
    state.addressMode = 'saved';
    state.saveAddress = false;
    data.addressMode = 'saved';
    data.addressId = saved.id;
  } catch (e) {
    const p = e as ApiProblem;
    if (p.type !== 'address-limit-reached') throw p;
    state.saveAddress = false;
    info.value =
      'Tu libreta de direcciones está llena: usamos esta dirección sin guardarla.';
  }
}

function showPlaceProblem(p: ApiProblem) {
  cooldown.track(p);
  const refetch = () => void quote.refetch();
  switch (p.type) {
    case 'total-mismatch': {
      refetch();
      const current = p.extensions.currentTotal as Money | undefined;
      messages.value = [
        `El total cambió${current ? ` a ${formatMoney(current)}` : ''}. Revisa el resumen y confirma otra vez.`,
      ];
      return;
    }
    case 'insufficient-stock':
      refetch();
      messages.value = [
        'Ya no hay suficientes de algunos productos. Ajusta tu carrito para continuar.',
      ];
      return;
    case 'variant-not-sellable':
      refetch();
      messages.value = [
        'Algún producto ya no está disponible. Ajusta tu carrito para continuar.',
      ];
      return;
    case 'coupon-not-applicable':
      couponMessage.value = couponProblemMessage(p.extensions.reason);
      couponCode.value = '';
      messages.value = ['Revisa el total sin el cupón y confirma otra vez.'];
      return;
    case 'email-not-verified':
      unverifiedAfterPlacing.value = true;
      return;
    case 'empty-cart':
    case 'cart-not-active':
      leaveToCart(p);
      return;
    case 'not-found':
      if (customer.value) {
        void addresses.refetch();
        messages.value = [
          'Esa dirección ya no está en tu libreta. Elige otra.',
        ];
        return;
      }
      leaveToCart(p);
      return;
  }
  const { fieldErrors, otherMessages } = problemFieldErrors(
    p,
    FORM_FIELDS,
    API_FIELD_MAP,
  );
  form.value?.setErrors(fieldErrors);
  messages.value = otherMessages;
  if (p.type !== 'validation-error' || otherMessages.length > 0)
    problem.value = p;
}

async function onSubmit(event: FormSubmitEvent<CheckoutForm>) {
  const q = quote.data.value;
  if (!canPlace.value || !q) return;
  problem.value = null;
  messages.value = [];
  info.value = null;
  submitting.value = true;
  const data = { ...event.data };
  const coupon = couponCode.value;
  const expectedTotal = q.grandTotal.amount;
  try {
    if (customer.value && data.addressMode === 'new' && data.saveAddress)
      await saveAddressFirst(data);
    const cartId = cartStore.cartId;
    const vars = customer.value
      ? {
          customer: true as const,
          input: toCustomerOrderInput(data, expectedTotal, coupon),
        }
      : {
          customer: false as const,
          input: toGuestOrderInput(
            data,
            cartId!,
            expectedTotal,
            privacyNoticeVersion,
            coupon,
          ),
        };
    const idempotencyKey = keyFor(vars);
    const order = await retryWhileInProgress(() =>
      place.mutateAsync({ ...vars, idempotencyKey }),
    );
    result.value = {
      order,
      cartId: customer.value ? null : cartId,
      contactEmail: customer.value ? null : order.contactEmail,
      paymentKey: crypto.randomUUID(),
      payment: null,
    };
    placed.value = true;
    // El carrito quedó CHECKED_OUT: el de invitado se olvida y el contador vuelve a pedirse.
    if (!customer.value) cartStore.forget();
    void qc.invalidateQueries({ queryKey: cartKeys.all });
    // El código no va en la URL: el de un invitado nunca va ahí (SECURITY.md).
    await navigateTo('/checkout/done');
  } catch (e) {
    if (e instanceof ApiProblem) showPlaceProblem(e);
    else throw e;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Checkout</h1>

    <QueryState v-if="mode === 'loading'" :loading="true" :error="null" />

    <div
      v-else-if="mode === 'choose'"
      class="max-w-md space-y-4 rounded-lg border border-default p-4"
    >
      <h2 class="font-semibold">¿Tienes cuenta?</h2>
      <p class="text-sm text-muted">
        Inicia sesión para usar tus direcciones y ver tus pedidos en tu cuenta.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton :to="loginRedirect('/checkout')">Iniciar sesión</UButton>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="!privacyNoticeVersion"
          @click="guestChosen = true"
          >Continuar como invitado</UButton
        >
      </div>
      <p v-if="!privacyNoticeVersion" class="text-sm text-muted">
        La compra como invitado no está disponible por ahora.
      </p>
    </div>

    <template v-else>
      <div
        v-if="!emailVerified || unverifiedAfterPlacing"
        class="space-y-3 rounded-lg border border-warning p-4"
        role="alert"
      >
        <p class="font-medium">
          Confirma tu email para colocar la orden. Te enviamos un enlace a
          {{ session.account?.email }}.
        </p>
        <ResendVerification :email="session.account?.email" />
      </div>

      <div class="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <UForm
          ref="form"
          :schema="checkoutSchema"
          :state="state"
          :validate-on-input-delay="0"
          class="space-y-8"
          @submit="onSubmit"
        >
          <section
            v-if="mode === 'guest'"
            aria-labelledby="checkout-contact"
            class="space-y-4"
          >
            <h2 id="checkout-contact" class="text-lg font-semibold">
              1. Contacto
            </h2>
            <UFormField
              label="Email"
              name="contactEmail"
              required
              help="Te enviaremos ahí la orden y sus avisos."
            >
              <UInput
                v-model="state.contactEmail"
                type="email"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>
          </section>

          <section aria-labelledby="checkout-address" class="space-y-4">
            <h2 id="checkout-address" class="text-lg font-semibold">
              {{ mode === 'guest' ? '2.' : '1.' }} Dirección de envío
            </h2>
            <UFormField
              v-if="mode === 'customer' && savedAddresses.length > 0"
              name="addressId"
            >
              <URadioGroup
                v-model="addressChoice"
                :items="addressOptions"
                legend="Elige la dirección"
              />
            </UFormField>
            <template v-if="showAddressForm">
              <AddressFields :address="state.address" />
              <UCheckbox
                v-if="mode === 'customer'"
                v-model="state.saveAddress"
                label="Guardar esta dirección en mi cuenta"
              />
            </template>
          </section>

          <section
            v-if="mode === 'guest'"
            aria-labelledby="checkout-privacy"
            class="space-y-2"
          >
            <h2 id="checkout-privacy" class="text-lg font-semibold">
              3. Aviso de privacidad
            </h2>
            <UFormField name="privacy">
              <UCheckbox
                v-model="state.privacy"
                :label="`Acepto el aviso de privacidad (versión ${privacyNoticeVersion}).`"
              />
            </UFormField>
          </section>
        </UForm>

        <aside
          aria-labelledby="checkout-summary"
          class="h-fit space-y-4 rounded-lg border border-default p-4"
        >
          <h2 id="checkout-summary" class="font-semibold">Resumen</h2>
          <QueryState
            :loading="
              quote.isPending.value && quote.fetchStatus.value !== 'idle'
            "
            :error="
              quote.data.value ||
              quote.error.value?.type === 'coupon-not-applicable'
                ? null
                : quote.error.value
            "
            @retry="quote.refetch()"
          >
            <template v-if="quote.data.value">
              <!-- Los cambios del total se anuncian (REQUIREMENTS §4.6). -->
              <p class="sr-only" aria-live="polite">
                Total {{ formatMoney(total) }}
              </p>
              <QuoteSummary
                :quote="quote.data.value"
                :coupon-code="couponCode"
                :coupon-message="couponMessage"
                :busy="quote.isFetching.value || submitting"
                @apply="applyCoupon"
                @remove="removeCoupon"
              />
              <UAlert
                v-if="!quote.data.value.readyToPlace"
                color="warning"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                title="Algunos productos no están disponibles o no alcanzan."
                description="Ajusta tu carrito para continuar."
                :actions="[{ label: 'Ir al carrito', to: '/cart' }]"
              />
            </template>
          </QueryState>

          <div v-if="messages.length > 0 && !problem" role="alert">
            <p
              v-for="message in messages"
              :key="message"
              class="text-sm text-error"
            >
              {{ message }}
            </p>
          </div>
          <ProblemAlert
            v-if="problem"
            :problem="problem"
            :messages="messages"
          />
          <p v-if="info" role="status" class="text-sm text-muted">
            {{ info }}
          </p>

          <UButton
            block
            size="lg"
            :loading="submitting"
            :disabled="!canPlace"
            @click="form?.submit()"
            >{{
              cooldown.waiting.value
                ? `Espera ${cooldown.remaining.value} s`
                : 'Colocar pedido'
            }}</UButton
          >
          <p class="text-sm text-muted">
            Al colocar el pedido apartamos tus productos. En el siguiente paso
            te decimos cómo pagar.
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>
