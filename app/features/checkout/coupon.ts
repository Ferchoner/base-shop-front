// Adaptado de base-ecomm-admin app/features/orders/status.ts (commit bbcd5af, ADR-F009): los motivos
// con los textos que ve el comprador en línea.

/** Por qué no aplica un cupón: `reason` de 409 `coupon-not-applicable` (API_SPEC §26.8). */
const COUPON_REASON: Record<string, string> = {
  unavailable: 'El cupón no existe o no está vigente.',
  minimumNotMet: 'Tu compra no alcanza el mínimo del cupón.',
  noEligibleLines: 'El cupón no aplica a ninguno de estos productos.',
  exhausted: 'El cupón ya no tiene usos disponibles.',
  alreadyUsed: 'Ya usaste este cupón: es de una vez por cliente.',
};

export function couponProblemMessage(reason: unknown): string {
  return COUPON_REASON[String(reason)] ?? 'El cupón no aplica a esta compra.';
}

/** Mismo formato que la API compara (§26.8): sin espacios a los lados; se muestra en mayúsculas. */
export function normalizeCoupon(text: string): string {
  return text.trim().toUpperCase();
}
