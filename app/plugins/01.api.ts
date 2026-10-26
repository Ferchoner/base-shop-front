// Adaptado de base-ecomm-admin app/plugins/01.api.ts (commit bbcd5af, ADR-F009). La sesión llega con
// TF-010 (ADR-F006): hasta entonces el cliente no envía token ni renueva.
import { createApiClient } from '~/shared/api/client';

export default defineNuxtPlugin({
  name: 'api',
  setup() {
    const config = useRuntimeConfig();

    const api = createApiClient({
      baseURL: config.public.apiBaseUrl,
      getAccessToken: () => null,
      refreshSession: async () => false,
      onSessionExpired: () => undefined,
    });

    return { provide: { api } };
  },
});
