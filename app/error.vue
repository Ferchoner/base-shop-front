<!-- Adaptado de base-ecomm-admin app/error.vue (commit bbcd5af, ADR-F009): con el encabezado de la tienda y enlaces al inicio y al catálogo (REQUIREMENTS §5.15). -->
<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const notFound = computed(() => props.error.statusCode === 404);
const copy = computed(() =>
  notFound.value
    ? {
        title: 'Página no encontrada',
        description: 'La dirección no existe o se movió.',
      }
    : {
        title: 'Algo salió mal',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      },
);

useHead({ title: copy.value.title });
</script>

<template>
  <UApp>
    <NuxtLayout>
      <section class="flex flex-col items-center gap-4 py-16 text-center">
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-10 text-muted"
          aria-hidden="true"
        />
        <h1 class="text-2xl font-semibold">{{ copy.title }}</h1>
        <p class="text-muted">{{ copy.description }}</p>
        <div class="flex flex-wrap justify-center gap-3">
          <UButton icon="i-lucide-house" @click="clearError({ redirect: '/' })"
            >Ir al inicio</UButton
          >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-shopping-bag"
            @click="clearError({ redirect: '/products' })"
            >Ver el catálogo</UButton
          >
        </div>
      </section>
    </NuxtLayout>
  </UApp>
</template>
