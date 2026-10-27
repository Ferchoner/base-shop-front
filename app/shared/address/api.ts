import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import type { ApiProblem } from '~/shared/api/problem';
import type { Schemas } from '~/shared/api/types';
import { useApi } from '~/shared/api/use-api';

export type SavedAddress = Schemas['AddressDto'];
export type CreateAddressInput = Schemas['CreateAddressDto'];

const BASE = '/v1/me/addresses';

/**
 * Libreta del cliente (API_SPEC §9.14): la usan el checkout y Mi cuenta, por eso vive en la capa
 * compartida. Sin paginación: son 10 como máximo, la predeterminada primero.
 */
export const addressKeys = {
  all: ['addresses'] as const,
};

export function useMyAddresses(enabled: MaybeRefOrGetter<boolean>) {
  const api = useApi();
  return useQuery<SavedAddress[], ApiProblem>({
    queryKey: addressKeys.all,
    queryFn: async ({ signal }) =>
      (await api<{ data: SavedAddress[] }>(BASE, { signal })).data,
    enabled: computed(() => toValue(enabled)),
  });
}

/** Guarda una dirección; con la libreta llena responde 409 `address-limit-reached`. */
export function useCreateAddress() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<SavedAddress, ApiProblem, CreateAddressInput>({
    mutationFn: (input) =>
      api<SavedAddress>(BASE, { method: 'POST', body: { ...input } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export type UpdateAddressInput = Schemas['UpdateAddressDto'];

/** Cambia una dirección; marcar `isDefault` desmarca la anterior (§9.14). */
export function useUpdateAddress() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<
    SavedAddress,
    ApiProblem,
    { id: string; input: UpdateAddressInput }
  >({
    mutationFn: ({ id, input }) =>
      api<SavedAddress>(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { ...input },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

/** 204; si era la predeterminada, ninguna queda como predeterminada (§9.14). */
export function useDeleteAddress() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<undefined, ApiProblem, string>({
    mutationFn: (id) =>
      api<undefined>(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
