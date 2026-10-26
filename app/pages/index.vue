<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { useApi } from '~/shared/api/use-api';
import type { Schemas } from '~/shared/api/types';

useHead({ title: 'Tienda' });

// Página provisional del esqueleto (TF-004): comprueba que la tienda llega a la API. El inicio real
// llega con TF-007 (REQUIREMENTS §5.1).
const api = useApi();
const categories = useQuery({
  queryKey: ['catalog', 'categories'],
  queryFn: () =>
    api<Schemas['PublicCategoryTreeDto']>('/v1/catalog/categories', {
      auth: false,
    }),
});
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Tienda en construcción</h1>
    <p v-if="categories.isPending.value" aria-live="polite">
      Conectando con la API…
    </p>
    <UAlert
      v-else-if="categories.isError.value"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se pudo conectar con la API"
      description="Revisa que la API esté corriendo y que este origen esté en CORS_ALLOWED_ORIGINS."
      role="alert"
    />
    <p v-else aria-live="polite">
      Conectada con la API:
      {{ categories.data.value?.data.length ?? 0 }} categorías visibles.
    </p>
  </section>
</template>
