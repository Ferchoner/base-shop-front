<script setup lang="ts">
// Adaptado de base-ecomm-admin app/pages/cambiar-contrasena.vue (commit bbcd5af): sin la contraseña
// temporal del staff, con los mensajes de la política por regla y la espera de un 429.
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import {
  NEW_PASSWORD_HELP,
  newPasswordField,
  PASSWORDS_MISMATCH,
  passwordPolicyErrors,
  passwordsMatch,
} from '~/shared/auth/password-policy';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { splitFieldErrors } from '~/shared/utils/form-errors';
import { useChangePassword } from '../api';

/** Cambio de contraseña (API_SPEC §9.12): esta sesión sigue abierta y la API cierra las demás. */
const schema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Escribe tu contraseña actual.')
      .max(256, 'Máximo 256 caracteres.'),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);
type Schema = z.output<typeof schema>;
const FIELDS = ['currentPassword', 'newPassword'] as const;

const state = reactive<Schema>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const form = useTemplateRef('form');
const change = useChangePassword();
const cooldown = useRetryCooldown();
const changed = ref(false);
const otherMessages = ref<string[]>([]);

const generalProblem = computed(() => {
  const p = change.error.value;
  if (!p) return null;
  if (
    p.type === 'invalid-credentials' ||
    p.type === 'password-policy-violation'
  )
    return null;
  if (p.type === 'validation-error' && otherMessages.value.length === 0)
    return null;
  return p;
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  changed.value = false;
  otherMessages.value = [];
  change.mutate(
    {
      currentPassword: event.data.currentPassword,
      newPassword: event.data.newPassword,
    },
    {
      onSuccess: () => {
        changed.value = true;
        state.currentPassword = '';
        state.newPassword = '';
        state.confirmPassword = '';
        form.value?.clear();
      },
      onError: (p) => {
        cooldown.track(p);
        if (p.type === 'invalid-credentials') {
          form.value?.setErrors([
            {
              name: 'currentPassword',
              message: 'La contraseña actual no es correcta.',
            },
          ]);
        } else if (p.type === 'password-policy-violation') {
          form.value?.setErrors(passwordPolicyErrors(p, 'newPassword'));
        } else if (p.type === 'validation-error') {
          const { fieldErrors, otherMessages: rest } = splitFieldErrors(
            p,
            FIELDS,
          );
          form.value?.setErrors(fieldErrors);
          otherMessages.value = rest;
        }
      },
    },
  );
}
</script>

<template>
  <div class="space-y-4">
    <div aria-live="polite">
      <UAlert
        v-if="changed"
        color="success"
        variant="subtle"
        icon="i-lucide-key-round"
        title="Cambiamos tu contraseña."
        description="Esta sesión sigue abierta y cerramos las demás, en otros navegadores o dispositivos."
      />
    </div>
    <UForm
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
      <UFormField label="Contraseña actual" name="currentPassword" required>
        <PasswordInput
          v-model="state.currentPassword"
          autocomplete="current-password"
        />
      </UFormField>
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
      <UButton
        type="submit"
        :loading="change.isPending.value"
        :disabled="cooldown.waiting.value"
        >Guardar contraseña</UButton
      >
    </UForm>
  </div>
</template>
