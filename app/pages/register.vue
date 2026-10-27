<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import { useRegister } from '~/features/account/api';
import ResendVerification from '~/features/account/components/ResendVerification.vue';
import type { ApiProblem } from '~/shared/api/problem';
import {
  NEW_PASSWORD_HELP,
  newPasswordField,
  passwordPolicyErrors,
} from '~/shared/auth/password-policy';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';
import { splitFieldErrors } from '~/shared/utils/form-errors';

/** Registro de cliente (REQUIREMENTS §5.7). No inicia sesión: el cliente verifica su email y entra. */
definePageMeta({ guestOnly: true });
useHead({ title: 'Crear cuenta' });

// Versión del aviso por variable mientras G-01 siga abierta; vacía, no hay registro.
const privacyNoticeVersion = useRuntimeConfig().public.privacyNoticeVersion;

// Límites de RegisterDto (API_SPEC §9.2): nombres de 1 a 100, email ≤ 254 y la política de ADR-0047.
const schema = z.object({
  firstNames: z
    .string()
    .trim()
    .min(1, 'Escribe tu nombre.')
    .max(100, 'Máximo 100 caracteres.'),
  lastNames: z
    .string()
    .trim()
    .min(1, 'Escribe tus apellidos.')
    .max(100, 'Máximo 100 caracteres.'),
  email: z.email('Escribe un email válido.').max(254, 'Máximo 254 caracteres.'),
  password: newPasswordField,
  privacy: z
    .boolean()
    .refine((v) => v, 'Acepta el aviso de privacidad para continuar.'),
});
type Schema = z.output<typeof schema>;

const FIELDS = ['firstNames', 'lastNames', 'email', 'password'] as const;

const state = reactive<{
  firstNames: string;
  lastNames: string;
  email: string;
  password: string;
  privacy: boolean;
}>({ firstNames: '', lastNames: '', email: '', password: '', privacy: false });
const form = useTemplateRef('form');
const problem = ref<ApiProblem | null>(null);
const otherMessages = ref<string[]>([]);
const duplicate = ref(false);
const registeredEmail = ref<string | null>(null);
const register = useRegister();
const cooldown = useRetryCooldown();

function onSubmit(event: FormSubmitEvent<Schema>) {
  problem.value = null;
  otherMessages.value = [];
  duplicate.value = false;
  const { privacy: _accepted, ...data } = event.data;
  void _accepted;
  register.mutate(
    { ...data, privacyNoticeVersion },
    {
      onSuccess: (account) => {
        registeredEmail.value = account.email;
      },
      onError: (p) => {
        cooldown.track(p);
        if (p.type === 'password-policy-violation') {
          form.value?.setErrors(passwordPolicyErrors(p, 'password'));
        } else if (
          p.type === 'duplicate-value' &&
          p.extensions.field === 'email'
        ) {
          duplicate.value = true;
          form.value?.setErrors([
            { name: 'email', message: 'Ya existe una cuenta con ese email.' },
          ]);
        } else if (p.type === 'validation-error') {
          const { fieldErrors, otherMessages: rest } = splitFieldErrors(p, [
            ...FIELDS,
          ]);
          form.value?.setErrors(fieldErrors);
          otherMessages.value = rest;
          if (rest.length > 0) problem.value = p;
        } else {
          problem.value = p;
        }
      },
    },
  );
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">
      {{ registeredEmail ? 'Revisa tu correo' : 'Crear cuenta' }}
    </h1>

    <UAlert
      v-if="!privacyNoticeVersion"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      title="El registro no está disponible por ahora."
      description="Puedes comprar como invitado o iniciar sesión si ya tienes cuenta."
    />

    <div v-else-if="registeredEmail" class="space-y-4">
      <p>
        Te enviamos un enlace a
        <strong class="break-all">{{ registeredEmail }}</strong> para verificar
        tu email. Vence en 24 horas y el correo puede tardar unos minutos.
      </p>
      <p class="text-sm text-muted">
        Necesitas verificarlo para comprar con tu cuenta. Mientras tanto, ya
        puedes iniciar sesión.
      </p>
      <ResendVerification :email="registeredEmail" />
      <UButton to="/login" block>Iniciar sesión</UButton>
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
        v-if="problem"
        :problem="problem"
        :messages="otherMessages"
      />
      <UAlert
        v-if="duplicate"
        color="warning"
        variant="subtle"
        icon="i-lucide-user-check"
        role="alert"
        title="Ya existe una cuenta con ese email."
      >
        <template #description>
          <span class="flex flex-wrap gap-x-4 gap-y-1">
            <NuxtLink to="/login" class="font-medium underline"
              >Iniciar sesión</NuxtLink
            >
            <NuxtLink to="/forgot-password" class="font-medium underline"
              >Recuperar la contraseña</NuxtLink
            >
          </span>
        </template>
      </UAlert>

      <UFormField label="Nombre o nombres" name="firstNames" required>
        <UInput
          v-model="state.firstNames"
          autocomplete="given-name"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Apellidos" name="lastNames" required>
        <UInput
          v-model="state.lastNames"
          autocomplete="family-name"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Contraseña"
        name="password"
        :help="NEW_PASSWORD_HELP"
        required
      >
        <PasswordInput v-model="state.password" autocomplete="new-password" />
      </UFormField>
      <UFormField name="privacy">
        <UCheckbox
          v-model="state.privacy"
          :label="`Acepto el aviso de privacidad (versión ${privacyNoticeVersion}).`"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        :loading="register.isPending.value"
        :disabled="cooldown.waiting.value"
        >Crear cuenta</UButton
      >
      <p class="text-center text-sm">
        ¿Ya tienes cuenta?
        <NuxtLink to="/login" class="font-medium underline"
          >Inicia sesión</NuxtLink
        >
      </p>
    </UForm>
  </div>
</template>
