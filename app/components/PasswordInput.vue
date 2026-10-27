<script setup lang="ts">
/**
 * Contraseña con botón para mostrar lo escrito (REQUIREMENTS §5.7): ayuda a escribir una frase larga
 * sin repetirla a ciegas. Los atributos (`autocomplete`, `id`…) pasan al campo.
 */
defineOptions({ inheritAttrs: false });
const model = defineModel<string>();
const visible = ref(false);
</script>

<template>
  <UInput
    v-model="model"
    v-bind="$attrs"
    :type="visible ? 'text' : 'password'"
    class="w-full"
    :ui="{ trailing: 'pe-1' }"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="visible"
        @click="visible = !visible"
      />
    </template>
  </UInput>
</template>
