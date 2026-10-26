<!-- Encabezado y pie provisionales: los definitivos llegan con TF-006 (REQUIREMENTS §5.15). -->
<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-6xl items-center gap-2 p-4">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold">
          <UIcon
            name="i-lucide-store"
            class="size-6 text-primary"
            aria-hidden="true"
          />
          <span>Tienda</span>
        </NuxtLink>
      </div>
    </header>
    <main id="main" class="mx-auto w-full max-w-6xl flex-1 p-4">
      <slot />
    </main>
    <footer class="border-t border-default">
      <p class="mx-auto max-w-6xl p-4 text-sm text-muted">
        Tienda en desarrollo, solo en local.
      </p>
    </footer>
  </div>
</template>
