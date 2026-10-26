// Copiado de base-ecomm-admin app/shared/api/use-api.ts (commit bbcd5af, ADR-F009).
import type { ApiClient } from './client';

/** Cliente de la API autenticado, creado en plugins/01.api.ts. */
export function useApi(): ApiClient {
  return useNuxtApp().$api;
}
