// Adaptado de base-ecomm-admin app/middleware/auth.global.ts (commit bbcd5af, ADR-F009): en la tienda
// solo esperan la sesión las rutas que la piden (`meta.auth`) o que son solo sin ella (`meta.guestOnly`).
import { loginRedirect, safeRedirect } from '~/shared/auth/redirect';
import { useSessionStore } from '~/shared/auth/session.store';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth && !to.meta.guestOnly) return;
  const session = useSessionStore();
  await session.restore();

  if (to.meta.auth && !session.isAuthenticated)
    return navigateTo(loginRedirect(to.fullPath));
  if (to.meta.guestOnly && session.isAuthenticated)
    return navigateTo(safeRedirect(to.query.redirect));
});
