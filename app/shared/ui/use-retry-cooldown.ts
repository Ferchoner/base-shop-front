import { computed, onScopeDispose, ref } from 'vue';
import { ApiProblem } from '~/shared/api/problem';

/**
 * Bloquea un botón mientras corre el `Retry-After` de un 429 (REQUIREMENTS §4.1): sin reintentos
 * automáticos, el usuario vuelve a intentar cuando termina la espera.
 */
export function useRetryCooldown() {
  const remaining = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  /** Revisa un error; si es un 429 con `Retry-After`, empieza la espera. */
  function track(error: unknown) {
    if (!(error instanceof ApiProblem) || error.type !== 'rate-limit-exceeded')
      return;
    stop();
    remaining.value = Math.max(1, Math.ceil(error.retryAfter ?? 60));
    timer = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) {
        remaining.value = 0;
        stop();
      }
    }, 1000);
  }

  onScopeDispose(stop);

  return { remaining, waiting: computed(() => remaining.value > 0), track };
}
