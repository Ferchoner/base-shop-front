<script setup lang="ts">
import { useMyOrders } from '~/features/orders/api';
import {
  ALL_STATUSES,
  itemCountLabel,
  statusFilterOptions,
  statusFromQuery,
} from '~/features/orders/my-orders';
import { useListParams } from '~/shared/api/use-list-params';
import { orderStatus } from '~/shared/orders/status';
import { formatDate } from '~/shared/utils/dates';
import { formatMoney } from '~/shared/utils/money';

/**
 * Mis pedidos (REQUIREMENTS §5.12): del más reciente al más antiguo, 20 por página, con filtro por
 * estado. Página y filtro van en la URL, como en el catálogo.
 */
definePageMeta({ auth: true });
useHead({ title: 'Mis pedidos' });

const { page, filters, setFilter, setPage } = useListParams({
  filters: ['status'] as const,
});
const status = computed(() => statusFromQuery(filters.value.status));
const orders = useMyOrders(() => ({
  page: page.value,
  ...(status.value && { status: status.value }),
}));

const statusModel = computed({
  get: () => status.value ?? ALL_STATUSES,
  set: (v: string) => setFilter('status', v === ALL_STATUSES ? undefined : v),
});
const list = computed(() => orders.data.value?.data ?? []);
</script>

<template>
  <div class="space-y-6">
    <AccountNav />
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h1 class="text-2xl font-semibold">Mis pedidos</h1>
        <UFormField label="Estado" name="status" class="w-64">
          <USelect
            v-model="statusModel"
            :items="statusFilterOptions()"
            class="w-full"
          />
        </UFormField>
      </div>

      <QueryState
        :loading="orders.isPending.value"
        :error="orders.error.value"
        :empty="list.length === 0"
        :empty-title="
          status ? 'No tienes pedidos con ese estado' : 'Aún no tienes pedidos'
        "
        :empty-description="
          status
            ? 'Elige otro estado o mira todos.'
            : 'Cuando compres, aquí verás tus pedidos.'
        "
        @retry="orders.refetch()"
      >
        <ul class="divide-y divide-default rounded-lg border border-default">
          <li v-for="o in list" :key="o.publicCode">
            <NuxtLink
              :to="`/account/orders/${o.publicCode}`"
              class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4 hover:bg-elevated"
            >
              <div class="space-y-1">
                <p class="font-medium">
                  Orden <span class="font-mono">{{ o.publicCode }}</span>
                </p>
                <p class="text-sm text-muted">
                  {{ formatDate(o.placedAt) }} ·
                  {{ itemCountLabel(o.itemCount) }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <UBadge :color="orderStatus(o.status).color" variant="subtle">{{
                  orderStatus(o.status).label
                }}</UBadge>
                <span class="font-semibold">{{
                  formatMoney(o.grandTotal)
                }}</span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </QueryState>

      <ListPagination :meta="orders.data.value?.meta" @update:page="setPage" />
    </div>
  </div>
</template>
