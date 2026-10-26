/**
 * Al cambiar de ruta, el foco va al título de la página para que el lector de pantalla anuncie la
 * pantalla nueva (REQUIREMENTS §4.6). En la primera carga no se mueve.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter();
  let first = true;

  router.afterEach((to, from) => {
    if (first) {
      first = false;
      return;
    }
    // Cambiar solo la query (filtros, página) no es otra pantalla.
    if (to.path === from.path) return;
    nextTick(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      const target = heading ?? document.getElementById('main');
      if (!target) return;
      if (target === heading) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: false });
    });
  });
});
