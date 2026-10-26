# ARCHITECTURAL DECISION RECORDS — Frontend

> Formato copiado de `docs/DECISIONS.md` de base-shop (ADR-F001). Las decisiones de la API (ADR-0001 a ADR-0168) están en `docs/api/DECISIONS.md`; las del frontend llevan `F` (ADR-F001) para no confundirlas.

## Formato

Cada decisión importante debe registrar:

- ID
- Fecha
- Contexto
- Decisión
- Alternativas consideradas
- Consecuencias
- Estado

Estados posibles: Propuesta, Aceptada, Reemplazada, Rechazada.

Si una decisión del frontend contradice o amplía una de la API, lo dice y cita el ADR de la API. Una decisión que necesita un cambio en la API se registra también en `API_GAPS.md`.

## Índice

| ID | Título | Estado |
|---|---|---|
| ADR-F001 | Reglas y documentación heredadas de base-shop | Aceptada |
| ADR-F002 | Copia de la documentación de la API en `docs/api/` | Aceptada |
| ADR-F003 | Git, CI y protección de `main` como en base-shop | Aceptada |
| ADR-F004 | Solo entorno local | Aceptada |
| ADR-F005 | Nuxt 4 como SPA, igual que el backoffice | Aceptada |
| ADR-F006 | Sesión en el navegador sin servidor intermedio | Propuesta |
| ADR-F007 | Librerías de la tienda, las mismas del backoffice | Propuesta |
| ADR-F008 | Tests y calidad | Propuesta |
| ADR-F009 | Organización por features y código copiado del backoffice | Propuesta |
| ADR-F010 | Entorno local: puerto y variables | Propuesta |

---

## ADR-F001 — Reglas y documentación heredadas de base-shop

- **Fecha:** 2026-10-26
- **Contexto:** El repositorio base-shop-front nace vacío para construir la tienda pública sobre la API base-shop (versión 1.7.0). La API se construyó con un conjunto de reglas para trabajar con IAs (`CLAUDE.md`, `AI_WORKFLOW.md`, `TEAM_GUIDE.md`, `DEVELOPMENT_GUIDE.md`) y una documentación de proyecto como fuente de verdad. El usuario pidió replicar ese contexto, reglas, restricciones y ayudas en el frontend, copiando todo lo posible para no depender del otro repositorio y dejando constancia de dónde proviene.
- **Decisión:**
  - **Mismo método de trabajo:** el frontend adopta el rol, las reglas, el proceso (ANALIZAR → … → ACTUALIZAR ESTADO), el reporte obligatorio, la guía de equipo y el flujo de desarrollo de base-shop, adaptados al frontend. Cada documento adaptado dice al inicio de qué archivo y commit de base-shop viene y qué cambió.
  - **Reglas nuevas para el frontend** en `CLAUDE.md`: las reglas de negocio viven en la API y el frontend no las recalcula (15); `docs/api/` no se edita a mano (16); lo que falte en la API va a `API_GAPS.md` y se avisa al usuario (17). Además, accesibilidad (WCAG 2.2 AA) y rendimiento como parte del rol.
  - **Mismos documentos de proyecto:** `PROJECT`, `REQUIREMENTS`, `ARCHITECTURE`, `SECURITY`, `DECISIONS`, `TASKS`, `PROGRESS`, `SPRINT`, `CHANGELOG`, `DEVELOPMENT_GUIDE`, `AI_WORKFLOW` y `TEAM_GUIDE`, más `API_GAPS.md`, propio del frontend.
  - **Identificadores propios con `F`:** ADR-F001, tareas TF-001, decisiones pendientes PF-01. Los de la API (ADR-0084, T-140, P-05, UC-CAT-01, BR-PRD-11) se citan tal cual, con "base-shop" delante cuando el contexto no lo deja claro.
  - **No se copian** los documentos internos del backend (ver ADR-F002).
- **Alternativas consideradas:** empezar con reglas nuevas desde cero (pierde lo aprendido en 10 sprints de la API); un repositorio único con la API (monorepo), descartado porque los dos repositorios ya existen por separado; numeración de ADR continua a la de la API (ADR-0169 en adelante), descartada porque dos repositorios tomarían los mismos números.
- **Consecuencias:**
  - Una sesión de IA en este repositorio trabaja igual que en base-shop y encuentra el contexto sin abrir el otro repositorio.
  - Las convenciones de código del frontend quedan `PENDIENTE DE DECISIÓN` hasta elegir el stack (PF-01).
  - Cuando cambien las reglas de base-shop, no se propagan solas: se revisan y se adaptan aquí con su propio cambio.
- **Estado:** Aceptada (pedida por el usuario el 2026-10-26).

---

## ADR-F002 — Copia de la documentación de la API en `docs/api/`

- **Fecha:** 2026-10-26
- **Contexto:** El frontend depende del contrato y de las reglas de la API. El usuario pidió copiar todo lo posible para no depender del otro repositorio, dejar constancia de su origen, y avisar si algo no conviene copiar.
- **Decisión:**
  - **Copia exacta, sin editar**, en `docs/api/`: `API_SPEC.md`, `openapi/v1.json`, `BUSINESS_RULES.md`, `REQUIREMENTS.md`, `DOMAIN_MODEL.md`, `DECISIONS.md`, `SECURITY.md`, `PROJECT.md` y `CHANGELOG.md` de base-shop 1.7.0 (commit `7af0f1d`).
  - **Origen registrado** en `docs/api/README.md`: repositorio, rama, commit, fecha, versión de la API y fecha de la copia.
  - **Resincronización** solo con `scripts/sync-api-docs.sh <clon de base-shop>`, que copia los archivos y actualiza la tabla de origen. Después se revisa el `CHANGELOG.md` de la API y se anota el impacto.
  - **No se copian:** `DATABASE.md` (esquema interno: el frontend solo usa el contrato), `ARCHITECTURE.md` (arquitectura interna de NestJS), `TASKS.md`, `PROGRESS.md` y `SPRINT.md` (plan y estado del backend, que quedarían viejos), `SECURITY_AUDIT.md` (auditoría de rutas del backend), las plantillas CSV del staff y `.env.example`. Las guías de trabajo se adaptan en lugar de copiarse (ADR-F001). El motivo de cada una está en `docs/api/README.md`.
  - **La API manda:** si la copia y la API publicada difieren, vale la API, y se resincroniza.
- **Alternativas consideradas:** enlazar a los documentos de base-shop (el frontend dependería de tener acceso al otro repositorio y de su rama actual); submódulo de Git (complica el clon y la CI para un uso de solo lectura); copiar también `DATABASE.md` (invita a depender de tablas que la API puede cambiar sin romper su contrato).
- **Consecuencias:**
  - La copia puede quedar atrasada respecto a la API; la tabla de origen dice de qué versión es, y cada pull request indica contra qué versión de la API se probó.
  - Los tipos del cliente de la API se generarán desde `docs/api/openapi/v1.json` (PF-05), así que resincronizar puede romper la compilación cuando el contrato cambie: es el aviso buscado.
- **Estado:** Aceptada (pedida por el usuario el 2026-10-26).

---

## ADR-F003 — Git, CI y protección de `main` como en base-shop

- **Fecha:** 2026-10-26
- **Contexto:** base-shop define sus convenciones de Git y su CI en base-shop ADR-0030 (GitHub Flow y CI), ADR-0084 (formato, ramas y commits), ADR-0105 (pipeline), ADR-0106 (ruleset de `main` y Dependabot), ADR-0108 (scripts de instalación) y ADR-0119 y ADR-0156 (escaneo de secretos). El frontend todavía no tiene stack ni dependencias.
- **Decisión:**
  - **Ramas, commits y pull requests en inglés**, con Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`) y ramas `tipo/tf-xxx-descripcion`. La documentación sigue en español.
  - **GitHub Flow** con `main` protegida por `.github/rulesets/main.json`, copiado de la API: pull request obligatorio y checks `Pipeline` y `Commit messages` en verde, sin excepciones.
  - **CI** en `.github/workflows/ci.yml` con los mismos dos jobs. Hoy `Pipeline` solo corre el escaneo de secretos del historial; los pasos de instalación, lint, formato, compilación, tests, auditoría y build llegan con el stack (TF-004).
  - **Copiados de la API:** `.editorconfig`, `.gitattributes`, `.prettierrc`, `.npmrc` (`strict-allow-scripts`), `.nvmrc` (Node.js 24), `.github/scripts/check-commit-messages.sh` con sus pruebas y `scripts/secrets-scan.ts`, con la misma imagen de gitleaks fijada por digest. `.gitignore`, `.prettierignore`, `.gitleaksignore` y `.github/dependabot.yml` se adaptaron, y `.gitleaks.toml` es nuevo: permite por su valor los ejemplos revisados de `docs/api/` (como la `Idempotency-Key` de ejemplo que base-shop también ignora), porque esa copia no se puede editar y una huella de `.gitleaksignore` deja de servir si el commit cambia al fusionar. Además,: sin las entradas propias del backend, con Dependabot activo porque el frontend no está cerrado como el MVP de la API (base-shop ADR-0158).
  - **`package.json` mínimo**, sin dependencias, con los scripts del escaneo de secretos y `engines` de Node.js 24, para que la regla "`npm run secrets:scan` antes de cada commit" valga desde el primer commit. La licencia es la del repositorio (Apache-2.0).
- **Alternativas consideradas:** esperar al stack para configurar la CI (los primeros pull requests quedarían sin revisar); hooks de Git con husky (la API tampoco los usa).
- **Consecuencias:**
  - El ruleset existe como archivo pero no está aplicado: aplicarlo requiere un administrador del repositorio (`DEVELOPMENT_GUIDE.md`) y conviene hacerlo después de que la CI corra una vez en `main`.
  - Al elegir el stack, TF-004 completa el job `Pipeline` sin cambiarle el nombre.
- **Estado:** Aceptada (pedida por el usuario el 2026-10-26).

---

## ADR-F004 — Solo entorno local

- **Fecha:** 2026-10-26
- **Contexto:** La API corre solo en local (base-shop ADR-0031, ADR-0158) y no tiene hosting (base-shop P-05, P-06). El usuario indicó que el frontend empieza sin despliegue productivo.
- **Decisión:** el frontend se desarrolla y se prueba solo en local, contra la API levantada con Docker Compose. Hosting, dominio, CDN, HTTPS y despliegue continuo se deciden junto con los de la API, cuando una entidad quiera operar la tienda.
- **Alternativas consideradas:** desplegar el frontend en un hosting gratuito de sitios estáticos (no serviría sin una API publicada).
- **Consecuencias:**
  - La CI no despliega.
  - Las decisiones que dependen del hosting (encabezados de seguridad del servidor del frontend, CDN de imágenes) quedan pendientes y se anotan en `PROGRESS.md`.
- **Estado:** Aceptada (indicada por el usuario el 2026-10-26).

---

## ADR-F005 — Nuxt 4 como SPA, igual que el backoffice

- **Fecha:** 2026-10-26
- **Contexto:** Cierra PF-01. Hay dos datos nuevos desde TF-001:
  - El backoffice del staff ya existe en [base-ecomm-admin](https://github.com/Ferchoner/base-ecomm-admin) (commit `bbcd5af`) como SPA en Nuxt 4 + Vue 3 + TypeScript (sus decisiones D-001 y D-P02).
  - El frontend más fuerte del usuario es Vue 2/3 con Nuxt (desde 2022); React solo en mantenimiento.
  - Una tienda pública se beneficia de un catálogo renderizado en servidor (SEO y primera carga en teléfonos). Pero si el servidor de la tienda llama a la API, todas esas llamadas salen de una sola IP y chocan con el límite de 100 solicitudes por minuto por IP (base-shop ADR-0154), y la API no confía en `X-Forwarded-For` mientras no haya hosting (base-shop P-06). El backoffice descartó un servidor intermedio por esa razón (su D-P02).
- **Decisión:**
  - **Nuxt 4 + Vue 3 + TypeScript estricto, como SPA:** `ssr: false` y build estático con `nuxt generate`, servido con fallback a `index.html`.
  - **El modo híbrido queda guardado:** cuando se valore el entorno productivo (PF-09), se decide si el catálogo se renderiza en servidor según el hosting disponible. En Nuxt se cambia con reglas por ruta (`routeRules`), sin reescribir pantallas; antes de activarlo, la API tendría que aceptar la IP del servidor de la tienda o tener un límite propio para ella (`API_GAPS.md`, G-10).
  - **Node.js 24**, como la API (ADR-F003); Nuxt 4 lo soporta. El backoffice usa Node.js 22.
- **Alternativas consideradas:** Nuxt 4 híbrido desde el inicio (SEO desde el primer día, pero un servidor Node, caché y el problema del límite por IP antes de que haga falta, porque solo corre en local); Next.js con un servidor intermedio (la primera recomendación: fuera del stack fuerte del usuario y distinto al backoffice, y su servidor intermedio choca con el límite por IP); Vite + Vue sin Nuxt (pierde las convenciones compartidas con el backoffice).
- **Consecuencias:**
  - Sin SEO del catálogo mientras sea SPA: aceptable en local. La página de producto igual pone título y descripción con `useHead` para cuando se active el híbrido.
  - `NUXT_PUBLIC_*` se fija al construir: un build por ambiente, como en el backoffice (su D-019).
  - El backoffice y la tienda comparten stack y patrones (ADR-F007, ADR-F009).
- **Estado:** Aceptada (elegida por el usuario el 2026-10-26, con el híbrido guardado para cuando se valore el hosting).

---

## ADR-F006 — Sesión en el navegador sin servidor intermedio

- **Fecha:** 2026-10-26
- **Contexto:** Cierra PF-02 y reemplaza la propuesta de un servidor intermedio (BFF) con cookie `HttpOnly` que hacía `API_GAPS.md` G-07. La API entrega el token de acceso (unos 15 minutos) y el refresh token (7 días) en el cuerpo, sin cookies, rota el refresh token en cada uso y revoca la sesión si se presenta uno ya rotado (base-shop ADR-0023, ADR-0114). Un servidor intermedio queda descartado por el límite por IP (ADR-F005). El backoffice resolvió lo mismo en su D-P03 y lo probó contra la API real (82 rotaciones seguidas con tres pestañas, su `docs/AUTHENTICATION.md`).
- **Decisión:** el mismo modelo que el backoffice:
  - token de acceso solo en memoria;
  - refresh token en `localStorage`, con una llave propia de la tienda, compartido por las pestañas para que todas sigan una sola cadena de rotación (`sessionStorage` haría que una pestaña duplicada rote la misma copia y revoque la sesión);
  - renovación de una en una: dentro de la pestaña, una sola promesa; entre pestañas, dentro de un Web Lock que lee el refresh token más reciente; proactiva antes de vencer y reactiva ante un 401;
  - cerrar sesión borra memoria y `localStorage`, vacía la caché de datos y llama a `POST /v1/auth/logout`; las demás pestañas se enteran por el evento `storage`;
  - el `cartId` del carrito de invitado (su única credencial, base-shop ADR-0059) también en `localStorage`, y se borra al fusionarlo con el carrito del cliente (UC-CRT-06);
  - mitigación del XSS: sin `v-html` con datos de la API (regla de lint), sin scripts de terceros, iconos y fuentes locales, y CSP estricta cuando haya hosting (PF-09).
- **Alternativas consideradas:** servidor intermedio con cookie `HttpOnly` (protege el refresh token de un XSS, pero todo el tráfico sale de una IP y comparte el límite de la API); `sessionStorage` (revoca la sesión con pestañas duplicadas); solo memoria (el cliente inicia sesión en cada recarga).
- **Consecuencias:**
  - Un XSS podría leer el refresh token: riesgo aceptado, como en el backoffice, con las mitigaciones anteriores.
  - Hereda el límite G-18 del backoffice: si la pestaña se recarga con una renovación en curso, la API revoca la sesión. Se registra como `API_GAPS.md` G-09, con la misma propuesta para el backend (un margen de gracia).
  - Requiere revisión humana (`TEAM_GUIDE.md`): toca el manejo de tokens.
- **Estado:** Propuesta.

---

## ADR-F007 — Librerías de la tienda, las mismas del backoffice

- **Fecha:** 2026-10-26
- **Contexto:** Cierra PF-03 y PF-05. El backoffice ya eligió y probó un conjunto de librerías sobre Nuxt 4 (su `docs/TECHNOLOGY_DECISION.md`, D-P05 a D-P10 y D-P14).
- **Decisión:** las mismas, salvo lo que la tienda no necesita:
  - **Componentes y estilos:** Nuxt UI 4 + Tailwind CSS 4, con un tema propio de la tienda. Accesibles (Reka UI) y con formularios integrados.
  - **Datos del servidor:** TanStack Query (`@tanstack/vue-query`): caché por llave, invalidación tras cambios, reintentos solo en lecturas.
  - **Estado del cliente:** Pinia solo para la sesión y el `cartId`; nunca datos del servidor.
  - **Cliente HTTP:** ofetch envuelto en un cliente propio: base URL, Bearer, renovación ante 401, Problem Details, `Idempotency-Key`, timeout.
  - **Tipos del contrato:** `openapi-typescript` desde `docs/api/openapi/v1.json` (ADR-F002), con `npm run api:types`. TypeScript fijado en `~5.9`, como el backoffice (su D-018), porque TypeScript 7 no expone la API que usan `openapi-typescript` y `vue-tsc`. La API usa TypeScript 6 en el servidor; no afecta al contrato.
  - **Validación de formularios:** Zod 4 con `UForm`, con los límites de `API_SPEC.md`; los 400 se llevan al campo por `errors[].field`.
  - **Idioma y formato:** solo español de México, con `Intl` (MXN desde centavos, fechas desde UTC); sin módulo de i18n.
  - **Sin PWA** ni códigos de barras en la tienda por ahora (son del backoffice).
- **Alternativas consideradas:** `useFetch`/`useAsyncData` de Nuxt (sin invalidación por llaves); openapi-fetch o axios; PrimeVue o Vuetify; VeeValidate. Descartadas por las mismas razones que en el backoffice.
- **Consecuencias:** un desarrollador del backoffice trabaja en la tienda sin aprender otro stack. Nuxt UI tiene aspecto de panel administrativo por defecto: la tienda necesita su propio tema (TF-003).
- **Estado:** Propuesta.

---

## ADR-F008 — Tests y calidad

- **Fecha:** 2026-10-26
- **Contexto:** Cierra PF-04. El backoffice usa Vitest, MSW, Playwright con axe, ESLint, Prettier y `vue-tsc` (sus D-P11, D-P12 y D-058).
- **Decisión:**
  - **Unitarias y de componentes:** Vitest + `@nuxt/test-utils` + Vue Test Utils + happy-dom; MSW para simular la API en el cliente HTTP.
  - **End-to-end:** Playwright sobre el build estático, en escritorio y móvil, con la API simulada; `@axe-core/playwright` revisa WCAG 2.2 A/AA en cada pantalla.
  - **Calidad:** `@nuxt/eslint` + Prettier (la configuración de la API, ADR-F003) + `vue-tsc` estricto. Reglas de lint: una feature no importa a otra y `vue/no-v-html` como error.
  - **CI:** el job `Pipeline` suma instalación, lint, formato, typecheck, tests, `npm audit --audit-level=high`, build y e2e, sin cambiar de nombre (ADR-F003).
  - **Contra la API real:** una prueba de humo manual por sprint con la API en Docker, como hizo el backoffice antes de su release.
- **Alternativas consideradas:** Cypress; oxlint como la API (no cubre las reglas de Vue y de Nuxt que usa el backoffice); tests e2e contra la API real en la CI (necesitaría levantar PostgreSQL y la API en cada pull request).
- **Consecuencias:** la CI no detecta un cambio de la API que no esté en `docs/api/`; por eso la resincronización regenera los tipos y corre los tests (ADR-F002).
- **Estado:** Propuesta.

---

## ADR-F009 — Organización por features y código copiado del backoffice

- **Fecha:** 2026-10-26
- **Contexto:** El backoffice organiza su código por features alineadas a los contextos de la API, sin capa de dominio, con dependencias `pages → features → shared` (sus D-P15 y D-P17). Su capa `app/shared` ya resuelve el cliente HTTP, la sesión, Problem Details, la política de contraseñas, el formulario de direcciones con el catálogo del INEGI y el formato de dinero y fechas. El usuario prefiere copiar a depender de otro repositorio, dejando constancia del origen (ADR-F001, ADR-F002).
- **Decisión:**
  - **Misma organización:** `app/pages` (rutas finas), `app/features/<feature>` (`api.ts`, `schemas.ts`, `types.ts`, `components/`) y `app/shared`. Una feature no importa a otra. Sin capa de dominio: las reglas viven en la API.
  - **Código compartido copiado, no compartido como paquete:** al crear el esqueleto (TF-004) se copian de base-ecomm-admin las piezas de `app/shared` que la tienda necesita, adaptadas a clientes (por ejemplo, la sesión rechaza cuentas de staff, al revés que el backoffice). Cada archivo copiado dice en su primer comentario de qué archivo y commit viene.
- **Alternativas consideradas:** un paquete npm compartido o un monorepo (más infraestructura para dos aplicaciones pequeñas); escribir todo desde cero (repite trabajo ya probado contra la API real).
- **Consecuencias:** una corrección en `shared` de un repositorio no llega sola al otro; al corregir algo copiado, se revisa el otro repositorio.
- **Estado:** Propuesta.

---

## ADR-F010 — Entorno local: puerto y variables

- **Fecha:** 2026-10-26
- **Contexto:** Cierra PF-06. La API corre en el puerto 3000 y el backoffice en el 3001. La API tiene una sola `FRONTEND_BASE_URL` para los enlaces de sus correos, y hoy apunta al backoffice por decisión del usuario (backoffice G-01 y D-032), así que los correos de clientes no llegan a la tienda (`API_GAPS.md`, G-08).
- **Decisión:**
  - **Puerto 3002** para la tienda en desarrollo (`npm run dev -- --port 3002`), agregado a `CORS_ALLOWED_ORIGINS` de la API.
  - **Variables públicas**, fijadas al construir (ADR-F005), en `.env.example`:
    - `NUXT_PUBLIC_API_BASE_URL`: base de la API sin `/v1` (por defecto `http://localhost:3000`);
    - `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION`: versión vigente del aviso de privacidad, la misma que usa el backoffice (su G-19); vacía, la tienda no permite registrarse ni comprar como invitado (`API_GAPS.md`, G-01).
  - Sin variables secretas: es una SPA (ADR-F006).
- **Alternativas consideradas:** el puerto 5173, que la API trae por defecto en `FRONTEND_BASE_URL` (no sirve de nada mientras esa variable apunte al backoffice, y es el puerto de Vite, que puede chocar con otros proyectos).
- **Consecuencias:** para probar en local los enlaces de verificación, recuperación y acceso a pedidos de clientes, `FRONTEND_BASE_URL` de la API se apunta a `http://localhost:3002` temporalmente, hasta que la API tenga una URL por frontend (G-08).
- **Estado:** Propuesta.
