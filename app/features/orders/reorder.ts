import type { Reorder } from './types';

/**
 * Aviso del carrito tras volver a comprar (REQUIREMENTS §5.13). La orden no dice qué variante es cada
 * línea, así que solo se cuentan las que ya no se venden (G-13).
 */
export function reorderNotice(result: Reorder): string {
  const skipped = result.skippedVariantIds.length;
  if (skipped === 0) return 'Agregamos los productos de tu orden al carrito.';
  return skipped === 1
    ? 'Agregamos los productos de tu orden al carrito. Uno ya no está a la venta y no se agregó.'
    : `Agregamos los productos de tu orden al carrito. ${skipped} ya no están a la venta y no se agregaron.`;
}
