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
| ADR-F006 | Sesión en el navegador sin servidor intermedio | Aceptada |
| ADR-F007 | Librerías de la tienda, las mismas del backoffice | Aceptada |
| ADR-F008 | Tests y calidad | Aceptada |
| ADR-F009 | Organización por features y código copiado del backoffice | Aceptada |
| ADR-F010 | Entorno local: puerto y variables | Aceptada |
| ADR-F011 | Auditoría de dependencias con excepciones revisadas | Aceptada |
| ADR-F012 | LCP de 2.5 s como meta de producción y topes locales contra regresiones | Aceptada |
| ADR-F013 | Las páginas piden sus datos en cuanto el router las resuelve | Aceptada |
| ADR-F014 | La orden recién colocada vive solo en memoria | Aceptada |
| ADR-F015 | Los chunks comunes pequeños se copian en las páginas que los usan | Aceptada |

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
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

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
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

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
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

---

## ADR-F009 — Organización por features y código copiado del backoffice

- **Fecha:** 2026-10-26
- **Contexto:** El backoffice organiza su código por features alineadas a los contextos de la API, sin capa de dominio, con dependencias `pages → features → shared` (sus D-P15 y D-P17). Su capa `app/shared` ya resuelve el cliente HTTP, la sesión, Problem Details, la política de contraseñas, el formulario de direcciones con el catálogo del INEGI y el formato de dinero y fechas. El usuario prefiere copiar a depender de otro repositorio, dejando constancia del origen (ADR-F001, ADR-F002).
- **Decisión:**
  - **Misma organización:** `app/pages` (rutas finas), `app/features/<feature>` (`api.ts`, `schemas.ts`, `types.ts`, `components/`) y `app/shared`. Una feature no importa a otra. Sin capa de dominio: las reglas viven en la API.
  - **Código compartido copiado, no compartido como paquete:** al crear el esqueleto (TF-004) se copian de base-ecomm-admin las piezas de `app/shared` que la tienda necesita, adaptadas a clientes (por ejemplo, la sesión rechaza cuentas de staff, al revés que el backoffice). Cada archivo copiado dice en su primer comentario de qué archivo y commit viene.
- **Alternativas consideradas:** un paquete npm compartido o un monorepo (más infraestructura para dos aplicaciones pequeñas); escribir todo desde cero (repite trabajo ya probado contra la API real).
- **Consecuencias:** una corrección en `shared` de un repositorio no llega sola al otro; al corregir algo copiado, se revisa el otro repositorio.
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

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
- **Nota (2026-10-26):** desde base-shop 1.8.0 (ADR-0169) la API tiene una URL por frontend: `FRONTEND_BASE_URL` es la tienda, con `http://localhost:3002` por defecto, y `BACKOFFICE_BASE_URL` el backoffice. Ya no hace falta apuntarla temporalmente (G-08 resuelta).
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

---

## ADR-F011 — Auditoría de dependencias con excepciones revisadas

- **Fecha:** 2026-10-26
- **Contexto:** ADR-F008 pide que la CI falle con `npm audit --audit-level=high`, como la API. Al crear el esqueleto (TF-004), `npm audit` reporta una vulnerabilidad alta en `node-forge` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) que no tiene versión corregida. Llega por `nuxt → nitropack → listhen`: el servidor de desarrollo de Nuxt la usa para crear un certificado HTTPS propio. No llega al build estático que sirve la tienda (`nuxt generate`, ADR-F005), y el backoffice tiene la misma dependencia. `npm audit` no permite ignorar una vulnerabilidad, así que con `--audit-level=high` la CI fallaría en cada pull request sin que haya nada que corregir.
- **Decisión:**
  - `npm run audit` corre `scripts/audit.ts`: lee `npm audit --json` y falla con toda vulnerabilidad alta o crítica que no esté en `audit-exceptions.json`.
  - Cada excepción nombra una vulnerabilidad por su URL de GitHub, el paquete, por qué no llega a la tienda y una fecha de revisión. Pasada la fecha, la auditoría vuelve a fallar hasta que alguien la revise. Una excepción que ya no hace falta se avisa para quitarla.
  - La primera excepción es la de `node-forge`, a revisar el 2027-01-31.
  - Una excepción nueva solo se agrega con su motivo en el pull request y revisión humana (`TEAM_GUIDE.md`); una vulnerabilidad en código que llega al navegador nunca lleva excepción: se actualiza o se reemplaza la dependencia.
  - Se corrigieron las que tenían arreglo: `happy-dom` pasó a la 21 (vulnerabilidad alta, solo de tests) y `esbuild` se actualizó con `npm audit fix`.
- **Alternativas consideradas:** `npm audit --audit-level=critical` (dejaría pasar cualquier alta nueva); `--omit=dev` (no sirve: `nuxt` es dependencia de producción aunque `node-forge` solo se use en desarrollo); `overrides` hacia otra versión (no hay ninguna corregida); quitar la auditoría de la CI hasta que haya arreglo (ADR-F008 la exige).
- **Consecuencias:** la CI sigue fallando con cualquier vulnerabilidad alta o crítica nueva. Cuando salga una versión corregida de `node-forge` o Nuxt deje de usarla, el script avisa que la excepción sobra.
- **Estado:** Aceptada (aprobada por el usuario el 2026-10-26).

---

## ADR-F012 — LCP de 2.5 s como meta de producción y topes locales contra regresiones

- **Fecha:** 2026-10-27
- **Contexto:** al cerrar el sprint 1 se midió el presupuesto de `REQUIREMENTS.md` §6.2. Se usó Lighthouse 13 en perfil móvil (CPU 4 veces más lenta y 4G lenta simulada) sobre el build de producción, servido con gzip y con una API simulada; se tomó la mediana de 3 corridas por pantalla.
  - Inicio: LCP 2.59 s, FCP 2.15 s.
  - Catálogo: LCP 3.66 s, FCP 2.35 s.
  - Producto: LCP 3.48 s, FCP 2.38 s.
  - CLS de 0 a 0.03. Total Blocking Time de 170 a 470 ms. JavaScript inicial de 169 KB comprimido.
  - El cuello de botella es la CPU al arrancar Vue, Nuxt UI y TanStack Query: el FCP pasa de 2.1 s antes de pedir nada a la API. Se probaron dos optimizaciones y se descartaron:
    - pedir los datos de la pantalla en un middleware, en paralelo con su código: el LCP no bajó y el FCP subió unos 150 ms por el código extra en la entrada;
    - cargar los filtros del catálogo en diferido: el LCP bajó unos 100 ms.
  - Bajar de 2.5 s pide renderizar o prerenderizar en servidor, que es el modo híbrido guardado en ADR-F005 y depende del hosting (PF-09) y del límite por IP de la API (G-10).
- **Decisión** (elegida por el usuario el 2026-10-27):
  - El LCP de 2.5 s queda como **meta de producción**, a cumplir con el modo híbrido al decidir el hosting.
  - En local, el LCP tiene **topes contra regresiones**: 3.0 s en `/` y 4.0 s en `/products` y `/products/{slug}`, medidos como arriba. TF-015 los pone en la CI.
  - Los demás valores de §6.2 no cambian: INP, CLS y tamaño del JavaScript.
- **Alternativas consideradas:** cerrar el sprint sin decidir y dejarlo a TF-015 (el presupuesto quedaría roto sin regla durante tres sprints); cambiar el presupuesto a un LCP de 3.5 s para todo (renuncia a la meta de producción); investigar recortes mayores, como quitar componentes de Nuxt UI o prerenderizar el inicio (más tiempo, contra el stack ya elegido en ADR-F007).
- **Consecuencias:**
  - El sprint 1 cierra con el presupuesto local cumplido y la meta de producción pendiente del modo híbrido.
  - Una pantalla nueva que pase su tope local es una regresión que se corrige antes de fusionar, cuando TF-015 esté en la CI.
  - Al activar el modo híbrido se vuelve a medir contra 2.5 s.
- **Seguimiento al cerrar el sprint 2 (2026-10-27):**
  - Con TF-010 y TF-011 el LCP subió: inicio 2.68 s, catálogo 4.08 s (pasó su tope), producto 3.79 s. La causa es el reparto del código: las pantallas nuevas comparten componentes con el catálogo y Vite los separa en más chunks pequeños, que se descargan en más tandas, y el encabezado suma la sesión. El cambio de una pantalla a otra no mueve la CPU de arranque.
  - Se probaron tres arreglos. Descargar las páginas enlazadas al interactuar (pasar el cursor, enfocar o tocar) y no al aparecer el enlace en pantalla: catálogo 3.97 s y producto 3.48 s. Agrupar los chunks del catálogo con `codeSplitting` de Rolldown: catálogo 3.56 s, pero el JavaScript inicial sube a 204 KB y pasa el presupuesto de 200 KB. Cargar el encabezado con la entrada: empeora.
  - El usuario eligió (2026-10-27) aplicar la descarga al interactuar, mantener los topes y ajustar el reparto de chunks antes del checkout (TF-017), porque el checkout volverá a acercar el catálogo a su tope.
- **Seguimiento con TF-017 (2026-10-27):** la causa principal no era el reparto de chunks. Con la CPU 4 veces más lenta, la petición de productos salía unos 240 ms después de que el router resolvía la página, porque antes se montaban el layout y todo el encabezado. Con ADR-F013 esa petición sale al resolver la ruta. Medido igual que arriba, con 5 corridas por pantalla y contra `main` en la misma máquina: catálogo de 3.92 a 3.60 s y producto de 3.53 a 3.43 s, los dos por debajo de lo medido al cerrar el sprint 1. El inicio queda igual (2.66 s) y el JavaScript inicial también (171 KB). Agrupar chunks ya no hace falta.
- **Seguimiento al cerrar el sprint 3 (2026-10-27):**
  - Con TF-012 y TF-014, medido igual y contra la cabeza de TF-017 en la misma máquina: inicio de 2.65 a 2.79 s, catálogo de 3.57 a 3.72 s y producto de 3.41 a 3.56 s. Los tres siguen dentro de su tope; el catálogo queda 60 ms sobre lo medido al cerrar el sprint 1. JavaScript inicial: 172 KB.
  - La causa es un chunk más en la tanda de la página: `shared/utils/money.ts`, que antes viajaba con `QueryState`, ahora lo importan páginas que no usan `QueryState` (los pedidos de invitado) y Rolldown lo separa en un chunk de 500 bytes. La tanda pasa de 6 a 7 peticiones, y Lighthouse simula HTTP/1.1 con 6 conexiones: la séptima espera otra vuelta. Con HTTP/2 no pasaría.
  - Se probó un grupo de `codeSplitting` con `money.ts` y `QueryState`: Rolldown incluye sus dependencias y el chunk compartido crece a 340 KB sin comprimir (JavaScript inicial 174 KB). Se descartó.
  - Se acepta mientras los tres estén dentro de su tope. TF-015 pondrá los topes en la CI, y el reparto de chunks se revisa si una pantalla nueva los pasa.
- **Seguimiento con TF-013 y TF-015 (2026-10-27):**
  - Con TF-013 el catálogo subió de 3.72 a 3.94 s, a 60 ms de su tope. Mis pedidos comparte con él la paginación, los filtros en la URL y la lista de opciones, y Rolldown separa cada pieza en un chunk pequeño: la tanda de la página pasó de 13 a 15 archivos. El usuario eligió fusionar TF-013 y recuperar el margen al empezar TF-015.
  - Se recuperó copiando los chunks comunes pequeños en las páginas (ADR-F015). Medido igual, contra `main` en la misma máquina: inicio de 2.87 a 2.55 s, catálogo de 3.93 a 3.62 s y producto de 3.60 a 3.51 s. JavaScript inicial de 172.7 a 179.2 KB.
  - TF-015 pone los topes en la CI: `npm run perf:budget` (`scripts/perf-budget.ts`) mide como arriba, con la mediana de 3 corridas, y falla si un tope de LCP, el CLS, el JavaScript inicial o el de una página se pasa. Corre en el job `Pipeline` después de los e2e y deja la tabla en el resumen del job.
  - Lighthouse queda fijo en 13.5.0: la 13.6.0 dio un LCP de 0.9 s en el inicio sobre el mismo build, que no corresponde a lo que pinta la página. Subir de versión pide volver a medir contra la anterior y, si cambia la escala, revisar los topes.
- **Seguimiento al cerrar el sprint 4 (2026-10-27):**
  - La primera corrida de la CI, en el runner de GitHub: inicio 2.77 s, catálogo 3.76 s y producto 3.69 s. El runner va unos 150 ms más lento que la máquina de desarrollo; cada pantalla queda unos 250 ms bajo su tope.
  - En `main`, con la mediana de 5 corridas: inicio 2.56 s, catálogo 3.66 s y producto 3.45 s. JavaScript inicial: 179 KB. Los tres quedan por debajo de lo medido al cerrar el sprint 3.
- **Estado:** Aceptada (elegida por el usuario el 2026-10-27).

---

## ADR-F013 — Las páginas piden sus datos en cuanto el router las resuelve

- **Fecha:** 2026-10-27
- **Contexto:** en una SPA, una página pide sus datos al ejecutar su `setup`. En la tienda eso pasa después de montar el layout y el encabezado (búsqueda, cuenta y carrito), unos 240 ms con la CPU 4 veces más lenta, mientras el LCP del catálogo y del producto espera la respuesta de la API (TF-017, ADR-F012). En el sprint 1 se probó pedir los datos en un middleware y se descartó: ese código va en la entrada y el FCP subió unos 150 ms. Cuando el router llega a `beforeResolve`, el chunk de la página ya está descargado y evaluado.
- **Decisión:**
  - Una página puede declarar `prefetch(route)` con `defineOptions`. `app/plugins/04.page-prefetch.ts` lo llama en `beforeResolve`, en la primera carga y en cada navegación, dentro del contexto de Nuxt.
  - `prefetch` llama a funciones `prefetch*` de su feature, que piden con `prefetchQuery` las mismas lecturas que los `use*` de la página, con las mismas opciones (clave, función y `staleTime`). La página no repite la petición: TanStack Query reutiliza la que está en curso.
  - Solo la declaran las páginas cuyo LCP depende de un dato: catálogo y producto. En el inicio el LCP es el título, y adelantar sus lecturas lo empeoró (2.66 a 2.78 s) porque compiten con el código que pinta ese título.
  - Un error de `prefetch` no se muestra: lo muestra la página al pedir la misma lectura.
- **Alternativas consideradas:** el middleware del sprint 1, con el código en la entrada; agrupar chunks con `codeSplitting` de Rolldown (catálogo 3.56 s, pero 204 KB de JavaScript inicial, sobre el presupuesto); montar el encabezado después de la página (cambia el orden del DOM, que importa al teclado y al lector de pantalla).
- **Consecuencias:**
  - El código de `prefetch` vive en el chunk de la página, no en la entrada.
  - Una lectura nueva de una página con `prefetch` debe pedirse también ahí, o sale tarde. Los tests end-to-end comprueban que el catálogo y el producto piden cada dato una sola vez: si la clave de `prefetch` y la de la página no coinciden, hay dos peticiones y fallan.
  - Al pasar al modo híbrido (ADR-F005), el servidor podrá dar estos datos con el HTML, y `prefetch` no estorba: la caché ya los tiene.
- **Estado:** Aceptada.

## ADR-F014 — La orden recién colocada vive solo en memoria

- **Fecha:** 2026-10-27
- **Contexto:** al colocar la orden, `/checkout/done` necesita el `publicCode`, el total y, para iniciar el pago del invitado, el `cartId` de origen, que prueba que quien paga es quien compró (base-shop ADR-0063). `REQUIREMENTS.md` §5.5 pide pasarlos en memoria, y el código público de un invitado nunca va en la URL (base-shop ADR-0071, `SECURITY.md`). Iniciar el pago lleva `Idempotency-Key` (§4.4).
- **Decisión:**
  - El checkout deja la orden, el `cartId` de origen, el email de contacto del invitado y una llave para el pago en un `useState` (`useCheckoutResult`), sin código en la URL y sin almacenamiento del navegador.
  - `/checkout/done` inicia el pago una vez al montarse con esa llave, y la reutiliza en cada reintento (red, `idempotency-request-in-progress`).
  - Al recargar, sin la orden en memoria, el invitado va a `/order-lookup` (TF-014) y el cliente a sus pedidos, `/account/orders` (TF-013).
- **Alternativas consideradas:** el código en la URL para recuperar la orden al recargar (expone el código del invitado en el historial y en `Referer`); `sessionStorage` (deja el `cartId` de origen en el navegador después de usarlo).
- **Consecuencias:**
  - Recargar `/checkout/done` antes de que el pago se inicie deja la orden sin pago iniciado: se inicia desde la consulta del invitado (TF-014) o desde el detalle del pedido del cliente (TF-013), que usan la misma ruta de la API.
  - Si el cliente llega a `/checkout/done` en otra pestaña, no ve la orden: la ve en su cuenta.
- **Estado:** Aceptada.

---

## ADR-F015 — Los chunks comunes pequeños se copian en las páginas que los usan

- **Fecha:** 2026-10-27
- **Contexto:** Rolldown pone el código que comparten varias páginas en chunks aparte, uno por cada combinación de páginas que lo usan. Cada pantalla nueva que comparte algo con el catálogo le suma archivos pequeños, y Lighthouse simula HTTP/1.1 con 6 conexiones: más archivos en la tanda de la página son más vueltas antes del LCP (ADR-F012). Con TF-013 el catálogo llegó a 3.94 s con un tope de 4.0 s. Se probaron:
  - una página padre `account.vue` con rutas anidadas: partía también el JavaScript inicial; se cambió por el componente `AccountNav`;
  - grupos de `codeSplitting`: arrastran sus dependencias (sprint 3) o parten aún más (16 archivos en la tanda);
  - quitar el código compartido de Mis pedidos: cada pieza quitada dejaba otra separada, y duplicar código a mano va contra ADR-F009.
- **Decisión:**
  - El build del navegador activa `codeSplitting.experimentalInlineCommonChunks` de Rolldown con `maxSize` de 32 KB (`nuxt.config.ts`, `vite.$client`). Un chunk común de menos de 32 KB sin minificar se copia como función en cada chunk que lo usa, y un registro del runtime garantiza que se ejecuta una sola vez y con un solo estado. Los chunks con estilos se excluyen, como hace Vite.
  - La opción enciende `strictExecutionOrder` y pide `preserveEntrySignatures: false`, que en una SPA no cambia nada porque la entrada no exporta.
  - Solo en el build del navegador: en el del servidor rompía el prerender del HTML vacío.
- **Resultados** (medidos como en ADR-F012, contra `main` en la misma máquina):
  - LCP: inicio de 2.87 a 2.55 s, catálogo de 3.93 a 3.62 s, producto de 3.60 a 3.51 s. La tanda del catálogo pasa de 15 archivos a 4.
  - JavaScript inicial: de 172.7 a 179.2 KB (de 17 archivos a 9), dentro de los 200 KB.
  - Todo el JavaScript del build, sumado: de 333 a 511 KB comprimido, por las copias. Cada página descarga lo mismo que antes (el catálogo, 57 KB), pero al navegar se puede volver a bajar una copia de algo que ya se ejecutó.
  - Se probaron 4 KB (peor que sin la opción), 16 KB, 64 KB (igual que 32 KB, con más copias) y sin límite (3.2 MB de build).
- **Alternativas consideradas:** las de arriba; aceptar el margen de 60 ms (la CI de TF-015 fallaría por ruido).
- **Consecuencias:**
  - La opción es experimental: una versión nueva de Rolldown o de Vite puede cambiarla o quitarla. Los e2e y el presupuesto de la CI lo detectan. Para volver atrás basta con quitar el bloque de `nuxt.config.ts`.
  - Un archivo que se cargue por su URL, fuera del grafo del build, podría saltarse el registro. La tienda no lo hace.
  - En producción con HTTP/2 (PF-09) el número de archivos importa menos: al decidir el hosting se vuelve a medir con y sin la opción.
- **Estado:** Aceptada.
