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

- Contrato: `docs/api/API_SPEC.md` y `docs/api/openapi/v1.json` (base-shop 1.8.0).
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

Creado en TF-004:

| Ruta | Contenido | Origen |
|---|---|---|
| `app/shared/api/client.ts`, `problem.ts`, `types.ts`, `use-api.ts` | Cliente HTTP, Problem Details y tipos del contrato | Copiados del backoffice; `problem.ts` suma los tipos que solo recibe la tienda |
| `app/shared/api/generated/openapi.d.ts` | Tipos generados con `npm run api:types` desde `docs/api/openapi/v1.json`; la CI falla si no están al día | Generado |
| `app/shared/utils/money.ts`, `dates.ts` | Dinero en MXN desde centavos y fechas en la zona del navegador | Copiados del backoffice |
| `app/plugins/01.api.ts`, `02.vue-query.ts` | Cliente de la API y TanStack Query; la sesión se conecta en TF-010 | Adaptados del backoffice |
| `app/layouts/default.vue`, `app/pages/index.vue`, `app/error.vue` | Encabezado y pie provisionales, inicio que comprueba la conexión con la API y página de error | Reemplazados en TF-006; el inicio, en TF-007 |
| `tests/unit/`, `tests/e2e/` | Vitest (con MSW en el cliente HTTP) y Playwright con axe sobre el build estático | Parte copiados del backoffice |

Creado en TF-006:

| Ruta | Contenido | Origen |
|---|---|---|
| `app/shared/api/problem-message.ts` | Título, texto y referencia que ve el cliente para cada `type` de error (`REQUIREMENTS.md` §4.1) | Propio |
| `app/shared/ui/use-retry-cooldown.ts` | Cuenta atrás del `Retry-After` tras un 429 | Propio |
| `app/shared/utils/form-errors.ts` | Errores de campo del Problem Details | Copiado del backoffice |
| `app/components/ProblemAlert.vue`, `QueryState.vue` | Alerta de error y estados de carga, vacío y error de una query | Del backoffice; `ProblemAlert` adaptado a los mensajes de la tienda y `QueryState` con un slot de carga |
| `app/components/PriceTag.vue`, `SiteSearch.vue` | Precio con comparación e IVA, y buscador del encabezado | Propios |
| `app/layouts/default.vue`, `app/error.vue` | Encabezado, pie, enlace para saltar al contenido y páginas 404 y de error | `error.vue` adaptado del backoffice |
| `app/plugins/03.route-focus.ts` | Foco al título al cambiar de pantalla (§4.6) | Propio |

Los componentes que usan varias features viven en `app/components/` (autoimportados por Nuxt); los de una sola feature, en su carpeta.

Los archivos copiados dicen en su primer comentario de qué archivo y commit del backoffice vienen (`bbcd5af`).
