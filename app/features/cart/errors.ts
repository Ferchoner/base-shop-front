import type { ApiProblem } from '~/shared/api/problem';

/**
 * Mensajes propios de los errores del carrito (REQUIREMENTS §5.3 y §5.4). Lo demás lo explica
 * `ProblemAlert`.
 */
export function cartErrorMessage(problem: ApiProblem): string | null {
  switch (problem.type) {
    case 'variant-not-sellable':
      return 'Esta opción ya no está a la venta. Actualizamos la información.';
    case 'cart-line-limit-reached':
      return 'Tu carrito llegó al límite de 100 productos distintos. Quita alguno para agregar otro.';
    case 'not-found':
      return 'Ese producto ya no estaba en tu carrito. Lo actualizamos.';
    case 'validation-error':
      return problem.errors.some((e) => e.code === 'lineQuantity')
        ? 'Puedes tener hasta 30 unidades de cada producto en el carrito.'
        : null;
    default:
      return null;
  }
}
