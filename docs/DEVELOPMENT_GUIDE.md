# DEVELOPMENT GUIDE

> Adaptado de `docs/DEVELOPMENT_GUIDE.md` de base-shop (commit `7af0f1d`, ADR-F001). Se conservan su flujo, el entorno (Node.js 24, npm, LF, scripts de instalación), Git, CI, versiones, pull requests y Definition of Done. Lo propio del backend (módulos de NestJS, Prisma, migraciones, eventos, Testcontainers) no aplica y se omitió. Las convenciones de código del frontend son las del backoffice base-ecomm-admin (ADR-F009).

## Flujo

1. Leer `CLAUDE.md`.
2. Revisar documentación relacionada: la del frontend en `docs/` y la del contrato en `docs/api/`.
3. Crear/confirmar plan. El plan lista las rutas de la API que usa cada pantalla, con sus representaciones (`docs/api/API_SPEC.md` §8), sus errores por `type` (§6.2) y su rate limiting (§7). Si la pantalla necesita algo que la API no ofrece, va a `docs/API_GAPS.md` antes de implementar (ver `AI_WORKFLOW.md`). Si la tarea va en partes con un ADR cada una, el plan fija el número de ADR-F de cada parte; con sesiones en paralelo, el número se confirma en `main` justo antes de escribirlo.
4. Implementar una tarea acotada.
5. Crear/actualizar tests.
6. Ejecutar verificaciones.
7. Actualizar documentación.
8. Actualizar `TASKS.md` y `PROGRESS.md`; al cerrar un sprint, también el estado de `PROJECT.md` y `README.md`.
9. Crear checkpoint Git, después de revisar lo preparado y correr `npm run secrets:scan` (ver "Ramas y commits").

## Convenciones

Stack: Nuxt 4 SPA (ADR-F005), con sesión (ADR-F006), librerías (ADR-F007), tests y calidad (ADR-F008), organización (ADR-F009) y entorno local (ADR-F010).

Código, como el backoffice:

- Archivos en kebab-case (`use-api.ts`, `session.store.ts`), componentes Vue en PascalCase (`ProblemAlert.vue`) y páginas con el nombre de su ruta (`pages/products/[slug].vue`).
- `<script setup lang="ts">` en todos los componentes; los composables empiezan con `use`.
- Las llamadas a la API pasan por `useApi()` y TanStack Query, nunca `$fetch` directo; las rutas públicas llevan `auth: false`.
- Los tipos de la API salen de `app/shared/api/generated/openapi.d.ts` (`Schemas['…']`); no se declaran a mano. Se regeneran con `npm run api:types` después de resincronizar `docs/api/`.
- Prettier con la configuración de la API (`.prettierrc`: comillas simples, coma final y punto y coma): los archivos copiados del backoffice se formatean con ella.

Ya decidido:

- Organización `pages → features → shared`, sin imports entre features (`ARCHITECTURE.md`).
- Sin `v-html` con datos de la API ni del usuario (regla de lint).
- Datos del servidor solo en TanStack Query; Pinia solo para la sesión y el `cartId`.
- Formularios con Zod y `UForm`, con los límites de `API_SPEC.md`.
- Archivos copiados del backoffice: su primer comentario dice de qué archivo y commit vienen (ADR-F009).

Ya definido, sin importar el stack:

- TypeScript en modo estricto (como la API, base-shop ADR-0002).
- Idioma: código, nombres y commits en inglés; textos de la interfaz en español de México (base-shop ADR-0026); documentación en español.
- Ningún secreto en el código que llega al navegador ni en variables de entorno públicas del framework (las que se incrustan en el bundle).

### Consumo de la API

Resumen de `docs/api/API_SPEC.md` §1 a §8 para quien escribe pantallas. Ante una duda, manda el documento de la API.

- **Base:** todo bajo `/v1`. Dentro de `v1` solo hay cambios compatibles, así que el cliente debe tolerar campos nuevos y valores de enumeración desconocidos (§2.1).
- **Dinero:** las respuestas traen `Money` `{ amount, currency }` con `amount` en centavos enteros (§8.1). Se muestra con formato de MXN; nunca se hace aritmética con flotantes. Las solicitudes envían centavos enteros, como `expectedTotal` al colocar la orden.
- **Cálculos:** precios, IVA, envío, descuentos y totales los calcula la API (`CheckoutQuote`, §8.7). El frontend muestra lo que recibe; no recalcula.
- **Errores:** `application/problem+json` (RFC 9457, §6). Se decide por `type`, nunca por el texto; `errors[].field` marca el campo del formulario; `lines` marca las líneas sin stock. El `correlationId` se muestra al usuario en errores inesperados, para soporte, y nunca se registra junto con datos personales.
- **Idempotencia:** colocar la orden e iniciar el pago exigen `Idempotency-Key` (§4). La llave se genera una vez por intento de compra (UUID) y se reutiliza en los reintentos de ese mismo intento; 409 `idempotency-request-in-progress` se reintenta tras `Retry-After`.
- **Rate limiting:** 429 con `Retry-After` (§7). Se muestra un mensaje y se espera; no se reintenta en bucle.
- **Paginación:** `page` y `pageSize` (máximo 100), con `meta.totalPages` (§5.1).
- **Consistencia eventual:** después de algunas operaciones, el estado tarda en actualizarse (§2.5). La interfaz lo advierte y vuelve a consultar; no asume el estado final.
- **Carrito de invitado:** el `cartId` es la única credencial del carrito (base-shop ADR-0059). Se guarda como dato sensible y nunca va en una URL que pueda compartirse.
- **Invitados:** el email y el código público de la orden viajan en el cuerpo, nunca en la URL (`docs/api/SECURITY.md`).
- **Autenticación:** token de acceso JWT de unos 15 minutos en `Authorization: Bearer` y refresh token opaco de 7 días, rotado en cada uso; presentar uno ya rotado revoca la sesión (§3.1). La tienda los guarda como el backoffice: el de acceso en memoria y el refresh en `localStorage`, renovando de una en una entre pestañas (ADR-F006).
- **Imágenes:** `Image.url` es absoluta y la API la construye (§8.3). No se arma a mano.

### Accesibilidad y rendimiento

- Objetivo WCAG 2.2 nivel AA: navegación con teclado, foco visible, textos alternativos (`Image.altText`), contraste, formularios con etiquetas y errores asociados al campo.
- Presupuesto de rendimiento: `REQUIREMENTS.md` §6.2. Se mide con `npm run build && npm run perf:budget`, que necesita los puertos 3000 (API simulada) y 4174 libres y usa el Chromium de Playwright o el de `CHROME_PATH`; la CI lo corre en cada pull request (TF-015). Una pantalla nueva que comparte código con el catálogo puede subir su LCP: los chunks comunes pequeños se copian en las páginas (ADR-F015). Las imágenes del catálogo llegan en su tamaño original y la SPA no las redimensiona: carga diferida y tamaños de visualización fijos (ver `API_GAPS.md`, G-02).
- axe revisa cada pantalla en los e2e (ADR-F008).

## Configuración local

El frontend corre solo en local por ahora (ADR-F004, como la API con base-shop ADR-0031).

- La API se levanta desde su repositorio con `docker compose up --build` (ver su `README.md`): API en `http://localhost:3000`, Swagger UI en `http://localhost:3000/docs/v1` y Mailpit en `http://localhost:8025`.
- En el `.env` de la API:
  - `CORS_ALLOWED_ORIGINS` debe incluir el origen exacto de la tienda, `http://localhost:3002` (ADR-F010), además del backoffice (`http://localhost:3001`); vacía por defecto, sin ella el navegador no puede llamar a la API (base-shop ADR-0085).
  - `FRONTEND_BASE_URL` es la base de los enlaces de los correos de la tienda, `http://localhost:3002` por defecto, y `BACKOFFICE_BASE_URL` la del backoffice, `http://localhost:3001` (base-shop 1.8.0, ADR-0169). La verificación de email y el acceso a pedidos van siempre a la tienda; la recuperación de contraseña, a la tienda para un cliente y al backoffice para el staff. Las páginas `/verify-email`, `/reset-password` y `/order-access` de la tienda reciben `?token=…` (base-shop ADR-0117, ADR-0118, ADR-0148).
- Los correos de la API llegan a Mailpit; los enlaces de verificación, recuperación y acceso a pedidos se abren desde ahí.
- La tienda se instala con `npm ci` (Node.js 24) y corre con `npm run dev` en `http://localhost:3002`, con `NUXT_PUBLIC_API_BASE_URL` y `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION`, fijadas al construir (ADR-F010). Toda variable nueva se agrega a `.env.example` en el mismo cambio, con descripción y valor de ejemplo no real. `.env` nunca se versiona.

## Entorno

Igual que base-shop (ADR-0025, ADR-0108):

- Node.js 24, en su última actualización menor: `.nvmrc` y `engines` de `package.json`.
- npm como gestor de paquetes; `package-lock.json` se versiona y las instalaciones en CI usan `npm ci`.
- Fin de línea LF en todos los archivos de texto, forzado por `.gitattributes` (`* text=auto eol=lf`), igual que `.editorconfig` y Prettier.
- `npm run audit` debe quedar sin vulnerabilidades altas ni críticas, salvo las excepciones revisadas de `audit-exceptions.json`, igual que en la CI (ADR-F011).
- Scripts de instalación de las dependencias:
  - `package.json` los niega en `allowScripts`, y `.npmrc` (`strict-allow-scripts=true`) hace fallar la instalación si una dependencia trae uno sin revisar.
  - Si `npm ci` falla con `ESTRICTALLOWSCRIPTS`, se revisa el script que lista el error (`npm install-scripts ls`) y se decide: lo normal es negarlo con `npm install-scripts deny <paquete>`; solo si hace falta, se aprueba con `npm install-scripts approve --no-allow-scripts-pin <paquete>` y se registra el motivo en un ADR-F.
  - Nunca se usa `--dangerously-allow-all-scripts`.

## Ramas y commits

Ramas, commits y pull requests en inglés (ADR-F003, de base-shop ADR-0084):

- Ramas: `tipo/tf-xxx-descripcion-corta`, en minúsculas y con guiones (por ejemplo, `feat/tf-010-product-list`). Sin tarea, el ID de la decisión (`chore/pf-01-...`) o solo la descripción.
- Commits: Conventional Commits, `tipo: descripción` en imperativo y en una línea corta (por ejemplo, `feat: show the product list`). Cuerpo opcional; pie opcional con referencias (`Refs: TF-010, ADR-F002`).
- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`. Los revisa `.github/scripts/check-commit-messages.sh` en la CI.
- Antes de cada commit, con Docker en marcha:
  1. `git diff --cached --stat`: comprobar que lo preparado es solo lo de ese commit.
  2. `npm run secrets:scan`: corre gitleaks con Docker sobre lo preparado y sobre todo el historial (`scripts/secrets-scan.ts`, copiado de base-shop ADR-0119 y ADR-0156). Si encuentra algo, se corrige antes de commitear. Si su salida se filtra (por ejemplo, con `| tail`), se activa antes `set -o pipefail`.
- Si gitleaks reporta algo: un secreto real se rota de inmediato y se saca del historial; un falso positivo va a `.gitleaksignore` con su huella y un comentario que explique por qué. Un falso positivo dentro de `docs/api/`, que no se edita, va a `.gitleaks.toml` por su valor, con su descripción.

## Ramas e integración continua

Igual que base-shop (ADR-0030, ADR-0105, ADR-0106):

- GitHub Flow: `main` siempre está en estado desplegable; cada tarea se trabaja en una rama corta y se integra mediante pull request.
- CI en `.github/workflows/ci.yml`, en cada pull request hacia `main` y en cada push a `main`, con dos jobs:
  - `Pipeline`: instalación, lint y formato, tipos del contrato al día, typecheck, tests unitarios y de componentes, auditoría de dependencias (ADR-F011), build, e2e con axe en Chromium (escritorio y móvil), presupuesto de rendimiento (TF-015) y escaneo de secretos del historial. Lo mismo se corre en local con los scripts de `README.md` antes de abrir un pull request.
  - `Commit messages`: revisa el título del pull request y los commits.
- Ruleset de `main` como código en `.github/rulesets/main.json`, igual al de la API: exige pull request y los checks `Pipeline` y `Commit messages` en verde, con la rama al día; 0 aprobaciones y ninguna excepción. Se aplica con `gh api --method POST repos/Ferchoner/base-shop-front/rulesets --input .github/rulesets/main.json` (la primera vez) o `--method PUT …/rulesets/<id>` después; requiere administrador del repositorio. Un cambio hecho en la interfaz de GitHub se copia al archivo.
- Los nombres de los jobs son los checks obligatorios de `main`: cambiarlos exige actualizar el ruleset.
- Las actions de terceros se fijan por SHA, con la versión en un comentario (`uses: actions/checkout@<sha> # v7.0.1`).
- La CI corre con permisos de solo lectura y nunca interpola datos del pull request (como el título) en sus scripts.
- Dependabot (`.github/dependabot.yml`) revisa npm y GitHub Actions los lunes a las 06:00, espera 7 días desde que se publica una versión, agrupa menores y parches de npm, y abre de inmediato las actualizaciones de seguridad.
- Ramas: se borran solas al fusionar; en local se limpian con `git fetch --prune`.

## Versiones

Como base-shop (ADR-0159):

- La aplicación sigue el versionado semántico. Empieza en `0.x` hasta que la tienda pública cubra su primer alcance (`PROJECT.md` §3); entonces se publica la 1.0.0.
- Cada versión es un incremento con su plan aprobado, registrado en `SPRINT.md`. Sus cambios se anotan en la sección "Unreleased" de `CHANGELOG.md`.
- `PROJECT.md` registra con qué versión de la API se probó cada versión del frontend.
- Para publicar: `npm version X.Y.Z --no-git-tag-version` en el último pull request del incremento, y al fusionarlo, con la aprobación del usuario, el tag anotado `vX.Y.Z` sobre el commit de la fusión y su Release con notas en inglés.

## Pull Requests

Cada PR, con título y descripción en inglés (ADR-F003), debe explicar:

- objetivo;
- cambios;
- tests;
- versión de la API contra la que se probó;
- riesgos;
- documentación actualizada.

## Definition of Done

Una tarea está DONE cuando:

- código implementado;
- tests apropiados;
- verificaciones ejecutadas;
- documentación actualizada;
- criterios de aceptación cumplidos;
- toda variable de entorno nueva agregada a `.env.example` con descripción;
- pantallas usables con teclado y sin errores de accesibilidad conocidos;
- lo que la API no ofrece registrado en `API_GAPS.md`, sin simularlo en el frontend;
- sin problemas críticos conocidos.
