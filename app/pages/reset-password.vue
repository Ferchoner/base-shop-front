<!-- Adaptado de base-ecomm-admin app/pages/reset-password.vue (commit bbcd5af, ADR-F009): quita el token
de la URL, explica cada regla de la política con su mensaje y al terminar lleva a /login (REQUIREMENTS §5.9). -->
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import {
  useLinkToken,
  useLoginNotice,
  usePasswordResetConfirm,
} from '~/features/account/api';
import {
  NEW_PASSWORD_HELP,
  newPasswordField,
  PASSWORDS_MISMATCH,
  passwordPolicyErrors,
  passwordsMatch,
} from '~/shared/auth/password-policy';
import { useSessionStore } from '~/shared/auth/session.store';
import { splitFieldErrors } from '~/shared/utils/form-errors';

// La ruta la fija la API: el correo enlaza a FRONTEND_BASE_URL/reset-password?token=… (API_SPEC §9.8).
useHead({
  title: 'Elegir contraseña nueva',
  meta: [{ name: 'referrer', content: 'no-referrer' }],
});

const token = useLinkToken();

// La confirmación solo la compara el navegador; a la API va una vez.
const schema = z
  .object({ newPassword: newPasswordField, confirmPassword: z.string() })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  newPassword: '',
  confirmPassword: '',
});
const form = useTemplateRef('form');
const otherMessages = ref<string[]>([]);
const confirm = usePasswordResetConfirm();
const session = useSessionStore();
const loginNotice = useLoginNotice();

const expired = computed(
  () => !token || confirm.error.value?.type === 'invalid-or-expired-token',
);
const generalProblem = computed(() => {
  const p = confirm.error.value;
  if (!p || p.type === 'invalid-or-expired-token') return null;
  if (p.type === 'password-policy-violation') return null;
  if (p.type === 'validation-error' && otherMessages.value.length === 0)
    return null;
  return p;
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  otherMessages.value = [];
  confirm.mutate(
    { token, newPassword: event.data.newPassword },
    {
      onSuccess: async () => {
        // La API cerró todas las sesiones de la cuenta, también la de esta pestaña si la había.
        if (session.isAuthenticated) session.clearLocal();
        loginNotice.value =
          'Tu contraseña cambió y se cerraron todas tus sesiones. Inicia sesión con la nueva.';
        await navigateTo('/login');
      },
      onError: (p) => {
        // Con un error de la política el enlace sigue sirviendo: se corrige y se reenvía.
        if (p.type === 'password-policy-violation') {
          form.value?.setErrors(passwordPolicyErrors(p, 'newPassword'));
        } else if (p.type === 'validation-error') {
          const { fieldErrors, otherMessages: rest } = splitFieldErrors(p, [
            'newPassword',
          ]);
          form.value?.setErrors(fieldErrors);
          otherMessages.value = rest;
        }
      },
    },
  );
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">Elegir contraseña nueva</h1>

    <div v-if="expired" class="space-y-4">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-link-2-off"
        title="El enlace venció o ya se usó."
        description="Los enlaces duran 30 minutos y solo sirve el más reciente. Pide otro."
        role="alert"
      />
      <UButton to="/forgot-password" block>Pedir otro enlace</UButton>
    </div>

    <!-- Sin demora en la validación al escribir: una validación pendiente borraría el error de la API. -->
    <UForm
      v-else
      ref="form"
      :schema="schema"
      :validate-on-input-delay="0"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <ProblemAlert
        v-if="generalProblem"
        :problem="generalProblem"
        :messages="otherMessages"
      />

      <UFormField
        label="Contraseña nueva"
        name="newPassword"
        :help="NEW_PASSWORD_HELP"
        required
      >
        <PasswordInput
          v-model="state.newPassword"
          autocomplete="new-password"
        />
      </UFormField>

      <UFormField
        label="Confirma la contraseña nueva"
        name="confirmPassword"
        required
      >
        <PasswordInput
          v-model="state.confirmPassword"
          autocomplete="new-password"
        />
      </UFormField>

      <UButton type="submit" block :loading="confirm.isPending.value"
        >Guardar contraseña</UButton
      >
    </UForm>
  </div>
</template>
