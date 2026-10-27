<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { useResendVerification } from '../api';

/**
 * Reenvío del enlace de verificación (REQUIREMENTS §5.7). Con `email` (recién registrado) es solo un
 * botón; sin él, pide el email. La respuesta es la misma exista o no la cuenta (BR-USR-12).
 */
const props = defineProps<{ email?: string }>();

const schema = z.object({
  email: z.email('Escribe un email válido.').max(254, 'Máximo 254 caracteres.'),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({ email: '' });
const resend = useResendVerification();
const cooldown = useRetryCooldown();

function send(email: string) {
  resend.mutate(email, { onError: (p) => cooldown.track(p) });
}
function onSubmit(event: FormSubmitEvent<Schema>) {
  send(event.data.email);
}
</script>

<template>
  <div class="space-y-3">
    <div aria-live="polite">
      <UAlert
        v-if="resend.isSuccess.value"
        color="success"
        variant="subtle"
        icon="i-lucide-mail-check"
        title="Si el email tiene una cuenta sin verificar, te enviamos un enlace nuevo."
        description="El correo puede tardar unos minutos. El enlace anterior ya no sirve."
      />
    </div>
    <ProblemAlert v-if="resend.error.value" :problem="resend.error.value" />

    <UButton
      v-if="props.email"
      color="neutral"
      variant="outline"
      icon="i-lucide-mail"
      :loading="resend.isPending.value"
      :disabled="cooldown.waiting.value"
      @click="send(props.email)"
      >Reenviar el correo</UButton
    >
    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-3"
      @submit="onSubmit"
    >
      <UFormField label="Email de tu cuenta" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        :loading="resend.isPending.value"
        :disabled="cooldown.waiting.value"
        >Enviar otro enlace</UButton
      >
    </UForm>
  </div>
</template>
