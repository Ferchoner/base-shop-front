import { ORDER_STATUSES, orderStatusLabel } from '~/shared/orders/status';

/** Valor del filtro sin estado: `USelect` no admite un valor vacío. */
export const ALL_STATUSES = 'all';

/** Opciones del filtro de Mis pedidos: todos, o un estado con su nombre en español. */
export function statusFilterOptions() {
  return [
    { value: ALL_STATUSES, label: 'Todos' },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel(s) })),
  ];
}

/**
 * Estado del filtro a partir de la URL. Uno que la API no conoce se ignora, porque la API respondería
 * 400 a un enlace viejo o editado a mano.
 */
export function statusFromQuery(value: string | undefined): string | undefined {
  return value && (ORDER_STATUSES as string[]).includes(value)
    ? value
    : undefined;
}

/** "1 artículo" o "N artículos" (`itemCount` cuenta unidades). */
export function itemCountLabel(count: number): string {
  return count === 1 ? '1 artículo' : `${count} artículos`;
}
