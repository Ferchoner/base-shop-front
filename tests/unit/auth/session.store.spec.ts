// Adaptado de base-ecomm-admin tests/unit/shared/session.store.spec.ts (commit bbcd5af, ADR-F009): la
// tienda acepta clientes y rechaza staff, sin permisos ni contraseña temporal.
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiProblem } from '~/shared/api/problem';
import type { Account, AuthResult } from '~/shared/api/types';
import type { AuthGateway } from '~/shared/auth/auth-gateway';
import { createRunExclusive } from '~/shared/auth/exclusive';
import { useSessionStore } from '~/shared/auth/session.store';
import type { TokenStorage } from '~/shared/auth/token-storage';

const customer = {
  id: 'u1',
  type: 'CUSTOMER',
  email: 'maria@example.com',
  firstNames: 'María',
  lastNames: 'López',
  emailVerified: true,
  mustChangePassword: false,
  roles: [],
  permissions: [],
  createdAt: '2026-10-01T00:00:00.000Z',
} as unknown as Account;

let counter = 0;
function authResult(): AuthResult {
  counter += 1;
  return {
    outcome: 'AUTHENTICATED',
    accessToken: `at-${counter}`,
    accessTokenExpiresIn: 900,
    refreshToken: `rt-${counter}`,
    refreshTokenExpiresIn: 604800,
    tokenType: 'Bearer',
    mustChangePassword: false,
  };
}

function memoryStorage(
  initial: string | null = null,
): TokenStorage & { value: string | null } {
  return {
    value: initial,
    read() {
      return this.value;
    },
    write(token) {
      this.value = token;
    },
    clear() {
      this.value = null;
    },
  };
}

function fakeGateway(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    login: vi.fn(async () => authResult()),
    refresh: vi.fn(async () => authResult()),
    logout: vi.fn(async () => undefined),
    me: vi.fn(async () => customer),
    changePassword: vi.fn(async () => undefined),
    ...overrides,
  };
}

function setup(gateway: AuthGateway, storage = memoryStorage()) {
  const session = useSessionStore();
  // Sin Web Locks: se usa el respaldo que serializa dentro de la pestaña.
  session.init({
    gateway,
    storage,
    runExclusive: createRunExclusive(undefined),
  });
  return { session, storage };
}

const staffGateway = () =>
  fakeGateway({
    me: vi.fn(
      async () =>
        ({
          ...customer,
          type: 'STAFF',
          permissions: ['orders.read'],
        }) as Account,
    ),
  });

beforeEach(() => {
  setActivePinia(createPinia());
  counter = 0;
  vi.useFakeTimers();
});

describe('sesión (ADR-F006, REQUIREMENTS §5.8)', () => {
  it('inicia sesión: token en memoria, refresh token guardado y cuenta cargada', async () => {
    const { session, storage } = setup(fakeGateway());
    await session.login({ email: 'maria@example.com', password: 'x' });
    expect(session.isAuthenticated).toBe(true);
    expect(session.accessToken).toBe('at-1');
    expect(storage.value).toBe('rt-1');
    expect(session.account?.firstNames).toBe('María');
  });

  it('una cuenta de staff recibe el aviso y se le cierra la sesión (§1)', async () => {
    const gateway = staffGateway();
    const { session, storage } = setup(gateway);
    const states: boolean[] = [];
    session.$subscribe(() => states.push(session.isAuthenticated));
    await expect(
      session.login({ email: 'staff@example.com', password: 'x' }),
    ).rejects.toMatchObject({ type: 'staff-cannot-purchase' });
    expect(session.isAuthenticated).toBe(false);
    // Nunca cuenta como sesión, para que el carrito no la use.
    expect(states).not.toContain(true);
    expect(storage.value).toBeNull();
    expect(gateway.logout).toHaveBeenCalledWith('at-1', 'rt-1');
  });

  it('credenciales inválidas no dejan nada guardado', async () => {
    const gateway = fakeGateway({
      login: vi.fn(async () => {
        throw new ApiProblem({
          type: 'invalid-credentials',
          status: 401,
          title: '',
        });
      }),
    });
    const { session, storage } = setup(gateway);
    await expect(
      session.login({ email: 'x@example.com', password: 'x' }),
    ).rejects.toMatchObject({ type: 'invalid-credentials' });
    expect(storage.value).toBeNull();
    expect(session.isAuthenticated).toBe(false);
  });

  it('renueva una sola vez aunque lo pidan varias llamadas a la vez (API_SPEC §9.6)', async () => {
    const gateway = fakeGateway();
    const { session, storage } = setup(gateway, memoryStorage('rt-0'));
    const results = await Promise.all([
      session.refresh(),
      session.refresh(),
      session.refresh(),
    ]);
    expect(results).toEqual([true, true, true]);
    expect(gateway.refresh).toHaveBeenCalledTimes(1);
    expect(gateway.refresh).toHaveBeenCalledWith('rt-0');
    expect(storage.value).toBe('rt-1');
  });

  it('renovaciones seguidas usan siempre el refresh token más reciente', async () => {
    const gateway = fakeGateway();
    const { session } = setup(gateway, memoryStorage('rt-0'));
    await session.refresh();
    await session.refresh();
    expect(gateway.refresh).toHaveBeenNthCalledWith(2, 'rt-1');
  });

  it('dos pestañas con el mismo candado renuevan de una en una con el token más reciente', async () => {
    // Dos stores con el mismo almacenamiento y el mismo candado simulan dos pestañas.
    const storage = memoryStorage('rt-0');
    const runExclusive = createRunExclusive(undefined);
    const gateway = fakeGateway();
    const tabA = useSessionStore();
    tabA.init({ gateway, storage, runExclusive });
    setActivePinia(createPinia());
    const tabB = useSessionStore();
    tabB.init({ gateway, storage, runExclusive });
    await Promise.all([tabA.refresh(), tabB.refresh()]);
    expect(gateway.refresh).toHaveBeenNthCalledWith(1, 'rt-0');
    expect(gateway.refresh).toHaveBeenNthCalledWith(2, 'rt-1');
    expect(storage.value).toBe('rt-2');
  });

  it('un refresh token inválido cierra la sesión local', async () => {
    const gateway = fakeGateway({
      refresh: vi.fn(async () => {
        throw new ApiProblem({
          type: 'invalid-refresh-token',
          status: 401,
          title: 'Sesión vencida',
        });
      }),
    });
    const { session, storage } = setup(gateway, memoryStorage('rt-0'));
    expect(await session.refresh()).toBe(false);
    expect(storage.value).toBeNull();
    expect(session.status).toBe('anonymous');
  });

  it('restaura la sesión al abrir la tienda si hay refresh token', async () => {
    const { session } = setup(fakeGateway(), memoryStorage('rt-0'));
    await session.restore();
    expect(session.isAuthenticated).toBe(true);
    expect(session.account?.email).toBe('maria@example.com');
  });

  it('una sesión de staff recuperada se cierra', async () => {
    const gateway = staffGateway();
    const { session, storage } = setup(gateway, memoryStorage('rt-0'));
    await session.restore();
    expect(session.isAuthenticated).toBe(false);
    expect(storage.value).toBeNull();
    expect(gateway.logout).toHaveBeenCalledWith('at-1', 'rt-1');
  });

  it('sin refresh token queda anónima sin llamar a la API', async () => {
    const gateway = fakeGateway();
    const { session } = setup(gateway);
    await session.restore();
    expect(session.status).toBe('anonymous');
    expect(session.isSettled).toBe(true);
    expect(gateway.refresh).not.toHaveBeenCalled();
  });

  it('un error de red al restaurar no borra el refresh token', async () => {
    const gateway = fakeGateway({
      refresh: vi.fn(async () => {
        throw new ApiProblem({
          type: 'network-error',
          status: 0,
          title: 'Sin conexión',
        });
      }),
    });
    const { session, storage } = setup(gateway, memoryStorage('rt-0'));
    await session.restore();
    expect(session.status).toBe('anonymous');
    expect(storage.value).toBe('rt-0');
  });

  it('renueva antes del vencimiento del token de acceso', async () => {
    const gateway = fakeGateway();
    const { session } = setup(gateway);
    await session.login({ email: 'maria@example.com', password: 'x' });
    await vi.advanceTimersByTimeAsync((900 - 60) * 1000);
    expect(gateway.refresh).toHaveBeenCalledWith('rt-1');
    expect(session.accessToken).toBe('at-2');
  });

  it('con un TTL corto renueva a la mitad del TTL, no cada 5 segundos', async () => {
    const gateway = fakeGateway({
      login: vi.fn(async () => ({ ...authResult(), accessTokenExpiresIn: 60 })),
    });
    const { session } = setup(gateway);
    await session.login({ email: 'maria@example.com', password: 'x' });
    await vi.advanceTimersByTimeAsync(29_000);
    expect(gateway.refresh).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(gateway.refresh).toHaveBeenCalledTimes(1);
  });

  it('otra pestaña cerró la sesión: la renovación no llama a la API', async () => {
    const gateway = fakeGateway();
    const { session, storage } = setup(gateway);
    await session.login({ email: 'maria@example.com', password: 'x' });
    storage.value = null;
    expect(await session.refresh()).toBe(false);
    expect(session.isAuthenticated).toBe(false);
    expect(gateway.refresh).not.toHaveBeenCalled();
  });

  it('cierra sesión aunque la API falle', async () => {
    const gateway = fakeGateway({
      logout: vi.fn(async () => {
        throw new ApiProblem({ type: 'network-error', status: 0, title: '' });
      }),
    });
    const { session, storage } = setup(gateway);
    await session.login({ email: 'maria@example.com', password: 'x' });
    await session.logout();
    expect(session.isAuthenticated).toBe(false);
    expect(storage.value).toBeNull();
  });

  it('cambia la contraseña con el token actual y conserva la sesión (§5.10)', async () => {
    const gateway = fakeGateway();
    const { session, storage } = setup(gateway);
    await session.login({ email: 'maria@example.com', password: 'x' });
    const passwords = {
      currentPassword: 'x',
      newPassword: 'una frase larga y nueva',
    };
    await session.changePassword(passwords);
    expect(gateway.changePassword).toHaveBeenCalledWith('at-1', passwords);
    expect(session.isAuthenticated).toBe(true);
    expect(storage.value).toBe('rt-1');
  });

  it('toma la cuenta que devuelve un cambio de Mi cuenta, solo con sesión de cliente', async () => {
    const { session } = setup(fakeGateway());
    session.replaceAccount({ ...customer, firstNames: 'Otra' });
    expect(session.account).toBeNull();
    await session.login({ email: 'maria@example.com', password: 'x' });
    session.replaceAccount({ ...customer, emailVerified: false });
    expect(session.account?.emailVerified).toBe(false);
    session.replaceAccount({ ...customer, type: 'STAFF' } as Account);
    expect(session.account?.type).toBe('CUSTOMER');
  });
});
