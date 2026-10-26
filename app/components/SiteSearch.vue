<script setup lang="ts">
/** Buscador del encabezado: lleva al catálogo con `q`, con los límites de la API (§11.2). */
const MIN = 2;
const MAX = 100;

const route = useRoute();
const query = ref(typeof route.query.q === 'string' ? route.query.q : '');
const error = ref<string | null>(null);

watch(
  () => route.query.q,
  (q) => {
    query.value = typeof q === 'string' ? q : '';
  },
);

function submit() {
  const q = query.value.trim();
  if (q.length < MIN) {
    error.value = `Escribe al menos ${MIN} letras para buscar.`;
    return;
  }
  error.value = null;
  navigateTo({ path: '/products', query: { q } });
}
</script>

<template>
  <form role="search" class="w-full" @submit.prevent="submit">
    <label for="site-search" class="sr-only">Buscar productos</label>
    <UInput
      id="site-search"
      v-model="query"
      type="search"
      name="q"
      placeholder="Buscar productos"
      icon="i-lucide-search"
      :maxlength="MAX"
      :aria-invalid="!!error"
      :aria-describedby="error ? 'site-search-error' : undefined"
      class="w-full"
      @update:model-value="error = null"
    />
    <p
      v-if="error"
      id="site-search-error"
      class="mt-1 text-sm text-error"
      aria-live="polite"
    >
      {{ error }}
    </p>
  </form>
</template>
