<!-- Encabezado y pie de la tienda (REQUIREMENTS §5.15). El carrito y la cuenta se agregan con TF-009 y TF-010; el aviso de privacidad, con TF-016. -->
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
          class="flex shrink-0 items-center gap-2 text-lg font-semibold"
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
