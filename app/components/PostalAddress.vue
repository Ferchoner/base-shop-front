<!-- Adaptado de base-ecomm-admin app/components/PostalAddress.vue (commit bbcd5af, ADR-F009): con las direcciones que ve el comprador, que nunca están anonimizadas (API_SPEC §8.8). -->
<script setup lang="ts">
import type { Schemas } from '~/shared/api/types';

/** Dirección de envío de una orden o de la libreta del cliente (API_SPEC §8.2). */
const props = defineProps<{
  address: Schemas['PostalAddressDto'] | Schemas['AddressDto'];
}>();

const a = computed(() => props.address);
const street = computed(() =>
  [
    a.value.street,
    a.value.exteriorNumber,
    a.value.interiorNumber && `int. ${a.value.interiorNumber}`,
  ]
    .filter(Boolean)
    .join(' '),
);
</script>

<template>
  <address class="space-y-0.5 text-sm not-italic">
    <div v-if="a.recipientName" class="font-medium">{{ a.recipientName }}</div>
    <div v-if="street">{{ street }}</div>
    <div v-if="a.neighborhood">{{ a.neighborhood }}</div>
    <div>
      C.P. {{ a.postalCode }}, {{ a.city ? `${a.city}, ` : ''
      }}{{ a.municipalityName }}, {{ a.stateName }}
    </div>
    <div v-if="a.references" class="text-muted">{{ a.references }}</div>
    <div v-if="a.phone">Tel. {{ a.phone }}</div>
  </address>
</template>
