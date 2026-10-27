import { describe, expect, it } from 'vitest';
import { isGoneCart } from '~/features/cart/api';
import { cartErrorMessage } from '~/features/cart/errors';
import { ApiProblem } from '~/shared/api/problem';

const problem = (type: string, extra = {}) =>
  new ApiProblem({ type, status: 409, title: '', ...extra });

describe('errores del carrito (REQUIREMENTS §5.3, §5.4)', () => {
  it('explica el tope de 30 por línea y de 100 líneas', () => {
    expect(
      cartErrorMessage(
        problem('validation-error', {
          status: 400,
          errors: [{ field: 'quantity', code: 'lineQuantity', message: '' }],
        }),
      ),
    ).toContain('hasta 30 unidades');
    expect(cartErrorMessage(problem('cart-line-limit-reached'))).toContain(
      '100 productos distintos',
    );
  });

  it('deja los demás a ProblemAlert', () => {
    expect(cartErrorMessage(problem('internal-error'))).toBeNull();
    expect(cartErrorMessage(problem('validation-error'))).toBeNull();
  });

  it('reconoce un carrito que ya no sirve', () => {
    expect(isGoneCart(problem('cart-not-active'))).toBe(true);
    expect(isGoneCart(problem('not-found', { status: 404 }))).toBe(true);
    expect(isGoneCart(problem('variant-not-sellable'))).toBe(false);
  });
});
