import type { ApiProblem } from './problem';

export interface ProblemMessage {
  title: string;
  description: string | null;
  /** `correlationId` para soporte; solo en errores inesperados (REQUIREMENTS §4.1). */
  reference: string | null;
}

/**
 * Mensaje propio en español para un error de la API, decidido por `type` y nunca por el texto que
 * manda la API (REQUIREMENTS §4.1). Los tipos que solo trata una pantalla llegan aquí como
 * respaldo y reciben el mensaje genérico de su familia.
 */
export function problemMessage(problem: ApiProblem): ProblemMessage {
  switch (problem.type) {
    case 'network-error':
    case 'timeout':
      return {
        title: 'No pudimos conectar con la tienda',
        description: 'Revisa tu conexión e inténtalo de nuevo.',
        reference: null,
      };
    case 'rate-limit-exceeded':
      return {
        title: 'Demasiados intentos',
        description: problem.retryAfter
          ? `Espera ${formatWait(problem.retryAfter)} antes de volver a intentarlo.`
          : 'Espera un momento antes de volver a intentarlo.',
        reference: null,
      };
    case 'not-found':
      return {
        title: 'No encontramos lo que buscas',
        description: null,
        reference: null,
      };
    case 'validation-error':
    case 'password-policy-violation':
      return {
        title: 'Revisa los datos',
        description: 'Algunos campos no son válidos.',
        reference: null,
      };
    case 'unauthenticated':
    case 'invalid-refresh-token':
      return {
        title: 'Tu sesión terminó',
        description: 'Inicia sesión de nuevo para continuar.',
        reference: null,
      };
    case 'staff-cannot-purchase':
      return {
        title: 'Las cuentas de personal no compran en la tienda en línea',
        description: 'Usa una cuenta de cliente o compra como invitado.',
        reference: null,
      };
    default:
      return {
        title: 'Algo salió mal',
        description:
          'Ocurrió un error inesperado. Inténtalo de nuevo en unos momentos.',
        reference: problem.correlationId,
      };
  }
}

/** Segundos de `Retry-After` en palabras: "30 segundos", "2 minutos". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}
