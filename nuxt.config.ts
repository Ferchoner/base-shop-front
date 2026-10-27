// Adaptado de base-ecomm-admin nuxt.config.ts (commit bbcd5af, ADR-F009): sin PWA (ADR-F007) y con
// los datos de la tienda.
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // SPA estática (ADR-F005): `nuxt generate` y fallback a index.html.
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
  ],
  css: ['~/assets/css/main.css'],
  devServer: { port: 3002 },
  // Los enlaces descargan su página al pasar el cursor, enfocarlos o tocarlos, no al aparecer en
  // pantalla: con la descarga y la evaluación al aparecer, el catálogo competía con su propia
  // primera pintura (cierre del sprint 2, REQUIREMENTS §6.2).
  experimental: {
    defaults: {
      nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es-MX' },
      title: 'Tienda',
      meta: [{ name: 'theme-color', content: '#047857' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
    },
  },
  runtimeConfig: {
    public: {
      // Base de la API sin el prefijo /v1. Se sobrescribe con NUXT_PUBLIC_API_BASE_URL (ADR-F010).
      apiBaseUrl: 'http://localhost:3000',
      // Versión vigente del aviso de privacidad, la misma que usa el backoffice (API_GAPS G-01).
      // Se sobrescribe con NUXT_PUBLIC_PRIVACY_NOTICE_VERSION; vacía, no hay registro ni compra
      // como invitado.
      privacyNoticeVersion: '',
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
      },
    },
  },
  eslint: {
    config: { stylistic: false },
  },
  // Fuentes locales: sin cargas de terceros (SECURITY.md).
  ui: {
    fonts: false,
  },
  // SPA estática sin servidor: los iconos van en el bundle, sin pedirlos a la API de Iconify.
  icon: {
    provider: 'none',
    clientBundle: {
      scan: { globInclude: ['app/**/*.{vue,ts}'] },
    },
  },
});
