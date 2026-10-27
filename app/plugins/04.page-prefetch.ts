import type { ComponentOptions } from 'vue';

/**
 * Cuando el router resuelve una ruta, su página ya está descargada: si declara `prefetch`, sus
 * lecturas salen en ese momento y no después de montar el layout y el encabezado. En la primera carga
 * eso adelanta la petición que decide el LCP (REQUIREMENTS §6.2, TF-017). La página las vuelve a pedir
 * con las mismas claves, así que TanStack Query no repite la petición.
 */
export default defineNuxtPlugin({
  name: 'page-prefetch',
  dependsOn: ['vue-query'],
  setup(nuxtApp) {
    useRouter().beforeResolve((to) => {
      for (const record of to.matched) {
        const page = record.components?.default as ComponentOptions | undefined;
        const prefetch = typeof page === 'object' ? page.prefetch : undefined;
        if (prefetch) nuxtApp.runWithContext(() => prefetch(to));
      }
    });
  },
});
