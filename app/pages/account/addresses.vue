<script setup lang="ts">
import AddressForm from '~/features/account/components/AddressForm.vue';
import {
  useDeleteAddress,
  useMyAddresses,
  useUpdateAddress,
  type SavedAddress,
} from '~/shared/address/api';
import type { ApiProblem } from '~/shared/api/problem';
import { useConfirm } from '~/shared/ui/use-confirm';

/**
 * Mis direcciones (REQUIREMENTS §5.11): la libreta como la ordena la API (la predeterminada primero),
 * con alta, edición, borrado confirmado y cambio de predeterminada.
 */
definePageMeta({ auth: true });
useHead({ title: 'Mis direcciones' });

/** `MAX_ADDRESSES_PER_CUSTOMER` por defecto (API_SPEC §9.14); si la API tiene otro, avisa con 409. */
const MAX_ADDRESSES = 10;

const addresses = useMyAddresses(true);
const update = useUpdateAddress();
const remove = useDeleteAddress();
const confirm = useConfirm();

/** `'new'` para el alta, una dirección para editarla, `null` para la lista. */
const editing = ref<'new' | SavedAddress | null>(null);
const notice = ref<string | null>(null);
const problem = ref<ApiProblem | null>(null);
const formTitle = useTemplateRef('formTitle');

const list = computed(() => addresses.data.value ?? []);
const full = computed(() => list.value.length >= MAX_ADDRESSES);
const editedAddress = computed(() =>
  editing.value && editing.value !== 'new' ? editing.value : undefined,
);

async function open(target: 'new' | SavedAddress) {
  notice.value = null;
  problem.value = null;
  editing.value = target;
  await nextTick();
  formTitle.value?.focus();
}

function onSaved() {
  notice.value =
    editing.value === 'new'
      ? 'Agregamos la dirección.'
      : 'Guardamos los cambios.';
  editing.value = null;
}

function name(a: SavedAddress) {
  return `${a.street} ${a.exteriorNumber}`;
}

async function makeDefault(a: SavedAddress) {
  notice.value = null;
  problem.value = null;
  try {
    await update.mutateAsync({ id: a.id, input: { isDefault: true } });
    notice.value = `${name(a)} es ahora tu dirección predeterminada.`;
  } catch (e) {
    problem.value = e as ApiProblem;
  }
}

async function onDelete(a: SavedAddress) {
  notice.value = null;
  problem.value = null;
  const ok = await confirm({
    title: '¿Borrar esta dirección?',
    description: `${name(a)}, ${a.neighborhood}. Tus pedidos anteriores la conservan.`,
    confirmLabel: 'Borrar',
    color: 'error',
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(a.id);
    notice.value = a.isDefault
      ? 'Borramos la dirección. Ya no tienes una predeterminada.'
      : 'Borramos la dirección.';
  } catch (e) {
    const p = e as ApiProblem;
    // Ya no estaba (se borró en otra pestaña): la lista se vuelve a pedir.
    if (p.type === 'not-found') notice.value = 'Borramos la dirección.';
    else problem.value = p;
  }
}
</script>

<template>
  <div class="space-y-6">
    <AccountNav />
    <div class="max-w-3xl space-y-6">
      <h1 class="text-2xl font-semibold">Mis direcciones</h1>

      <section
        v-if="editing"
        aria-labelledby="address-form-title"
        class="space-y-4"
      >
        <h2
          id="address-form-title"
          ref="formTitle"
          tabindex="-1"
          class="text-lg font-semibold outline-none"
        >
          {{ editing === 'new' ? 'Agregar dirección' : 'Editar dirección' }}
        </h2>
        <AddressForm
          :key="editedAddress?.id ?? 'new'"
          :address="editedAddress"
          :offer-default="
            editing === 'new' ? list.length > 0 : !editedAddress?.isDefault
          "
          @saved="onSaved"
          @cancel="editing = null"
        />
      </section>

      <template v-else>
        <div aria-live="polite">
          <UAlert
            v-if="notice"
            color="success"
            variant="subtle"
            icon="i-lucide-check"
            :title="notice"
          />
        </div>
        <ProblemAlert v-if="problem" :problem="problem" />

        <QueryState
          :loading="addresses.isPending.value"
          :error="addresses.error.value"
          :empty="list.length === 0"
          empty-title="Aún no tienes direcciones"
          empty-description="Guarda una para no escribirla en cada compra."
          @retry="addresses.refetch()"
        >
          <ul
            aria-label="Direcciones guardadas"
            class="grid gap-4 sm:grid-cols-2"
          >
            <li
              v-for="a in list"
              :key="a.id"
              class="flex flex-col justify-between gap-4 rounded-lg border border-default p-4"
            >
              <div class="space-y-2">
                <UBadge v-if="a.isDefault" color="primary" variant="subtle"
                  >Predeterminada</UBadge
                >
                <PostalAddress :address="a" />
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  :aria-label="`Editar ${name(a)}`"
                  @click="open(a)"
                  >Editar</UButton
                >
                <UButton
                  v-if="!a.isDefault"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :aria-label="`Usar como predeterminada ${name(a)}`"
                  :loading="
                    update.isPending.value &&
                    update.variables.value?.id === a.id
                  "
                  @click="makeDefault(a)"
                  >Usar como predeterminada</UButton
                >
                <UButton
                  size="sm"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :aria-label="`Borrar ${name(a)}`"
                  :loading="
                    remove.isPending.value && remove.variables.value === a.id
                  "
                  @click="onDelete(a)"
                  >Borrar</UButton
                >
              </div>
            </li>
          </ul>
        </QueryState>

        <template v-if="!addresses.isPending.value && !addresses.error.value">
          <p v-if="full" class="text-sm text-muted">
            Tienes {{ MAX_ADDRESSES }} direcciones, el máximo. Borra una para
            agregar otra.
          </p>
          <UButton v-else icon="i-lucide-plus" @click="open('new')"
            >Agregar dirección</UButton
          >
        </template>
      </template>
    </div>
  </div>
</template>
