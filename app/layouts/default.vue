<!-- Encabezado y pie de la tienda (REQUIREMENTS §5.15). La cuenta se agrega con TF-010 y el aviso de privacidad, con TF-016. -->
<script setup lang="ts">
import CartLink from '~/features/cart/components/CartLink.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only z-50 rounded-md bg-default px-3 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >Saltar al contenido</a
    >
    <header class="border-b border-default">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:flex-nowrap"
      >
        <NuxtLink
          to="/"
          class="order-first flex shrink-0 items-center gap-2 text-lg font-semibold sm:order-none"
        >
          <UIcon
            name="i-lucide-store"
            class="size-6 text-primary"
            aria-hidden="true"
          />
          <span>Tienda</span>
        </NuxtLink>
        <nav
          aria-label="Principal"
          class="order-last w-full sm:order-none sm:w-auto"
        >
          <NuxtLink to="/products" class="text-sm font-medium hover:underline"
            >Catálogo</NuxtLink
          >
        </nav>
        <div class="min-w-0 flex-1 basis-full sm:basis-auto">
          <SiteSearch />
        </div>
        <div class="order-first ml-auto sm:order-none sm:ml-0">
          <CartLink />
        </div>
      </div>
    </header>
    <main
      id="main"
      tabindex="-1"
      class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none"
    >
      <slot />
    </main>
    <footer class="border-t border-default">
      <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
        <p>Precios en pesos mexicanos con IVA incluido.</p>
      </div>
    </footer>
  </div>
</template>
