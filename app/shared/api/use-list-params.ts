// Copiado de base-ecomm-admin app/shared/api/use-list-params.ts (commit bbcd5af, ADR-F009). Cambia
// `router.replace` por `router.push`, para que "atrás" regrese al estado anterior (REQUIREMENTS §5.2),
// y separa la lectura de la URL para que la página pida sus datos antes de pintarse (TF-017).
import type { LocationQuery } from 'vue-router';

export interface ListParamsOptions<K extends string> {
  /** Nombres de los filtros que se guardan en la URL. */
  filters: readonly K[];
}

function firstString(
  value: LocationQuery[string] | undefined,
): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** Página de la URL; una que no es un entero positivo es la primera. */
export function readPage(query: LocationQuery): number {
  const n = Number(firstString(query.page));
  return Number.isInteger(n) && n >= 1 && n <= 1_000_000 ? n : 1;
}

/** Filtros de la URL; los vacíos quedan sin valor. */
export function readFilters<K extends string>(
  query: LocationQuery,
  keys: readonly K[],
): Record<K, string | undefined> {
  const out = {} as Record<K, string | undefined>;
  for (const key of keys) out[key] = firstString(query[key]);
  return out;
}

/**
 * Página y filtros de un listado guardados en la URL (`?page=2&category=camisas`), para que recargar o
 * compartir el enlace conserve la vista. El tamaño de página lo fija cada pantalla.
 */
export function useListParams<K extends string>(options: ListParamsOptions<K>) {
  const route = useRoute();
  const router = useRouter();

  const page = computed(() => readPage(route.query));
  const filters = computed(() => readFilters(route.query, options.filters));

  function pushQuery(
    next: Record<string, string | number | undefined>,
    replace = false,
  ) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...route.query, ...next })) {
      if (value === undefined || value === null || value === '') continue;
      query[key] = String(Array.isArray(value) ? value[0] : value);
    }
    if (query.page === '1') delete query.page;
    return replace ? router.replace({ query }) : router.push({ query });
  }

  /** Cambiar un filtro vuelve a la primera página. */
  function setFilter(key: K, value: string | null | undefined) {
    return pushQuery({ [key]: value ?? undefined, page: undefined });
  }

  /** Varios filtros a la vez; los que no se nombran se conservan. */
  function setFilters(
    values: Partial<Record<K, string | null | undefined>>,
    { replace = false } = {},
  ) {
    const next: Record<string, string | undefined> = { page: undefined };
    for (const [key, value] of Object.entries(values))
      next[key] = (value as string) ?? undefined;
    return pushQuery(next, replace);
  }

  function setPage(value: number) {
    return pushQuery({ page: value });
  }

  function resetFilters() {
    const cleared = Object.fromEntries(
      options.filters.map((k) => [k, undefined]),
    );
    return pushQuery({ ...cleared, page: undefined });
  }

  return { page, filters, setFilter, setFilters, setPage, resetFilters };
}
