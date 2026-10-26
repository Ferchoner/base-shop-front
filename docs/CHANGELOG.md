# CHANGELOG

> Formato copiado de `docs/CHANGELOG.md` de base-shop (ADR-F001). El de la API está en `docs/api/CHANGELOG.md`.

## Unreleased

- Documentación de la API resincronizada con base-shop 1.8.0 (tag `v1.8.0`, commit `8bde9da`). La API tiene ahora una URL por frontend para los enlaces de sus correos (base-shop ADR-0169), así que `API_GAPS.md` G-08 queda resuelta. El contrato de `/v1` no cambió (`openapi/v1.json` igual) y los tipos generados no cambian.

- TF-004: esqueleto del proyecto y CI completa.
  - Nuxt 4 SPA con Nuxt UI, TanStack Query, Pinia, ofetch, Zod y tipos generados del OpenAPI, en el puerto 3002.
  - Del backoffice (commit `bbcd5af`) se copiaron el cliente HTTP, Problem Details, dinero y fechas, la configuración de ESLint, Vitest y Playwright, y sus tests, cada archivo con su origen.
  - Inicio provisional que comprueba la conexión con la API, y página de error.
  - CI: el job `Pipeline` suma instalación, lint, formato, tipos del contrato al día, typecheck, tests, auditoría, build y e2e con axe.
  - Auditoría con excepciones revisadas (ADR-F011, aprobada): `node-forge`, que solo usa el servidor de desarrollo y no tiene versión corregida.

- TF-003: requisitos de la tienda pública, aprobados por el usuario.
  - `REQUIREMENTS.md` detalla cada pantalla con su ruta del frontend, las rutas de la API, estados, errores por `type` y criterios de aceptación, además de errores, precios, idempotencia, carrito y accesibilidad comunes a todas.
  - Navegadores soportados y presupuesto de rendimiento.
  - Tareas de pantallas TF-006 a TF-016 y cuatro sprints planeados en `SPRINT.md`.
  - `API_GAPS.md`: nueva G-11 (instrucciones de pago del invitado solo con el carrito de origen).

- TF-002 (ADR-F005 a ADR-F010): decisiones del stack.
  - Nuxt 4 + Vue 3 como SPA, igual que el backoffice base-ecomm-admin; el modo híbrido se valora con el hosting (ADR-F005, aceptada).
  - Aprobadas por el usuario: sesión en el navegador sin servidor intermedio (ADR-F006), librerías del backoffice (ADR-F007), tests y calidad (ADR-F008), organización por features con código copiado del backoffice (ADR-F009) y entorno local en el puerto 3002 (ADR-F010).
  - `API_GAPS.md`: G-07 resuelta por ADR-F006; nuevas G-08 (una sola URL de frontend para los correos), G-09 (renovación perdida) y G-10 (límite por IP sin excepción para un servidor del frontend).

- TF-001 (ADR-F001 a ADR-F004): reglas y contexto para IAs heredados de base-shop.
  - `CLAUDE.md`, `docs/AI_WORKFLOW.md`, `docs/TEAM_GUIDE.md` y `docs/DEVELOPMENT_GUIDE.md` adaptados al frontend, con su origen.
  - Documentación de la API 1.7.0 copiada en `docs/api/`, con su origen en `docs/api/README.md` y `scripts/sync-api-docs.sh` para resincronizarla.
  - Documentos del proyecto: `PROJECT`, `REQUIREMENTS`, `ARCHITECTURE`, `SECURITY`, `DECISIONS`, `TASKS`, `PROGRESS`, `SPRINT` y `API_GAPS`.
  - Configuración copiada de la API: `.editorconfig`, `.gitattributes`, `.prettierrc`, `.npmrc`, `.nvmrc`, revisión de mensajes de commit, escaneo de secretos con gitleaks y ruleset de `main`; CI con los jobs `Pipeline` y `Commit messages`, y Dependabot.
