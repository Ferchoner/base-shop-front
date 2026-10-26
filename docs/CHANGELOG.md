# CHANGELOG

> Formato copiado de `docs/CHANGELOG.md` de base-shop (ADR-F001). El de la API está en `docs/api/CHANGELOG.md`.

## Unreleased

- TF-002 (ADR-F005 a ADR-F010): decisiones del stack.
  - Nuxt 4 + Vue 3 como SPA, igual que el backoffice base-ecomm-admin; el modo híbrido se valora con el hosting (ADR-F005, aceptada).
  - Propuestas: sesión en el navegador sin servidor intermedio (ADR-F006), librerías del backoffice (ADR-F007), tests y calidad (ADR-F008), organización por features con código copiado del backoffice (ADR-F009) y entorno local en el puerto 3002 (ADR-F010).
  - `API_GAPS.md`: G-07 resuelta por ADR-F006; nuevas G-08 (una sola URL de frontend para los correos), G-09 (renovación perdida) y G-10 (límite por IP sin excepción para un servidor del frontend).

- TF-001 (ADR-F001 a ADR-F004): reglas y contexto para IAs heredados de base-shop.
  - `CLAUDE.md`, `docs/AI_WORKFLOW.md`, `docs/TEAM_GUIDE.md` y `docs/DEVELOPMENT_GUIDE.md` adaptados al frontend, con su origen.
  - Documentación de la API 1.7.0 copiada en `docs/api/`, con su origen en `docs/api/README.md` y `scripts/sync-api-docs.sh` para resincronizarla.
  - Documentos del proyecto: `PROJECT`, `REQUIREMENTS`, `ARCHITECTURE`, `SECURITY`, `DECISIONS`, `TASKS`, `PROGRESS`, `SPRINT` y `API_GAPS`.
  - Configuración copiada de la API: `.editorconfig`, `.gitattributes`, `.prettierrc`, `.npmrc`, `.nvmrc`, revisión de mensajes de commit, escaneo de secretos con gitleaks y ruleset de `main`; CI con los jobs `Pipeline` y `Commit messages`, y Dependabot.
