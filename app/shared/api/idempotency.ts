import { ApiProblem } from './problem';

/**
 * Llaves de `Idempotency-Key` para un formulario (REQUIREMENTS §4.4, API_SPEC §4): la misma mientras
 * se reenvía el mismo cuerpo, por ejemplo tras un error de red, y otra en cuanto cambia un dato o el
 * total esperado. Viven en memoria, no en el navegador.
 */
export function createIdempotencyKeys() {
  let fingerprint: string | null = null;
  let key = '';
  return (body: unknown): string => {
    const next = JSON.stringify(body);
    if (next !== fingerprint) {
      fingerprint = next;
      key = crypto.randomUUID();
    }
    return key;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Repite la llamada con la misma llave mientras la API responde 409 `idempotency-request-in-progress`,
 * esperando su `Retry-After` (2 s). Pasado el límite, el error llega a quien llama.
 */
export async function retryWhileInProgress<T>(
  call: () => Promise<T>,
  attempts = 5,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const inProgress =
        error instanceof ApiProblem &&
        error.type === 'idempotency-request-in-progress';
      if (!inProgress || attempt >= attempts) throw error;
      await sleep((error.retryAfter ?? 2) * 1000);
    }
  }
}
