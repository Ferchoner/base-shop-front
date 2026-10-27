<!-- Adaptado de base-ecomm-admin app/pages/recuperar-contrasena.vue (commit bbcd5af, ADR-F009): ruta en
inglés, mensaje de REQUIREMENTS §5.9 y espera del Retry-After. -->
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { usePasswordResetRequest } from '~/features/account/api';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';

useHead({ title: 'Recuperar contraseña' });

// PasswordResetRequestDto: email ≤ 254.
const schema = z.object({
  email: z.email('Escribe un email válido.').max(254, 'Máximo 254 caracteres.'),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({ email: '' });
const request = usePasswordResetRequest();
const cooldown = useRetryCooldown();

function onSubmit(event: FormSubmitEvent<Schema>) {
  request.mutate(event.data.email, { onError: (p) => cooldown.track(p) });
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">Recuperar contraseña</h1>

    <div v-if="request.isSuccess.value" class="space-y-4">
      <!-- La API responde igual exista o no la cuenta (API_SPEC §9.8): el mensaje no lo revela. -->
      <UAlert
        color="success"
        variant="subtle"
        icon="i-lucide-mail-check"
        title="Si el email tiene una cuenta, te enviamos un enlace."
        description="Vence en 30 minutos y el correo puede tardar unos minutos en llegar."
        role="status"
      />
      <UButton to="/login" color="neutral" variant="outline" block
        >Volver a iniciar sesión</UButton
      >
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <p class="text-muted">
        Te enviaremos un enlace para elegir una contraseña nueva.
      </p>
      <ProblemAlert v-if="request.error.value" :problem="request.error.value" />

      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        :loading="request.isPending.value"
        :disabled="cooldown.waiting.value"
        >Enviar enlace</UButton
      >
      <UButton to="/login" color="neutral" variant="ghost" block
        >Volver a iniciar sesión</UButton
      >
    </UForm>
  </div>
</template>
