import { useMutation } from '@tanstack/vue-query';
import type { ApiProblem } from '~/shared/api/problem';
import type { Account } from '~/shared/api/types';
import { useApi } from '~/shared/api/use-api';

/**
 * Registro, verificación de email y recuperación de contraseña (API_SPEC §9.2–9.4, §9.8–9.9). Son
 * rutas públicas: no envían token ni renuevan la sesión.
 */
const post = <T>(path: string) => {
  const api = useApi();
  return (body: Record<string, unknown>) =>
    api<T>(path, { method: 'POST', body, auth: false });
};

export interface Registration {
  email: string;
  password: string;
  firstNames: string;
  lastNames: string;
  privacyNoticeVersion: string;
}

/** 201 `Account`; no inicia sesión (§9.2). */
export function useRegister() {
  const send = post<Account>('/v1/auth/register');
  return useMutation<Account, ApiProblem, Registration>({
    mutationFn: (body) => send({ ...body }),
  });
}

/** 200 `{ emailVerified: true }` o 400 `invalid-or-expired-token` (§9.3). */
export function useConfirmEmail() {
  const send = post<{ emailVerified: boolean }>(
    '/v1/auth/email-verification/confirm',
  );
  return useMutation<{ emailVerified: boolean }, ApiProblem, string>({
    mutationFn: (token) => send({ token }),
  });
}

/** 202 siempre, exista o no el email (§9.4, BR-USR-12): la pantalla no lo revela. */
export function useResendVerification() {
  const send = post<undefined>('/v1/auth/email-verification/resend');
  return useMutation<undefined, ApiProblem, string>({
    mutationFn: (email) => send({ email }),
  });
}

// Copiado de base-ecomm-admin app/features/account/api.ts (commit bbcd5af): las dos de recuperación.
/** 202 siempre, exista o no el email (§9.8). */
export function usePasswordResetRequest() {
  const send = post<undefined>('/v1/auth/password-reset/request');
  return useMutation<undefined, ApiProblem, string>({
    mutationFn: (email) => send({ email }),
  });
}

/** 204; revoca todas las sesiones de la cuenta (§9.9). */
export function usePasswordResetConfirm() {
  const send = post<undefined>('/v1/auth/password-reset/confirm');
  return useMutation<
    undefined,
    ApiProblem,
    { token: string; newPassword: string }
  >({
    mutationFn: (body) => send({ ...body }),
  });
}

/** Aviso que `/login` muestra al llegar desde otra pantalla, como el restablecimiento (§5.9). */
export function useLoginNotice() {
  return useState<string | null>('login-notice', () => null);
}

/**
 * Lee el `token` de un enlace del correo y lo quita de la URL visible, para que no quede en el
 * historial ni en un `Referer` (SECURITY.md). Se lee una sola vez, al abrir la pantalla.
 */
export function useLinkToken(): string {
  const route = useRoute();
  const router = useRouter();
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  if (route.query.token !== undefined) {
    const { token: _removed, ...rest } = route.query;
    void _removed;
    router.replace({ query: rest, hash: route.hash });
  }
  return token;
}
