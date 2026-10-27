// Adaptado de base-ecomm-admin app/plugins/01.api.ts (commit bbcd5af, ADR-F009): solo las rutas con
// `meta.auth` llevan al login al perder la sesión, y la sesión se recupera sin bloquear la primera
// pantalla.
import { createApiClient } from '~/shared/api/client';
import { createHttpAuthGateway } from '~/shared/auth/auth-gateway';
import { createRunExclusive } from '~/shared/auth/exclusive';
import { loginRedirect } from '~/shared/auth/redirect';
import { useSessionStore } from '~/shared/auth/session.store';
import {
  createLocalTokenStorage,
  REFRESH_TOKEN_KEY,
} from '~/shared/auth/token-storage';

export default defineNuxtPlugin({
  name: 'api',
  setup() {
    const config = useRuntimeConfig();
    const session = useSessionStore();
    const router = useRouter();

    const goToLogin = () => {
      const current = router.currentRoute.value;
      if (!current.meta.auth) return;
      navigateTo(loginRedirect(current.fullPath));
    };

    const api = createApiClient({
      baseURL: config.public.apiBaseUrl,
      getAccessToken: () => session.accessToken,
      refreshSession: () => session.refresh(),
      onSessionExpired: () => {
        session.clearLocal();
        goToLogin();
      },
    });

    session.init({
      gateway: createHttpAuthGateway(api),
      storage: createLocalTokenStorage(),
      runExclusive: createRunExclusive(),
    });

    // Cierre de sesión en otra pestaña: el refresh token compartido desaparece.
    window.addEventListener('storage', (event) => {
      if (event.key !== REFRESH_TOKEN_KEY || event.newValue !== null) return;
      if (!session.isAuthenticated) return;
      session.expireFromOtherTab();
      goToLogin();
    });

    // Las páginas públicas no esperan: el encabezado y el carrito reaccionan cuando termina.
    session.restore();

    return { provide: { api } };
  },
});
