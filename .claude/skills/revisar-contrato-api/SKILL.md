---
name: revisar-contrato-api
description: Revisa la compatibilidad del cambio con el contrato de API fijado en este repositorio.
disable-model-invocation: true
---

Flujo o diff: $ARGUMENTS

1. Identifica la operación y su referencia en docs/api/API_SPEC.md y docs/api/openapi/v1.json, con origen fijado en docs/api/README.md (API 1.8.0).
2. Compara método, ruta, petición, respuesta y errores documentados con la implementación. Comprueba permisos, idempotencia, paginación y concurrencia cuando apliquen.
3. Sigue la llamada desde app/shared/api/client.ts o el módulo que la consume. Usa scripts/sync-api-docs.sh para una sincronización autorizada y registra faltantes en docs/API_GAPS.md. Para cambios de contrato ejecuta npm run api:types y revisa el diff de app/shared/api/generated según CI. Añade build y E2E según el flujo.
4. Reporta cada diferencia con evidencia y registra las comprobaciones ejecutadas y pendientes.
