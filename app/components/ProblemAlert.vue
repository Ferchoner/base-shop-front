<!-- Adaptado de base-ecomm-admin app/components/ProblemAlert.vue (commit bbcd5af, ADR-F009): el texto sale de problemMessage, no de la API (REQUIREMENTS §4.1). -->
<script setup lang="ts">
import type { ApiProblem } from '~/shared/api/problem';
import { problemMessage } from '~/shared/api/problem-message';

const props = defineProps<{
  problem: ApiProblem;
  /** Mensajes adicionales (por ejemplo, errores de validación sin campo en el formulario). */
  messages?: string[];
}>();

const message = computed(() => problemMessage(props.problem));
const description = computed(() =>
  [message.value.description, ...(props.messages ?? [])]
    .filter(Boolean)
    .join(' '),
);
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="i-lucide-circle-alert"
    :title="message.title"
    :description="description || undefined"
    role="alert"
  >
    <template v-if="message.reference" #actions>
      <span class="text-xs text-muted"
        >Referencia para soporte: {{ message.reference }}</span
      >
    </template>
  </UAlert>
</template>
