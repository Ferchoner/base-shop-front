<script setup lang="ts">
import { useSessionStore } from '~/shared/auth/session.store';

/**
 * Mi cuenta (REQUIREMENTS §5.10), por ahora solo con los datos de `GET /v1/me` que ya tiene la
 * sesión. Los cambios de datos, contraseña y email llegan con TF-013.
 */
definePageMeta({ auth: true });
useHead({ title: 'Mi cuenta' });

const session = useSessionStore();
const account = computed(() => session.account);
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Mi cuenta</h1>
    <dl v-if="account" class="max-w-md space-y-3">
      <div>
        <dt class="text-sm text-muted">Nombre</dt>
        <dd>{{ account.firstNames }} {{ account.lastNames }}</dd>
      </div>
      <div>
        <dt class="text-sm text-muted">Email</dt>
        <dd class="flex flex-wrap items-center gap-2">
          <span class="break-all">{{ account.email }}</span>
          <UBadge
            :color="account.emailVerified ? 'success' : 'warning'"
            variant="subtle"
            >{{
              account.emailVerified ? 'Verificado' : 'Sin verificar'
            }}</UBadge
          >
        </dd>
      </div>
    </dl>
  </div>
</template>
