# ARCHITECTURE — Frontend

> Principios copiados de `docs/ARCHITECTURE.md` de base-shop (ADR-F001). La arquitectura interna de la API (NestJS, capas, outbox) no se copió: el frontend solo depende de su contrato (ADR-F002).

## Principios

Iguales a los de la API:

- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión
- SOLID
- Clean Code
- Seguridad por diseño
- Testabilidad
- Modularidad

Propios del frontend:

- La API es la fuente de verdad del negocio: el frontend presenta, guía y valida para ayudar, pero no decide precios, totales, stock ni estados.
- Un solo punto de acceso a la API (cliente tipado, ADR-F007): las pantallas no arman URLs, encabezados ni manejo de errores por su cuenta.
- Accesibilidad y rendimiento como requisitos, no como mejoras.

## Integración con la API

Fija, sin importar el stack:

- Contrato: `docs/api/API_SPEC.md` y `docs/api/openapi/v1.json` (base-shop 1.7.0).
- Transporte: HTTPS en producción, JSON, `Authorization: Bearer`, sin cookies del lado de la API (base-shop ADR-0023, ADR-0085).
- Errores: Problem Details (RFC 9457), decididos por `type`.
- Lo que la API no ofrece: `API_GAPS.md`.

## Renderizado

SPA con Nuxt 4 (`ssr: false`), generada como archivos estáticos con `nuxt generate` y servida con fallback a `index.html` (ADR-F005). El navegador habla directo con la API, sin servidor intermedio (ADR-F006). El catálogo podrá pasar a renderizarse en servidor con reglas por ruta cuando se decida el hosting (PF-09, `API_GAPS.md` G-10).

## Estructura

Decidida en ADR-F009, igual que el backoffice base-ecomm-admin (sus D-P15 y D-P17):

```text
app/
├── pages/                rutas finas: leen parámetros y montan componentes de una feature
├── features/<feature>/   catalog, cart, checkout, account, orders…
│   ├── api.ts            queries y mutations de TanStack Query
│   ├── schemas.ts        esquemas Zod de los formularios
│   ├── types.ts          tipos derivados de los generados del OpenAPI
│   └── components/
└── shared/               cliente de la API, sesión, Problem Details, dinero y fechas, direcciones
```

- Dependencias: `pages → features → shared`. Una feature no importa a otra (regla de lint).
- Sin capa de dominio: las reglas viven en la API.
- Estado: TanStack Query para los datos de la API; Pinia solo para la sesión y el `cartId` (ADR-F007).
- Las piezas de `shared` se copian del backoffice al crear el esqueleto, cada una con su origen (ADR-F009).

El detalle se completa al crear el esqueleto (TF-004).
