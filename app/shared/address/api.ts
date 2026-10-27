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
