<script setup lang="ts">
import { useSessionStore } from '~/shared/auth/session.store';
import { useCartIdStore } from '~/shared/stores/cart-id';

/**
 * Cuenta del encabezado (REQUIREMENTS §5.8, §5.15): "Mi cuenta" y "Cerrar sesión" con sesión,
 * "Iniciar sesión" sin ella. Mientras se recupera la sesión no muestra nada, para no parpadear.
 */
const session = useSessionStore();
const cartId = useCartIdStore();
const route = useRoute();
const loggingOut = ref(false);

/** Al iniciar sesión desde aquí se regresa a la pantalla actual (REQUIREMENTS §5.8). */
const loginTo = computed(() =>
  route.path === '/' || route.path === '/login'
    ? '/login'
    : { path: '/login', query: { redirect: route.fullPath } },
);

async function logout() {
  loggingOut.value = true;
  try {
    await session.logout();
    // El carrito se queda en la cuenta y la tienda sigue sin carrito de invitado (§4.5).
    cartId.forget();
    if (route.meta.auth) await navigateTo('/');
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <div v-if="session.isAuthenticated" class="flex items-center gap-1">
    <UButton
      to="/account"
      color="neutral"
      variant="ghost"
      icon="i-lucide-user"
      aria-label="Mi cuenta"
    >
      <span class="hidden sm:inline">Mi cuenta</span>
    </UButton>
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-log-out"
      aria-label="Cerrar sesión"
      :loading="loggingOut"
      @click="logout"
    >
      <span class="hidden sm:inline">Cerrar sesión</span>
    </UButton>
  </div>
  <UButton
    v-else-if="session.isSettled"
    :to="loginTo"
    color="neutral"
    variant="ghost"
    icon="i-lucide-log-in"
    aria-label="Iniciar sesión"
  >
    <span class="hidden sm:inline">Iniciar sesión</span>
  </UButton>
</template>
