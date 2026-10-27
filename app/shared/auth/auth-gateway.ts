// Adaptado de base-ecomm-admin app/shared/auth/auth-gateway.ts (commit bbcd5af, ADR-F009): sin el
// cambio de contraseña, que en la tienda llega con Mi cuenta (TF-013).
import type { ApiClient } from '~/shared/api/client';
import type { Account, AuthResult } from '~/shared/api/types';

/**
 * Operaciones de autenticación (API_SPEC §9.5–9.10). Llevan el token de forma explícita y sin
 * renovación automática, para que la renovación nunca se llame a sí misma.
 */
export interface AuthGateway {
  login(credentials: { email: string; password: string }): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthResult>;
  logout(accessToken: string, refreshToken: string): Promise<void>;
  me(accessToken: string): Promise<Account>;
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export function createHttpAuthGateway(api: ApiClient): AuthGateway {
  return {
    login: (credentials) =>
      api<AuthResult>('/v1/auth/login', {
        method: 'POST',
        body: credentials,
        auth: false,
      }),
    refresh: (refreshToken) =>
      api<AuthResult>('/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      }),
    logout: (accessToken, refreshToken) =>
      api<undefined>('/v1/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        headers: bearer(accessToken),
        auth: false,
      }),
    me: (accessToken) =>
      api<Account>('/v1/me', { headers: bearer(accessToken), auth: false }),
  };
}
