# base-shop-front

Tienda pública de comercio electrónico sobre la API [base-shop](https://github.com/Ferchoner/base-shop): catálogo, carrito, checkout como invitado o con cuenta, y seguimiento de pedidos.

## Estado

Inicialización (Sprint 0): reglas, documentación, requisitos aprobados y esqueleto del proyecto con su CI. Nuxt 4 SPA con el stack del backoffice [base-ecomm-admin](https://github.com/Ferchoner/base-ecomm-admin) (ADR-F005 a ADR-F010). Las pantallas empiezan en el sprint 1 (`docs/SPRINT.md`). Corre solo en local (ADR-F004). Versión de la API usada: 1.8.0.

## Requisitos

- Node.js 24 (versión fijada en `.nvmrc` y en `engines` de `package.json`).
- npm.
- Docker, para el escaneo de secretos y para levantar la API.
- La API base-shop corriendo en local, con `CORS_ALLOWED_ORIGINS` que incluya el origen del frontend (`docs/DEVELOPMENT_GUIDE.md`).

Instalación y arranque:

```bash
cp .env.example .env   # opcional: los valores por defecto apuntan a la API local
npm ci
npm run dev            # http://localhost:3002
```

| Script | Uso |
|---|---|
| `npm run dev` | Tienda en desarrollo en el puerto 3002 (ADR-F010) |
| `npm run lint`, `npm run format:check` | ESLint y Prettier |
| `npm run typecheck` | TypeScript estricto con `vue-tsc` |
| `npm test` | Tests unitarios y de componentes (Vitest) |
| `npm run build` | Build estático en `.output/public` (`nuxt generate`) |
| `npm run test:e2e` | Playwright con axe sobre el build; requiere `npm run build` antes |
| `npm run audit` | Vulnerabilidades altas y críticas, con las excepciones revisadas de `audit-exceptions.json` (ADR-F011) |
| `npm run api:types` | Regenera los tipos de la API desde `docs/api/openapi/v1.json` |
| `npm run secrets:scan` | gitleaks con Docker sobre lo preparado y todo el historial; antes de cada commit |
| `bash scripts/sync-api-docs.sh <clon de base-shop>` | Actualiza la copia de la documentación de la API en `docs/api/` |

## Documentación

La fuente de verdad del proyecto está en `docs/`:

| Documento | Contenido |
|---|---|
| `PROJECT.md` | Visión, alcance y stack |
| `REQUIREMENTS.md` | Pantallas, casos de uso que cubren y comportamientos |
| `ARCHITECTURE.md` | Arquitectura del frontend |
| `SECURITY.md` | Seguridad en el navegador |
| `DECISIONS.md` | Decisiones del frontend (ADR-Fxxx) |
| `API_GAPS.md` | Lo que el frontend necesita y la API no ofrece |
| `TASKS.md`, `PROGRESS.md` | Plan de trabajo y estado |
| `SPRINT.md` | Sprint actual |
| `CHANGELOG.md` | Cambios registrados |
| `DEVELOPMENT_GUIDE.md` | Flujo de trabajo y convenciones |
| `AI_WORKFLOW.md`, `TEAM_GUIDE.md` | Trabajo con IA y con el equipo |
| `api/` | Copia de la documentación de la API, con su origen en `api/README.md` |

## Flujo de trabajo

GitHub Flow: una rama corta por tarea y pull request hacia `main`, con la CI de GitHub Actions (`.github/workflows/ci.yml`). Las instrucciones para trabajar con Claude Code están en `CLAUDE.md`.
