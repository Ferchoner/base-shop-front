<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { useRequestAccessLink } from '../api';

/**
 * "¿Perdiste tu código?" (REQUIREMENTS §5.13): pide un enlace a los pedidos del email. La respuesta
 * es la misma tenga o no pedidos (API_SPEC §15.6).
 */
const schema = z.object({
  contactEmail: z
    .email('Escribe un email válido.')
    .max(254, 'Máximo 254 caracteres.'),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({ contactEmail: '' });
const request = useRequestAccessLink();
const cooldown = useRetryCooldown();

function onSubmit(event: FormSubmitEvent<Schema>) {
  request.mutate(event.data.contactEmail, {
    onError: (p) => cooldown.track(p),
  });
}
</script>

<template>
  <div class="space-y-3">
    <div aria-live="polite">
      <UAlert
        v-if="request.isSuccess.value"
        color="success"
        variant="subtle"
        icon="i-lucide-mail-check"
        title="Si tienes pedidos, te enviamos un enlace."
        description="Vence en 30 minutos y el correo puede tardar unos minutos en llegar."
      />
    </div>
    <ProblemAlert v-if="request.error.value" :problem="request.error.value" />
    <UForm
      v-if="!request.isSuccess.value"
      :schema="schema"
      :state="state"
      class="space-y-3"
      @submit="onSubmit"
    >
      <UFormField
        label="Email con el que compraste"
        name="contactEmail"
        required
      >
        <UInput
          v-model="state.contactEmail"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        color="neutral"
        variant="outline"
        :loading="request.isPending.value"
        :disabled="cooldown.waiting.value"
        >Enviarme un enlace</UButton
      >
    </UForm>
  </div>
</template>
