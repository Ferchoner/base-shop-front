<!-- Adaptado de base-ecomm-admin app/pages/login.vue (commit bbcd5af, ADR-F009): para clientes, con la
fusión del carrito de invitado y un solo mensaje ante credenciales inválidas (REQUIREMENTS §5.8). -->
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useMergeGuestCart } from '~/features/cart/api';
import { toApiProblem } from '~/shared/api/problem';
import type { ApiProblem } from '~/shared/api/problem';
import { safeRedirect } from '~/shared/auth/redirect';
import { useSessionStore } from '~/shared/auth/session.store';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { splitFieldErrors } from '~/shared/utils/form-errors';

definePageMeta({ guestOnly: true });
useHead({ title: 'Iniciar sesión' });

// Límites de LoginDto (openapi/v1.json): email ≤ 254, contraseña ≤ 256 tal como se escribe.
const schema = z.object({
  email: z.email('Escribe un email válido.').max(254, 'Máximo 254 caracteres.'),
  password: z
    .string()
    .min(1, 'Escribe tu contraseña.')
    .max(256, 'Máximo 256 caracteres.'),
});
type Schema = z.output<typeof schema>;

/** Mismo mensaje para un email que no existe y una contraseña incorrecta (base-shop ADR-0062). */
const INVALID_CREDENTIALS = 'El email o la contraseña no son correctos.';

const state = reactive<Partial<Schema>>({ email: '', password: '' });
const form = useTemplateRef('form');
const problem = ref<ApiProblem | null>(null);
const invalid = ref(false);
const otherMessages = ref<string[]>([]);
const submitting = ref(false);
const cooldown = useRetryCooldown();

const session = useSessionStore();
const mergeGuestCart = useMergeGuestCart();
const route = useRoute();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  problem.value = null;
  invalid.value = false;
  otherMessages.value = [];
  submitting.value = true;
  try {
    await session.login(event.data);
    await mergeGuestCart();
    await navigateTo(safeRedirect(route.query.redirect));
  } catch (error) {
    const p = toApiProblem(error);
    cooldown.track(p);
    if (p.type === 'invalid-credentials') {
      invalid.value = true;
    } else if (p.type === 'validation-error') {
      const { fieldErrors, otherMessages: rest } = splitFieldErrors(p, [
        'email',
        'password',
      ]);
      form.value?.setErrors(fieldErrors);
      otherMessages.value = rest;
      if (rest.length > 0) problem.value = p;
    } else {
      problem.value = p;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm space-y-6">
    <h1 class="text-2xl font-semibold">Iniciar sesión</h1>

    <UForm
      ref="form"
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UAlert
        v-if="invalid"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        role="alert"
        :title="INVALID_CREDENTIALS"
      />
      <ProblemAlert
        v-else-if="problem"
        :problem="problem"
        :messages="otherMessages"
      />

      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="username"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Contraseña" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        :loading="submitting"
        :disabled="cooldown.waiting.value"
        >Iniciar sesión</UButton
      >
    </UForm>
  </div>
</template>
