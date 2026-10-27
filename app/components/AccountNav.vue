<script setup lang="ts">
/**
 * Navegación de Mi cuenta (REQUIREMENTS §5.10 a §5.12) entre sus pantallas. Es un componente y no
 * una página padre: una ruta anidada partía el JavaScript inicial en más archivos (ADR-F012).
 */
const links = [
  { to: '/account', label: 'Mis datos', exact: true },
  { to: '/account/orders', label: 'Mis pedidos', exact: false },
  { to: '/account/addresses', label: 'Mis direcciones', exact: true },
];
const route = useRoute();
const isCurrent = (link: (typeof links)[number]) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to);
</script>

<template>
  <nav aria-label="Mi cuenta" class="border-b border-default">
    <ul class="-mb-px flex flex-wrap gap-x-6">
      <li v-for="link in links" :key="link.to">
        <NuxtLink
          :to="link.to"
          :aria-current="isCurrent(link) ? 'page' : undefined"
          class="inline-block border-b-2 py-2 text-sm font-medium"
          :class="
            isCurrent(link)
              ? 'border-primary text-default'
              : 'border-transparent text-muted hover:text-default'
          "
          >{{ link.label }}</NuxtLink
        >
      </li>
    </ul>
  </nav>
</template>
