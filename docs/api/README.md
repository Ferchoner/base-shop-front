# Documentación de la API (copia)

Esta carpeta es una copia de la documentación de [base-shop](https://github.com/Ferchoner/base-shop), la API que consume el frontend. Se copió para que el frontend no dependa de tener el otro repositorio a mano (ADR-F002).

**No se edita aquí.** Si algo está mal o falta, se corrige en base-shop y se vuelve a copiar con `scripts/sync-api-docs.sh`. Lo que el frontend necesita y la API no ofrece va en `../API_GAPS.md`.

## Origen

| Campo | Valor |
|---|---|
| Repositorio | https://github.com/Ferchoner/base-shop |
| Rama | `main` |
| Commit | `7af0f1d4b3296d718488f04942bc97f51c170fdc` |
| Fecha del commit | 2026-10-17 |
| Versión de la API | 1.7.0 |
| Copiado el | 2026-10-26 |

## Archivos copiados

Copias exactas, sin cambios:

| Archivo aquí | Origen en base-shop | Para qué lo usa el frontend |
|---|---|---|
| `API_SPEC.md` | `docs/API_SPEC.md` | Contrato de cada ruta: request, response, errores, idempotencia, paginación y rate limiting |
| `openapi/v1.json` | `docs/openapi/v1.json` | Documento OpenAPI de `/v1`, comprobado en la CI de la API. Fuente para generar tipos (PF-05) |
| `BUSINESS_RULES.md` | `docs/BUSINESS_RULES.md` | Reglas que la tienda muestra o respeta (BR-xxx) |
| `REQUIREMENTS.md` | `docs/REQUIREMENTS.md` | Casos de uso (UC-xxx), actores, estados y errores |
| `DOMAIN_MODEL.md` | `docs/DOMAIN_MODEL.md` | Contextos, estados de orden, pago y envío, y vocabulario |
| `DECISIONS.md` | `docs/DECISIONS.md` | ADR-0001 a ADR-0168, citados por el contrato y las reglas |
| `SECURITY.md` | `docs/SECURITY.md` | Autenticación, tokens, CORS, rate limiting y datos personales del lado de la API |
| `PROJECT.md` | `docs/PROJECT.md` | Alcance, stack y estado de la API |
| `CHANGELOG.md` | `docs/CHANGELOG.md` | Qué cambió en cada versión de la API, para revisar el impacto al resincronizar |

Los identificadores de estos documentos (ADR-0084, T-140, UC-CAT-01, BR-PRD-11, P-05) son los de la API. Los del frontend llevan `F`: ADR-F001, TF-001, PF-01.

## Archivos que no se copiaron

| Archivo en base-shop | Motivo |
|---|---|
| `docs/DATABASE.md` | Es el esquema interno de PostgreSQL. El frontend solo habla con la API por su contrato; tener las tablas a mano invita a depender de detalles que pueden cambiar sin aviso |
| `docs/ARCHITECTURE.md` | Arquitectura interna de NestJS (módulos, capas, outbox). No aplica al frontend, que tiene la suya en `../ARCHITECTURE.md`. Lo que sí afecta al cliente (consistencia eventual, efectos en segundo plano) está en `API_SPEC.md` §2.5 |
| `docs/DEVELOPMENT_GUIDE.md`, `docs/AI_WORKFLOW.md`, `docs/TEAM_GUIDE.md` | No se copiaron tal cual: se adaptaron al frontend en `../DEVELOPMENT_GUIDE.md`, `../AI_WORKFLOW.md` y `../TEAM_GUIDE.md`, citando su origen |
| `docs/TASKS.md`, `docs/PROGRESS.md`, `docs/SPRINT.md` | Son el plan y el estado del backend; copiados quedarían viejos y confundirían con los del frontend. La versión de la API que se usa queda en la tabla de origen |
| `docs/SECURITY_AUDIT.md` | Auditoría de las rutas del backend contra el OWASP API Top 10. El frontend tendrá la suya |
| `docs/templates/*.csv` | Plantillas de carga masiva del staff; la tienda pública no las usa |
| `.env.example` | Variables del servidor de la API. Las que importan al frontend (`CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL`, `IMAGE_BASE_URL`) se explican en `../DEVELOPMENT_GUIDE.md` |

## Cómo resincronizar

Con un clon de base-shop al día en `main`:

```bash
bash scripts/sync-api-docs.sh ../base-shop
```

El script copia los archivos de la tabla, actualiza la tabla de origen con el commit y la fecha, y muestra el `git diff --stat`. Después:

1. Revisar `CHANGELOG.md` de la API desde la versión anterior y anotar en `../API_GAPS.md` y en `../TASKS.md` lo que afecta al frontend.
2. Regenerar los tipos desde `openapi/v1.json` (cuando exista el cliente de la API, PF-05) y correr los tests.
3. Commit `docs: sync API documentation to base-shop X.Y.Z`.
