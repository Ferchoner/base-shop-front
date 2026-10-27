import { describe, expect, it } from 'vitest';
import { loginRedirect, safeRedirect } from '~/shared/auth/redirect';

describe('safeRedirect (REQUIREMENTS §5.8)', () => {
  it('acepta rutas internas', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('/products?q=lino')).toBe('/products?q=lino');
  });

  it('rechaza redirecciones a otros sitios', () => {
    expect(safeRedirect('https://otro.example')).toBe('/');
    expect(safeRedirect('//otro.example')).toBe('/');
    expect(safeRedirect('/\\otro.example')).toBe('/');
    expect(safeRedirect(['/a'])).toBe('/');
    expect(safeRedirect(undefined, '/account')).toBe('/account');
  });

  it('lleva al login con la ruta de origen, salvo desde el inicio', () => {
    expect(loginRedirect('/account')).toEqual({
      path: '/login',
      query: { redirect: '/account' },
    });
    expect(loginRedirect('/')).toEqual({ path: '/login' });
  });
});
