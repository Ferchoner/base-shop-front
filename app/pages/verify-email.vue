<script setup lang="ts">
import { useConfirmEmail, useLinkToken } from '~/features/account/api';
import ResendVerification from '~/features/account/components/ResendVerification.vue';
import { useSessionStore } from '~/shared/auth/session.store';

/**
 * Verificación del email desde el enlace del correo (REQUIREMENTS §5.7). La ruta la fija la API:
 * `FRONTEND_BASE_URL/verify-email?token=…` (API_SPEC §9.2).
 */
useHead({
  title: 'Verificar email',
  // El token ya salió de la URL, pero por si acaso no viaja en ningún Referer (SECURITY.md).
  meta: [{ name: 'referrer', content: 'no-referrer' }],
});

const token = useLinkToken();
const confirm = useConfirmEmail();
const session = useSessionStore();

const expired = computed(
  () => !token || confirm.error.value?.type === 'invalid-or-expired-token',
);
const otherProblem = computed(() =>
  confirm.error.value?.type === 'invalid-or-expired-token'
    ? null
    : confirm.error.value,
);

function send() {
  confirm.mutate(token, {
    // Con sesión abierta, la cuenta se vuelve a leer para que ya diga "Verificado".
    onSuccess: () => {
      if (session.isAuthenticated) session.loadAccount().catch(() => undefined);
    },
  });
}

onMounted(() => {
  if (token) send();
});
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">Verificar email</h1>

    <div aria-live="polite" class="space-y-4">
      <p v-if="confirm.isPending.value" class="text-muted">
        Verificando tu email…
      </p>

      <template v-else-if="confirm.isSuccess.value">
        <UAlert
          color="success"
          variant="subtle"
          icon="i-lucide-circle-check"
          title="Tu email quedó verificado."
          description="Ya puedes comprar con tu cuenta."
        />
        <UButton :to="session.isAuthenticated ? '/account' : '/login'" block>{{
          session.isAuthenticated ? 'Ir a mi cuenta' : 'Iniciar sesión'
        }}</UButton>
      </template>
    </div>

    <template v-if="!confirm.isPending.value && expired">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-link-2-off"
        role="alert"
        title="El enlace venció o ya se usó."
        description="Pide otro con el email de tu cuenta. Solo sirve el más reciente."
      />
      <ResendVerification />
    </template>

    <template v-else-if="otherProblem">
      <ProblemAlert :problem="otherProblem" />
      <UButton color="neutral" variant="outline" @click="send"
        >Intentar de nuevo</UButton
      >
    </template>
  </div>
</template>
