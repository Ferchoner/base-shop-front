<!-- Copiado de base-ecomm-admin app/components/QueryState.vue (commit bbcd5af, ADR-F009). Suma el slot de carga y oculta los esqueletos al lector de pantalla. -->
<script setup lang="ts">
import type { ApiProblem } from '~/shared/api/problem';

/** Estados de carga, error y vacío de una consulta; el contenido va en el slot por defecto. */
defineProps<{
  loading: boolean;
  error: ApiProblem | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <!-- USkeleton anuncia cada esqueleto como alerta; se ocultan y se anuncia una sola vez. -->
  <div v-if="loading" role="status">
    <span class="sr-only">Cargando…</span>
    <div aria-hidden="true">
      <slot name="loading">
        <div class="space-y-2">
          <USkeleton v-for="n in 5" :key="n" class="h-10 w-full" />
        </div>
      </slot>
    </div>
  </div>
  <div v-else-if="error" class="space-y-3">
    <ProblemAlert :problem="error" />
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-refresh-cw"
      @click="emit('retry')"
      >Reintentar</UButton
    >
  </div>
  <UEmpty
    v-else-if="empty"
    icon="i-lucide-inbox"
    :title="emptyTitle ?? 'Sin resultados'"
    :description="emptyDescription"
  >
    <template #actions><slot name="empty-actions" /></template>
  </UEmpty>
  <slot v-else />
</template>
