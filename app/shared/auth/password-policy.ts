// Adaptado de base-ecomm-admin app/shared/auth/password-policy.ts (commit bbcd5af, ADR-F009): suma los
// mensajes propios de cada regla que la API indica en `errors[].code` (REQUIREMENTS §5.7).
import { z } from 'zod';
import type { ApiProblem } from '~/shared/api/problem';
import type { FormFieldError } from '~/shared/utils/form-errors';

/**
 * Lo que el navegador puede validar de base-shop ADR-0047: de 15 a 64 caracteres. Que no sea común,
 * que solo lleve caracteres imprimibles y la cuenta tras normalizar a NFKC lo decide la API con
 * `password-policy-violation`.
 */
export const newPasswordField = z
  .string()
  .min(15, 'Mínimo 15 caracteres.')
  .max(64, 'Máximo 64 caracteres.');

export const NEW_PASSWORD_HELP =
  'De 15 a 64 caracteres, sin otras reglas. Una frase larga es buena opción.';

/** Para `.refine(passwordsMatch, PASSWORDS_MISMATCH)` en formularios con confirmación. */
export const passwordsMatch = (v: {
  newPassword: string;
  confirmPassword: string;
}) => v.newPassword === v.confirmPassword;

export const PASSWORDS_MISMATCH = {
  path: ['confirmPassword'],
  message: 'Las contraseñas no coinciden.',
};

/** Mensaje propio por regla de la política (API_SPEC §9.12, base-shop ADR-0115). */
const POLICY_MESSAGES: Record<string, string> = {
  passwordLength: 'Debe tener de 15 a 64 caracteres.',
  passwordCharacters:
    'Usa solo letras, números, espacios y signos; sin saltos de línea ni caracteres de control.',
  commonPassword: 'Es una contraseña muy común. Elige otra.',
  samePassword: 'Debe ser distinta de la actual.',
};

/**
 * Errores de `password-policy-violation` en el campo de la contraseña del formulario, con el mensaje
 * de la tienda según `code` y nunca el texto de la API (REQUIREMENTS §4.1).
 */
export function passwordPolicyErrors(
  problem: ApiProblem,
  formField: string,
): FormFieldError[] {
  if (problem.type !== 'password-policy-violation') return [];
  const messages = problem.errors.map(
    (e) => POLICY_MESSAGES[e.code] ?? 'Elige otra contraseña.',
  );
  return [
    {
      name: formField,
      message:
        messages.length > 0 ? messages.join(' ') : 'Elige otra contraseña.',
    },
  ];
}
