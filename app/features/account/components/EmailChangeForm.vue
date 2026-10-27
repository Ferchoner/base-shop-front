<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { splitFieldErrors } from '~/shared/utils/form-errors';
import { useChangeEmail } from '../api';

/**
 * Cambio de email con la contraseña actual (API_SPEC §9.13). El nuevo queda sin verificar y el
 * cliente no puede comprar hasta verificarlo (BR-USR-11).
 */
const schema = z.object({
  newEmail: z
    .email('Escribe un email válido.')
    .max(254, 'Máximo 254 caracteres.'),
  currentPassword: z
    .string()
    .min(1, 'Escribe tu contraseña actual.')
    .max(256, 'Máximo 256 caracteres.'),
});
type Schema = z.output<typeof schema>;
const FIELDS = ['newEmail', 'currentPassword'] as const;

const state = reactive<Schema>({ newEmail: '', currentPassword: '' });
const form = useTemplateRef('form');
const change = useChangeEmail();
const cooldown = useRetryCooldown();
const changedTo = ref<string | null>(null);
const otherMessages = ref<string[]>([]);

/** Los errores con campo van junto a él; el resto, arriba del formulario. */
const generalProblem = computed(() => {
  const p = change.error.value;
  if (!p) return null;
  if (p.type === 'invalid-credentials' || p.type === 'duplicate-value')
    return null;
  if (p.type === 'validation-error' && otherMessages.value.length === 0)
    return null;
  return p;
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  changedTo.value = null;
  otherMessages.value = [];
  change.mutate(event.data, {
    onSuccess: (account) => {
      changedTo.value = account.email;
      state.newEmail = '';
      state.currentPassword = '';
      form.value?.clear();
    },
    onError: (p) => {
      cooldown.track(p);
      if (p.type === 'invalid-credentials') {
        form.value?.setErrors([
          {
            name: 'currentPassword',
            message: 'La contraseña no es correcta.',
          },
        ]);
      } else if (p.type === 'duplicate-value') {
        form.value?.setErrors([
          { name: 'newEmail', message: 'Ese email ya tiene una cuenta.' },
        ]);
      } else if (p.type === 'validation-error') {
        const { fieldErrors, otherMessages: rest } = splitFieldErrors(
          p,
          FIELDS,
        );
        form.value?.setErrors(
          fieldErrors.map((e) =>
            p.errors.some((x) => x.field === e.name && x.code === 'sameEmail')
              ? { ...e, message: 'Es el email que ya tienes.' }
              : e,
          ),
        );
        otherMessages.value = rest;
      }
    },
  });
}
</script>

<template>
  <div class="space-y-4">
    <div aria-live="polite">
      <UAlert
        v-if="changedTo"
        color="success"
        variant="subtle"
        icon="i-lucide-mail-check"
        :title="`Tu email ahora es ${changedTo}.`"
        description="Te enviamos un enlace para verificarlo. Hasta que lo verifiques no podrás comprar."
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
      <UFormField label="Email nuevo" name="newEmail" required>
        <UInput
          v-model="state.newEmail"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Contraseña actual"
        name="currentPassword"
        help="Para confirmar que eres tú."
        required
      >
        <PasswordInput
          v-model="state.currentPassword"
          autocomplete="current-password"
        />
      </UFormField>
      <UButton
        type="submit"
        :loading="change.isPending.value"
        :disabled="cooldown.waiting.value"
        >Cambiar email</UButton
      >
    </UForm>
  </div>
</template>
