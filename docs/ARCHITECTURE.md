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
| `app/layouts/default.vue`, `app/pages/index.vue`, `app/error.vue` | Encabezado y pie provisionales, inicio que comprueba la conexión con la API y página de error | Reemplazados en TF-006 y TF-007 |
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

Creado en TF-007:

| Ruta | Contenido | Origen |
|---|---|---|
| `app/features/catalog/api.ts`, `types.ts` | Queries de categorías, marcas y productos, con `staleTime` de 60 s (la API cachea 120 s) | Propios, con la forma del backoffice |
| `app/features/catalog/filters.ts` | Filtros de la URL → parámetros de la API: precios en centavos, `pageSize` 24 y descarte de lo que la API rechazaría | Propio |
| `app/features/catalog/tree.ts` | Árbol de categorías aplanado para el selector | `flattenTree` copiado del backoffice |
| `app/features/catalog/components/` | `ProductCard`, `ProductGrid`, `CategoryLinks` y `CatalogFilters` | Propios |
| `app/shared/api/use-list-params.ts`, `app/components/ListPagination.vue` | Página y filtros en la URL, y paginación | Del backoffice; `push` en lugar de `replace` para que "atrás" funcione, y paginación con nombre accesible |
| `app/pages/index.vue`, `app/pages/products/index.vue` | Inicio y catálogo | Propios |

Creado en TF-008: `app/features/catalog/variants.ts` (opciones en cascada, variante elegida y orden de la galería), `ProductGallery` y `VariantSelector` en `app/features/catalog/components/`, y la página `app/pages/products/[slug].vue`. Todos propios.

Creado en TF-009, todo propio:

| Ruta | Contenido |
|---|---|
| `app/shared/stores/cart-id.ts` | `cartId` del invitado en Pinia y `localStorage`, con el evento `storage` para las demás pestañas. Está en `shared` porque la sesión lo fusiona en TF-010 |
| `app/features/cart/api.ts` | Carrito de invitado: lectura que olvida el carrito que ya no sirve, agregado que crea el carrito una sola vez aunque se pulse dos veces, y cambio o baja de línea con la respuesta de la API |
| `app/features/cart/errors.ts` | Mensajes de los errores propios del carrito |
| `app/features/cart/components/` | `AddToCart`, `CartLineItem`, `CartLink` (encabezado) y `QuantitySelect` |
| `app/pages/cart.vue` | Carrito |

Creado en TF-010 (sesión, ADR-F006):

| Ruta | Contenido | Origen |
|---|---|---|
| `app/shared/auth/token-storage.ts`, `exclusive.ts`, `redirect.ts`, `auth-gateway.ts` | Refresh token en `localStorage` (`base-shop-front.refreshToken`), Web Lock `base-shop-front.session-refresh`, redirección solo a rutas internas y llamadas de autenticación con el token explícito | Copiados del backoffice; cambian la llave, el nombre del candado y lo que es solo del staff |
| `app/shared/auth/session.store.ts` | Sesión en Pinia: token de acceso en memoria, cuenta, renovación de una en una (proactiva y ante un 401), recuperación al abrir y cierre | Adaptado del backoffice: exige una cuenta `CUSTOMER`; una de staff nunca cuenta como sesión, recibe el aviso de §1 y se le cierra |
| `app/plugins/01.api.ts`, `02.vue-query.ts`, `app/middleware/auth.global.ts`, `app/types/page-meta.d.ts` | Conexión de la sesión, cierre en las demás pestañas con el evento `storage`, caché vacía al cerrar sesión y rutas con `meta.auth` (piden sesión) o `meta.guestOnly` (`/login`) | Adaptados del backoffice |
| `app/features/cart/api.ts` | `useCart` usa `/v1/me/cart` con sesión y `/v1/carts/{cartId}` sin ella; fusión del carrito de invitado con aviso | Propio |
| `app/pages/login.vue` | Inicio de sesión con la fusión del carrito y regreso a la ruta de origen | Adaptado del backoffice |
| `app/pages/account/index.vue`, `app/components/AccountLinks.vue` | Mi cuenta con los datos de la sesión (se completa en TF-013) y la cuenta del encabezado | Propios |

Cómo se comporta la sesión:

- **Primera pantalla sin esperar:** la sesión se recupera en segundo plano al abrir la tienda. Solo esperan las rutas con `meta.auth` o `meta.guestOnly`; el contador del carrito y la cuenta del encabezado aparecen cuando ya se sabe si hay sesión (`isSettled`), para no pedir el carrito de invitado y luego el del cliente.
- **Fusión:** solo se fusiona un carrito de invitado activo con líneas (se lee antes con `GET /v1/carts/{cartId}`); uno vacío, ya fusionado o usado en una orden solo se olvida. `/login` la espera antes de regresar a la ruta de origen, y si falla por red, el `cartId` se conserva y la fusión se reintenta al leer el carrito del cliente. Una sola fusión a la vez dentro de la pestaña; la API es idempotente (base-shop ADR-0059).
- **Cierre:** "Cerrar sesión" olvida también el `cartId` de invitado (§4.5). Una sesión que vence por sí sola no lo toca. Las rutas con `meta.auth` llevan al login cuando la sesión termina, en esta pestaña o en otra; las demás se quedan donde están.

Creado en TF-011:

| Ruta | Contenido | Origen |
|---|---|---|
| `app/shared/auth/password-policy.ts` | Política de contraseña validable en el navegador (15 a 64) y mensajes propios por `errors[].code` | Del backoffice, con los mensajes por regla |
| `app/features/account/api.ts` | Registro, verificación, reenvío y recuperación; `useLinkToken` lee el token del enlace y lo quita de la URL; aviso para `/login` | Propio; las dos mutaciones de recuperación copiadas del backoffice |
| `app/features/account/components/ResendVerification.vue`, `app/components/PasswordInput.vue` | Reenvío del enlace de verificación y contraseña con botón para mostrar lo escrito | Propios |
| `app/pages/register.vue`, `verify-email.vue`, `forgot-password.vue`, `reset-password.vue` | Registro, verificación y recuperación | `forgot-password` y `reset-password` adaptados del backoffice; los demás propios |

Los formularios que ponen errores de la API en sus campos validan al escribir sin demora (`validate-on-input-delay` en 0): con la demora de 300 ms de Nuxt UI, una validación pendiente borraba el error que acababa de llegar.

Creado en TF-017 (ADR-F013):

| Ruta | Contenido | Origen |
|---|---|---|
| `app/plugins/04.page-prefetch.ts`, `app/types/page-prefetch.d.ts` | Llama al `prefetch` de la página en `beforeResolve` para que sus lecturas salgan antes de montar el layout | Propios |
| `app/features/catalog/api.ts` | Opciones de cada lectura compartidas por los `use*` y los `prefetch*` (`prefetchCatalog`, `prefetchProduct`) | Propio |
| `app/shared/api/use-list-params.ts` | `readPage` y `readFilters` leen la página y los filtros de una ruta, también fuera de un componente | Separado de lo copiado del backoffice |

Una página cuyo LCP depende de datos declara con `defineOptions({ prefetch })` las lecturas que necesita, con las mismas opciones que sus `use*`. Hoy lo hacen el catálogo y el producto.

Los componentes que usan varias features viven en `app/components/` (autoimportados por Nuxt); los de una sola feature, en su carpeta.

Los archivos copiados dicen en su primer comentario de qué archivo y commit del backoffice vienen (`bbcd5af`).
