<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import type { Account } from '~/shared/api/types';
import { splitFieldErrors } from '~/shared/utils/form-errors';
import { useUpdateProfile } from '../api';

/** Nombres y apellidos del cliente (API_SPEC §9.11). El email se cambia aparte. */
const props = defineProps<{ account: Account }>();

// Límites de UpdateMeDto: de 1 a 100 caracteres, como en el registro.
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
});
type Schema = z.output<typeof schema>;
const FIELDS = ['firstNames', 'lastNames'] as const;

const state = reactive<Schema>({
  firstNames: props.account.firstNames,
  lastNames: props.account.lastNames,
});
const form = useTemplateRef('form');
const update = useUpdateProfile();
const saved = ref(false);
const otherMessages = ref<string[]>([]);

const generalProblem = computed(() => {
  const p = update.error.value;
  if (!p || (p.type === 'validation-error' && otherMessages.value.length === 0))
    return null;
  return p;
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  saved.value = false;
  otherMessages.value = [];
  update.mutate(event.data, {
    onSuccess: () => {
      saved.value = true;
    },
    onError: (p) => {
      if (p.type !== 'validation-error') return;
      const { fieldErrors, otherMessages: rest } = splitFieldErrors(p, FIELDS);
      form.value?.setErrors(fieldErrors);
      otherMessages.value = rest;
    },
  });
}
</script>

<template>
  <UForm
    ref="form"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <ProblemAlert
      v-if="generalProblem"
      :problem="generalProblem"
      :messages="otherMessages"
    />
    <div class="grid gap-4 sm:grid-cols-2">
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
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <UButton type="submit" :loading="update.isPending.value"
        >Guardar datos</UButton
      >
      <p v-if="saved" role="status" class="text-sm text-success">
        Guardamos tus datos.
      </p>
    </div>
  </UForm>
</template>
