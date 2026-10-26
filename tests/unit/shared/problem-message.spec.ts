import { describe, expect, it } from 'vitest';
import { ApiProblem } from '~/shared/api/problem';
import { formatWait, problemMessage } from '~/shared/api/problem-message';

const problem = (
  type: string,
  extra: Partial<ConstructorParameters<typeof ApiProblem>[0]> = {},
) => new ApiProblem({ type, status: 400, title: 'Texto de la API', ...extra });

describe('problemMessage (REQUIREMENTS §4.1)', () => {
  it('no usa el texto de la API', () => {
    const message = problemMessage(
      problem('validation-error', { detail: 'Detalle interno' }),
    );
    expect(message.title).toBe('Revisa los datos');
    expect(JSON.stringify(message)).not.toContain('Texto de la API');
    expect(JSON.stringify(message)).not.toContain('Detalle interno');
  });

  it('muestra la referencia solo en errores inesperados', () => {
    expect(
      problemMessage(problem('internal-error', { correlationId: 'c-1' }))
        .reference,
    ).toBe('c-1');
    expect(
      problemMessage(problem('unknown', { correlationId: 'c-2' })).reference,
    ).toBe('c-2');
    expect(
      problemMessage(problem('not-found', { correlationId: 'c-3' })).reference,
    ).toBeNull();
  });

  it('dice cuánto esperar en un 429', () => {
    expect(
      problemMessage(
        problem('rate-limit-exceeded', { status: 429, retryAfter: 90 }),
      ).description,
    ).toBe('Espera 2 minutos antes de volver a intentarlo.');
    expect(
      problemMessage(problem('rate-limit-exceeded', { status: 429 }))
        .description,
    ).toBe('Espera un momento antes de volver a intentarlo.');
  });

  it('distingue la falta de conexión', () => {
    expect(problemMessage(problem('network-error', { status: 0 })).title).toBe(
      'No pudimos conectar con la tienda',
    );
  });
});

describe('formatWait', () => {
  it('usa segundos o minutos redondeados hacia arriba', () => {
    expect(formatWait(1)).toBe('1 segundo');
    expect(formatWait(45)).toBe('45 segundos');
    expect(formatWait(60)).toBe('1 minuto');
    expect(formatWait(61)).toBe('2 minutos');
  });
});
