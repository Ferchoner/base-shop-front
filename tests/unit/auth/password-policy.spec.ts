// Adaptado de base-ecomm-admin tests/unit/shared/password-policy.spec.ts (commit bbcd5af, ADR-F009):
// suma los mensajes propios de cada regla.
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiProblem } from '~/shared/api/problem';
import {
  newPasswordField,
  PASSWORDS_MISMATCH,
  passwordPolicyErrors,
  passwordsMatch,
} from '~/shared/auth/password-policy';

describe('política de contraseña (base-shop ADR-0047, parte validable en el navegador)', () => {
  it('acepta de 15 a 64 caracteres', () => {
    expect(newPasswordField.safeParse('a'.repeat(14)).success).toBe(false);
    expect(newPasswordField.safeParse('a'.repeat(15)).success).toBe(true);
    expect(newPasswordField.safeParse('a'.repeat(64)).success).toBe(true);
    expect(newPasswordField.safeParse('a'.repeat(65)).success).toBe(false);
  });

  it('marca la confirmación cuando no coincide', () => {
    const schema = z
      .object({ newPassword: newPasswordField, confirmPassword: z.string() })
      .refine(passwordsMatch, PASSWORDS_MISMATCH);
    const result = schema.safeParse({
      newPassword: 'una frase larga y segura',
      confirmPassword: 'otra',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });
});

describe('passwordPolicyErrors (REQUIREMENTS §5.7)', () => {
  const violation = (...codes: string[]) =>
    new ApiProblem({
      type: 'password-policy-violation',
      status: 400,
      title: '',
      errors: codes.map((code) => ({
        field: 'password',
        code,
        message: 'Texto de la API',
      })),
    });

  it('usa el mensaje propio de cada regla y no el de la API', () => {
    expect(
      passwordPolicyErrors(violation('commonPassword'), 'password'),
    ).toEqual([
      { name: 'password', message: 'Es una contraseña muy común. Elige otra.' },
    ]);
    expect(
      passwordPolicyErrors(violation('passwordLength'), 'newPassword')[0]
        ?.message,
    ).toBe('Debe tener de 15 a 64 caracteres.');
    expect(
      passwordPolicyErrors(violation('passwordCharacters'), 'password')[0]
        ?.message,
    ).toContain('caracteres de control');
  });

  it('un código desconocido o ningún error piden otra contraseña', () => {
    expect(
      passwordPolicyErrors(violation('nueva'), 'password')[0]?.message,
    ).toBe('Elige otra contraseña.');
    expect(passwordPolicyErrors(violation(), 'password')[0]?.message).toBe(
      'Elige otra contraseña.',
    );
  });

  it('ignora otros tipos de error', () => {
    expect(
      passwordPolicyErrors(
        new ApiProblem({ type: 'validation-error', status: 400, title: '' }),
        'password',
      ),
    ).toEqual([]);
  });
});
