<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/vue-query';
import { cartKeys, useCartNotice } from '~/features/cart/api';
import { useCheckoutResult } from '~/features/checkout/api';
import { normalizeOrderCode, useLookupOrder } from '~/features/orders/api';
import AccessLinkForm from '~/features/orders/components/AccessLinkForm.vue';
import GuestOrder from '~/features/orders/components/GuestOrder.vue';
import { reorderNotice } from '~/features/orders/reorder';
import type { Order, Reorder } from '~/features/orders/types';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';

/**
 * Consulta de un pedido de invitado con email y código (REQUIREMENTS §5.13). Los dos viajan solo en
 * el cuerpo y viven en la página: no se guardan en el navegador ni van en la URL.
 */
useHead({ title: 'Consultar pedido' });

// GuestOrderLookupDto: email ≤ 254 y código de 1 a 100.
const schema = z.object({
  contactEmail: z
    .email('Escribe un email válido.')
    .max(254, 'Máximo 254 caracteres.'),
  publicCode: z
    .string()
    .trim()
    .min(1, 'Escribe el código de tu pedido.')
    .max(100, 'Máximo 100 caracteres.'),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({ contactEmail: '', publicCode: '' });
const lookup = useLookupOrder();
const cooldown = useRetryCooldown();
const found = ref<{ order: Order; contactEmail: string } | null>(null);
const checkout = useCheckoutResult();
const cartNotice = useCartNotice();
const qc = useQueryClient();

const notFound = computed(() => lookup.error.value?.type === 'not-found');
const otherProblem = computed(() =>
  notFound.value ? null : lookup.error.value,
);
// La orden recién colocada en esta pestaña conserva su `cartId` de origen (ADR-F014, G-11).
const paymentInstructions = computed(
  () =>
    !!found.value &&
    checkout.value?.order.publicCode === found.value.order.publicCode &&
    !!checkout.value.cartId,
);

function onSubmit(event: FormSubmitEvent<Schema>) {
  const key = {
    contactEmail: event.data.contactEmail,
    publicCode: normalizeOrderCode(event.data.publicCode),
  };
  lookup.mutate(key, {
    onSuccess: (order) => {
      found.value = { order, contactEmail: key.contactEmail };
    },
    onError: (p) => cooldown.track(p),
  });
}

function another() {
  found.value = null;
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
  <div class="space-y-8">
    <h1 class="text-2xl font-semibold">Consultar pedido</h1>

    <div v-if="found" class="space-y-6">
      <GuestOrder
        :order="found.order"
        :contact-email="found.contactEmail"
        :payment-instructions="paymentInstructions"
        @show-payment="navigateTo('/checkout/done')"
        @reordered="onReordered"
      />
      <UButton color="neutral" variant="outline" @click="another"
        >Consultar otro pedido</UButton
      >
    </div>

    <div v-else class="grid max-w-3xl gap-10 md:grid-cols-2">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <p class="text-muted">
          Escribe el email con el que compraste y el código de tu pedido.
        </p>
        <UAlert
          v-if="notFound"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="No encontramos un pedido con esos datos."
          description="Revisa el email y el código. Si compraste con tu cuenta, el pedido está en tu cuenta."
          role="alert"
        />
        <ProblemAlert v-if="otherProblem" :problem="otherProblem" />
        <UFormField label="Email" name="contactEmail" required>
          <UInput
            v-model="state.contactEmail"
            type="email"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Código del pedido"
          name="publicCode"
          required
          help="Por ejemplo, K7M4-Q9XA. Está en el correo de tu orden."
        >
          <UInput
            v-model="state.publicCode"
            autocomplete="off"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          :loading="lookup.isPending.value"
          :disabled="cooldown.waiting.value"
          >{{
            cooldown.waiting.value
              ? `Espera ${cooldown.remaining.value} s`
              : 'Consultar'
          }}</UButton
        >
      </UForm>

      <section aria-labelledby="lost-code" class="space-y-3">
        <h2 id="lost-code" class="text-lg font-semibold">
          ¿Perdiste tu código?
        </h2>
        <p class="text-sm text-muted">
          Te enviamos un enlace para ver todos tus pedidos de invitado.
        </p>
        <AccessLinkForm />
      </section>
    </div>
  </div>
</template>
