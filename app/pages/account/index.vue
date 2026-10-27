<script setup lang="ts">
import EmailChangeForm from '~/features/account/components/EmailChangeForm.vue';
import PasswordChangeForm from '~/features/account/components/PasswordChangeForm.vue';
import ProfileForm from '~/features/account/components/ProfileForm.vue';
import ResendVerification from '~/features/account/components/ResendVerification.vue';
import { useSessionStore } from '~/shared/auth/session.store';

/**
 * Mis datos (REQUIREMENTS §5.10): nombre, email con su verificación, cambio de email y de contraseña.
 * La cuenta es la de la sesión, que se actualiza con lo que responde cada cambio.
 */
definePageMeta({ auth: true });
useHead({ title: 'Mi cuenta' });

const session = useSessionStore();
const account = computed(() => session.account);
</script>

<template>
  <div class="space-y-6">
    <AccountNav />
    <div v-if="account" class="max-w-2xl space-y-10">
      <h1 class="text-2xl font-semibold">Mi cuenta</h1>

      <section aria-labelledby="profile-title" class="space-y-4">
        <h2 id="profile-title" class="text-lg font-semibold">Tus datos</h2>
        <ProfileForm :account="account" />
      </section>

      <section aria-labelledby="email-title" class="space-y-4">
        <h2 id="email-title" class="text-lg font-semibold">Email</h2>
        <p class="flex flex-wrap items-center gap-2">
          <span class="break-all">{{ account.email }}</span>
          <UBadge
            :color="account.emailVerified ? 'success' : 'warning'"
            variant="subtle"
            >{{
              account.emailVerified ? 'Verificado' : 'Sin verificar'
            }}</UBadge
          >
        </p>
        <div v-if="!account.emailVerified" class="space-y-3">
          <p class="text-sm">
            Verifica tu email con el enlace que te enviamos para poder comprar.
          </p>
          <ResendVerification :email="account.email" />
        </div>
        <h3 class="pt-2 font-semibold">Cambiar email</h3>
        <EmailChangeForm />
      </section>

      <section aria-labelledby="password-title" class="space-y-4">
        <h2 id="password-title" class="text-lg font-semibold">
          Cambiar contraseña
        </h2>
        <PasswordChangeForm />
      </section>
    </div>
  </div>
</template>
