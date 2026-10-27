// Adaptado de base-ecomm-admin app/plugins/02.vue-query.ts (commit bbcd5af, ADR-F009): sin las
// reacciones a errores del staff; conserva el vaciado de la caché al cerrar sesión (ADR-F006).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { ApiProblem, isRetryableRead } from '~/shared/api/problem';
import { useSessionStore } from '~/shared/auth/session.store';

export default defineNuxtPlugin({
  name: 'vue-query',
  dependsOn: ['api'],
  setup(nuxtApp) {
    const session = useSessionStore();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          // Las lecturas reintentan una vez ante red, tiempo o 5xx (REQUIREMENTS §4.1).
          retry: (failureCount, error) =>
            failureCount < 1 &&
            error instanceof ApiProblem &&
            isRetryableRead(error),
          refetchOnWindowFocus: true,
        },
        // Las escrituras nunca se reintentan solas (REQUIREMENTS §4.1).
        mutations: { retry: false, networkMode: 'always' },
      },
    });

    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
    // Al cerrar sesión no deben quedar datos de otro cliente en caché.
    session.$onAction(({ name, after }) => {
      if (
        name === 'logout' ||
        name === 'clearLocal' ||
        name === 'expireFromOtherTab'
      ) {
        after(() => queryClient.clear());
      }
    });
  },
});
