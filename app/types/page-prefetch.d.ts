import type { RouteLocationNormalized } from 'vue-router';

declare module 'vue' {
  interface ComponentCustomOptions {
    /**
     * Pide los datos de la página en cuanto el router la resuelve, sin esperar a que se pinten el
     * layout y el encabezado (plugins/04.page-prefetch.ts, TF-017). Se declara con `defineOptions`
     * y solo puede usar lo importado, no lo del `setup`.
     */
    prefetch?: (route: RouteLocationNormalized) => void;
  }
}

export {};
