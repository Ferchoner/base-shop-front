// Adaptado de base-ecomm-admin app/plugins/02.vue-query.ts (commit bbcd5af, ADR-F009): sin las
// reacciones a errores del staff. Las de la sesión llegan con TF-010.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { ApiProblem, isRetryableRead } from '~/shared/api/problem';

export default defineNuxtPlugin({
  name: 'vue-query',
  dependsOn: ['api'],
  setup(nuxtApp) {
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
  },
});
