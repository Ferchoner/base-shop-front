<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';
import {
  addressFields,
  addressFieldsSchema,
  addressProblemErrors,
  checkAddress,
  toAddressInput,
} from '~/shared/address/address-form';
import {
  useCreateAddress,
  useUpdateAddress,
  type SavedAddress,
} from '~/shared/address/api';
import type { ApiProblem } from '~/shared/api/problem';

/**
 * Alta o edición de una dirección de la libreta (REQUIREMENTS §5.11), con los mismos campos que el
 * checkout. Al cambiar el estado se vuelve a pedir el municipio (lo hace `AddressFields`).
 */
const props = defineProps<{
  /** La dirección que se edita; sin ella, es un alta. */
  address?: SavedAddress;
  /** Ofrecer "Usar como predeterminada": no en la primera, que ya lo es, ni en la predeterminada. */
  offerDefault: boolean;
}>();
const emit = defineEmits<{ saved: [address: SavedAddress]; cancel: [] }>();

const schema = z
  .object({ address: addressFieldsSchema, isDefault: z.boolean() })
  .superRefine((v, ctx) => checkAddress(v.address, ctx, ['address']));
type Schema = z.input<typeof schema>;

const state = reactive<Schema>({
  address: addressFields(props.address ?? null),
  isDefault: false,
});
const form = useTemplateRef('form');
const create = useCreateAddress();
const update = useUpdateAddress();
const problem = ref<ApiProblem | null>(null);
const messages = ref<string[]>([]);
const pending = computed(
  () => create.isPending.value || update.isPending.value,
);

function showProblem(p: ApiProblem) {
  if (p.type === 'address-limit-reached') {
    const limit = Number(p.extensions.limit) || 10;
    messages.value = [
      `Tu libreta ya tiene ${limit} direcciones, el máximo. Borra una para agregar otra.`,
    ];
    return;
  }
  if (p.type === 'not-found') {
    messages.value = ['Esa dirección ya no está en tu libreta.'];
    return;
  }
  if (p.type === 'validation-error') {
    const { fieldErrors, otherMessages } = addressProblemErrors(p, 'address');
    form.value?.setErrors(fieldErrors);
    if (otherMessages.length === 0) return;
    messages.value = otherMessages;
  }
  problem.value = p;
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  problem.value = null;
  messages.value = [];
  const input = {
    ...toAddressInput(event.data.address),
    ...(props.offerDefault && event.data.isDefault && { isDefault: true }),
  };
  try {
    const saved = props.address
      ? await update.mutateAsync({ id: props.address.id, input })
      : await create.mutateAsync(input);
    emit('saved', saved);
  } catch (e) {
    showProblem(e as ApiProblem);
  }
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
    <ProblemAlert v-if="problem" :problem="problem" :messages="messages" />
    <UAlert
      v-else-if="messages.length > 0"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="messages.join(' ')"
      role="alert"
    />
    <AddressFields :address="state.address" />
    <UCheckbox
      v-if="offerDefault"
      v-model="state.isDefault"
      name="isDefault"
      label="Usar como dirección predeterminada"
    />
    <div class="flex flex-wrap gap-2">
      <UButton type="submit" :loading="pending">Guardar dirección</UButton>
      <UButton color="neutral" variant="ghost" @click="emit('cancel')"
        >Cancelar</UButton
      >
    </div>
  </UForm>
</template>
