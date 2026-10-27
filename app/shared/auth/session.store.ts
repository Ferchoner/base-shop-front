// Adaptado de base-ecomm-admin app/shared/auth/session.store.ts (commit bbcd5af, ADR-F009): la tienda
// pide una cuenta de cliente en vez de staff (REQUIREMENTS §1) y no tiene permisos ni contraseña
// temporal.
import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { ApiProblem } from '~/shared/api/problem';
import type { Account, AuthResult } from '~/shared/api/types';
import type { AuthGateway } from './auth-gateway';
import type { RunExclusive } from './exclusive';
import type { TokenStorage } from './token-storage';

export type SessionStatus =
  'idle' | 'restoring' | 'authenticated' | 'anonymous';

export interface SessionDeps {
  gateway: AuthGateway;
  storage: TokenStorage;
  runExclusive: RunExclusive;
}

/**
 * Margen antes del vencimiento del token de acceso para renovarlo sin esperar un 401. Con un TTL
 * corto (`ACCESS_TOKEN_TTL` de la API) se usa la mitad del TTL para no renovar sin parar.
 */
const REFRESH_MARGIN_SECONDS = 60;

/** Una cuenta de staff no compra en la tienda (base-shop E-09); el mensaje sale de `problemMessage`. */
export const STAFF_ACCOUNT_PROBLEM_TYPE = 'staff-cannot-purchase';

/**
 * Sesión del cliente (ADR-F006): token de acceso en memoria y cuenta de `GET /v1/me`. No guarda
 * datos de negocio: eso es server state de TanStack Query.
 */
export const useSessionStore = defineStore('session', () => {
  const deps = shallowRef<SessionDeps | null>(null);
  const accessToken = ref<string | null>(null);
  const account = ref<Account | null>(null);
  const status = ref<SessionStatus>('idle');

  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let inflightRefresh: Promise<boolean> | null = null;
  let restoring: Promise<void> | null = null;

  const isAuthenticated = computed(() => status.value === 'authenticated');
  /** Ya se sabe si hay sesión: antes, la tienda no pide el carrito ni pinta la cuenta. */
  const isSettled = computed(
    () => status.value === 'authenticated' || status.value === 'anonymous',
  );

  function requireDeps(): SessionDeps {
    if (!deps.value)
      throw new Error('La sesión no está inicializada: falta init().');
    return deps.value;
  }

  function init(sessionDeps: SessionDeps) {
    deps.value = sessionDeps;
  }

  function clearTimer() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  function scheduleRefresh(expiresInSeconds: number) {
    clearTimer();
    const margin = Math.min(REFRESH_MARGIN_SECONDS, expiresInSeconds / 2);
    const delay = Math.max(expiresInSeconds - margin, 5) * 1000;
    refreshTimer = setTimeout(() => {
      refresh().catch(() => undefined);
    }, delay);
  }

  function applyAuthResult(result: AuthResult) {
    const { storage } = requireDeps();
    accessToken.value = result.accessToken;
    storage.write(result.refreshToken);
    scheduleRefresh(result.accessTokenExpiresIn);
  }

  /** Cierra la sesión solo en esta pestaña y borra el refresh token compartido. */
  function clearLocal() {
    clearTimer();
    accessToken.value = null;
    account.value = null;
    status.value = 'anonymous';
    deps.value?.storage.clear();
  }

  /** Otra pestaña cerró la sesión: se limpia la memoria sin tocar la API ni el almacenamiento. */
  function expireFromOtherTab() {
    clearTimer();
    accessToken.value = null;
    account.value = null;
    status.value = 'anonymous';
  }

  /**
   * Lee la cuenta. Una de staff no compra en la tienda (REQUIREMENTS §1): no llega a contar como
   * sesión, para que el carrito nunca la use.
   */
  async function loadAccount() {
    const { gateway } = requireDeps();
    if (!accessToken.value) throw new Error('Sin token de acceso.');
    const me = await gateway.me(accessToken.value);
    if (me.type !== 'CUSTOMER')
      throw new ApiProblem({
        type: STAFF_ACCOUNT_PROBLEM_TYPE,
        status: 403,
        title: 'Las cuentas de personal no compran en la tienda en línea',
      });
    account.value = me;
    status.value = 'authenticated';
  }

  const isStaffProblem = (error: unknown) =>
    error instanceof ApiProblem && error.type === STAFF_ACCOUNT_PROBLEM_TYPE;

  /**
   * Renueva de una en una, también entre pestañas: dos renovaciones con el mismo refresh token
   * revocan toda la sesión (API_SPEC §9.6). Dentro del candado se lee el token más reciente.
   */
  function refresh(): Promise<boolean> {
    if (inflightRefresh) return inflightRefresh;
    const { gateway, storage, runExclusive } = requireDeps();

    inflightRefresh = runExclusive(async () => {
      const refreshToken = storage.read();
      if (!refreshToken) {
        if (status.value === 'authenticated') expireFromOtherTab();
        return false;
      }
      try {
        applyAuthResult(await gateway.refresh(refreshToken));
        return true;
      } catch (error) {
        if (
          error instanceof ApiProblem &&
          error.type === 'invalid-refresh-token'
        ) {
          clearLocal();
          return false;
        }
        throw error;
      }
    }).finally(() => {
      inflightRefresh = null;
    });
    return inflightRefresh;
  }

  /** Recupera la sesión al abrir la tienda, si hay refresh token. Se ejecuta una sola vez. */
  function restore(): Promise<void> {
    if (restoring) return restoring;
    const { storage } = requireDeps();
    if (!storage.read()) {
      status.value = 'anonymous';
      restoring = Promise.resolve();
      return restoring;
    }
    status.value = 'restoring';
    restoring = (async () => {
      try {
        if (await refresh()) await loadAccount();
        else status.value = 'anonymous';
      } catch (error) {
        if (isStaffProblem(error)) return logout();
        // Error de red o de la API: se sigue sin sesión y sin borrar el refresh token, que puede
        // seguir vigente.
        accessToken.value = null;
        account.value = null;
        clearTimer();
        status.value = 'anonymous';
      }
    })();
    return restoring;
  }

  /** Inicia sesión; una cuenta de staff recibe el aviso de REQUIREMENTS §1 y se le cierra la sesión. */
  async function login(credentials: { email: string; password: string }) {
    const { gateway } = requireDeps();
    applyAuthResult(await gateway.login(credentials));
    try {
      await loadAccount();
    } catch (error) {
      // Sin cuenta no hay sesión: se cierra la que la API acaba de abrir.
      await logout();
      throw error;
    }
  }

  async function logout() {
    const { gateway, storage } = requireDeps();
    const token = accessToken.value;
    const refreshToken = storage.read();
    clearLocal();
    if (token && refreshToken) {
      // Idempotente en la API; si falla, la sesión local ya quedó cerrada.
      await gateway.logout(token, refreshToken).catch(() => undefined);
    }
  }

  return {
    accessToken,
    account,
    status,
    isAuthenticated,
    isSettled,
    init,
    restore,
    refresh,
    login,
    logout,
    loadAccount,
    clearLocal,
    expireFromOtherTab,
  };
});
