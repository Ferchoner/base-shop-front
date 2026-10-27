// Adaptado de base-ecomm-admin app/shared/auth/redirect.ts (commit bbcd5af, ADR-F009): sin la ruta de
// cambio de contraseña obligatorio, que es solo del staff.
import type { RouteLocationRaw } from 'vue-router';

/** Solo rutas internas: evita redirecciones abiertas con `?redirect=//otro-sitio` (REQUIREMENTS §5.8). */
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  )
    return fallback;
  return value;
}

export function loginRedirect(fullPath: string): RouteLocationRaw {
  return fullPath && fullPath !== '/'
    ? { path: '/login', query: { redirect: fullPath } }
    : { path: '/login' };
}
