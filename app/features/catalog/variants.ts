import type { ProductDetail, ProductImage, ProductVariant } from './types';

/** Opción elegida por nombre (`{ color: 'Azul' }`); las que faltan aún no se eligen. */
export type OptionSelection = Record<string, string | undefined>;

export interface OptionValue {
  value: string;
  /** Existe una variante con este valor y las opciones anteriores elegidas. */
  selectable: boolean;
  /** Alguna de esas variantes se puede comprar ahora (ADR-0061, sin cantidades). */
  available: boolean;
}

function matches(
  variant: ProductVariant,
  selection: OptionSelection,
  names: readonly string[],
): boolean {
  return names.every(
    (name) =>
      selection[name] === undefined ||
      variant.options[name] === selection[name],
  );
}

/**
 * Valores de cada opción en el orden en que aparecen en las variantes. Las opciones se eligen en
 * cascada: un valor se puede elegir si existe con las opciones anteriores ya elegidas, así que la
 * primera opción siempre ofrece todos sus valores y nunca hay que deshacer para llegar a otra
 * combinación (REQUIREMENTS §5.3).
 */
export function optionValues(
  product: Pick<ProductDetail, 'optionNames' | 'variants'>,
  selection: OptionSelection,
): Record<string, OptionValue[]> {
  const out: Record<string, OptionValue[]> = {};
  product.optionNames.forEach((name, index) => {
    const previous = product.optionNames.slice(0, index);
    const values: string[] = [];
    for (const v of product.variants) {
      const value = v.options[name];
      if (value !== undefined && !values.includes(value)) values.push(value);
    }
    out[name] = values.map((value) => {
      const candidates = product.variants.filter(
        (v) => v.options[name] === value && matches(v, selection, previous),
      );
      return {
        value,
        selectable: candidates.length > 0,
        available: candidates.some((v) => v.available),
      };
    });
  });
  return out;
}

/**
 * Elegir un valor borra las opciones siguientes que ya no forman una combinación existente.
 */
export function selectOption(
  product: Pick<ProductDetail, 'optionNames' | 'variants'>,
  selection: OptionSelection,
  name: string,
  value: string,
): OptionSelection {
  const next: OptionSelection = { ...selection, [name]: value };
  const names = product.optionNames;
  for (let i = names.indexOf(name) + 1; i < names.length; i++) {
    const later = names[i]!;
    if (next[later] === undefined) continue;
    const upTo = names.slice(0, i + 1);
    if (!product.variants.some((v) => matches(v, next, upTo)))
      next[later] = undefined;
  }
  return next;
}

/** La variante de la combinación completa; con una sola variante, siempre esa. */
export function findVariant(
  product: Pick<ProductDetail, 'optionNames' | 'variants'>,
  selection: OptionSelection,
): ProductVariant | null {
  if (product.variants.length === 1) return product.variants[0] ?? null;
  if (product.optionNames.some((name) => selection[name] === undefined))
    return null;
  return (
    product.variants.find((v) =>
      product.optionNames.every((name) => v.options[name] === selection[name]),
    ) ?? null
  );
}

/** Las imágenes propias de la variante elegida van primero (REQUIREMENTS §5.3). */
export function galleryImages(
  images: readonly ProductImage[],
  variantId: string | null | undefined,
): ProductImage[] {
  if (!variantId) return [...images];
  const own = images.filter((i) => i.variantId === variantId);
  return [...own, ...images.filter((i) => i.variantId !== variantId)];
}

/** `talla` → `Talla`: los nombres de opción llegan en minúsculas (API_SPEC §11.7). */
export function optionLabel(name: string): string {
  return name.charAt(0).toLocaleUpperCase('es-MX') + name.slice(1);
}
