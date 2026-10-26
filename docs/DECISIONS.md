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
