import type { Schemas } from '~/shared/api/types';

export type Cart = Schemas['CartDto'];
export type CartLine = Schemas['CartLineDto'];

/** Cantidades de una línea (BR-CRT-02, API_SPEC §14.2). */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 30;
