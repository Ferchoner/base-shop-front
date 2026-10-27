import { describe, expect, it } from 'vitest';
import type { ProductVariant } from '~/features/catalog/types';
import {
  findVariant,
  galleryImages,
  optionLabel,
  optionValues,
  selectOption,
} from '~/features/catalog/variants';

const variant = (
  id: string,
  options: Record<string, string>,
  available = true,
): ProductVariant => ({
  id,
  sku: id.toUpperCase(),
  options,
  price: { amount: 10000, currency: 'MXN' },
  compareAtPrice: null,
  available,
});

// Azul en S y M; Rojo solo en M y agotado.
const product = {
  optionNames: ['color', 'talla'],
  variants: [
    variant('az-s', { color: 'Azul', talla: 'S' }),
    variant('az-m', { color: 'Azul', talla: 'M' }),
    variant('ro-m', { color: 'Rojo', talla: 'M' }, false),
  ],
};

describe('optionValues (REQUIREMENTS §5.3)', () => {
  it('la primera opción ofrece todos sus valores', () => {
    const values = optionValues(product, { talla: 'S' });
    expect(values.color!.map((v) => v.selectable)).toEqual([true, true]);
  });

  it('no deja elegir una combinación que no existe', () => {
    const values = optionValues(product, { color: 'Rojo' });
    expect(values.talla).toEqual([
      { value: 'S', selectable: false, available: false },
      { value: 'M', selectable: true, available: false },
    ]);
  });

  it('marca lo agotado sin ocultarlo', () => {
    const values = optionValues(product, {});
    expect(values.color!.find((v) => v.value === 'Rojo')).toEqual({
      value: 'Rojo',
      selectable: true,
      available: false,
    });
  });
});

describe('selectOption', () => {
  it('borra las opciones siguientes que ya no existen', () => {
    expect(
      selectOption(product, { color: 'Azul', talla: 'S' }, 'color', 'Rojo'),
    ).toEqual({ color: 'Rojo', talla: undefined });
  });

  it('conserva las que siguen existiendo', () => {
    expect(
      selectOption(product, { color: 'Azul', talla: 'M' }, 'color', 'Rojo'),
    ).toEqual({ color: 'Rojo', talla: 'M' });
  });
});

describe('findVariant', () => {
  it('requiere la combinación completa', () => {
    expect(findVariant(product, { color: 'Azul' })).toBeNull();
    expect(findVariant(product, { color: 'Azul', talla: 'M' })?.id).toBe(
      'az-m',
    );
  });

  it('con una sola variante, siempre esa', () => {
    const single = { optionNames: [], variants: [variant('u', {})] };
    expect(findVariant(single, {})?.id).toBe('u');
  });
});

describe('galleryImages', () => {
  const image = (id: string, variantId: string | null) => ({
    id,
    url: `http://img/${id}`,
    altText: null,
    variantId,
    position: 1,
  });
  const images = [image('p1', null), image('v1', 'az-m'), image('p2', null)];

  it('pone primero las imágenes de la variante elegida', () => {
    expect(galleryImages(images, 'az-m').map((i) => i.id)).toEqual([
      'v1',
      'p1',
      'p2',
    ]);
    expect(galleryImages(images, null).map((i) => i.id)).toEqual([
      'p1',
      'v1',
      'p2',
    ]);
  });
});

it('optionLabel pone mayúscula inicial', () => {
  expect(optionLabel('talla')).toBe('Talla');
});
