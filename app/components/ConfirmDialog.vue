<!-- Adaptado de base-ecomm-admin app/components/ConfirmDialog.vue (commit bbcd5af, ADR-F009): sin el motivo que pide la auditoría del backoffice. -->
<script setup lang="ts">
/** Confirmación genérica. Se abre con `useConfirm()` de `shared/ui/use-confirm.ts`. */
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
    color?: 'primary' | 'error' | 'warning';
  }>(),
  {
    description: undefined,
    confirmLabel: 'Confirmar',
    color: 'primary',
  },
);

const emit = defineEmits<{ close: [result: { confirmed: boolean }] }>();
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :close="false"
    @update:open="(open) => !open && emit('close', { confirmed: false })"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click="emit('close', { confirmed: false })"
          >Cancelar</UButton
        >
        <UButton :color="color" @click="emit('close', { confirmed: true })">{{
          confirmLabel
        }}</UButton>
      </div>
    </template>
  </UModal>
</template>
