import { describe, expect, it } from 'vitest';
import {
  createLocalTokenStorage,
  REFRESH_TOKEN_KEY,
} from '~/shared/auth/token-storage';

describe('refresh token en localStorage (ADR-F006)', () => {
  it('usa la llave propia de la tienda', () => {
    const storage = createLocalTokenStorage(localStorage);
    storage.write('rt-1');
    expect(localStorage.getItem('base-shop-front.refreshToken')).toBe('rt-1');
    expect(REFRESH_TOKEN_KEY).toBe('base-shop-front.refreshToken');
    storage.clear();
    expect(storage.read()).toBeNull();
  });

  it('sin almacenamiento disponible no falla', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    } as unknown as Storage;
    const storage = createLocalTokenStorage(broken);
    expect(() => storage.write('rt')).not.toThrow();
    expect(storage.read()).toBeNull();
    expect(() => storage.clear()).not.toThrow();
  });
});
