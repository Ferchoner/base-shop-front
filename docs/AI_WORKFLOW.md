# AI WORKFLOW

> Copiado de `docs/AI_WORKFLOW.md` de base-shop (commit `7af0f1d`) y adaptado al frontend (ADR-F001). Las secciones "Regla", "Ciclo", "Sesiones" y "Cambios" son iguales; "Edición y commits", "Contexto" y "Cambios que tocan la API" se adaptaron o son nuevas.

## Regla

La IA trabaja por tareas acotadas, no por instrucciones ambiguas de "construir todo".

## Ciclo

ANALIZAR
→ PLANIFICAR
→ IMPLEMENTAR
→ PROBAR
→ REVISAR
→ DOCUMENTAR
→ CHECKPOINT GIT

## Sesiones

Cada nueva sesión debe comenzar leyendo `CLAUDE.md` y el estado relevante del proyecto (`docs/PROGRESS.md`, `docs/TASKS.md`).

## Cambios

Si una tarea revela una nueva decisión importante:

1. detener la implementación relacionada si es necesario;
2. explicar la decisión;
3. registrar ADR (ADR-Fxxx en `docs/DECISIONS.md`);
4. obtener aprobación humana;
5. continuar.

## Cambios que tocan la API

El frontend no cambia la API ni su documentación desde este repositorio.

1. Si una pantalla necesita un dato o una operación que el contrato (`docs/api/API_SPEC.md`) no ofrece, se registra en `docs/API_GAPS.md` con su impacto y una propuesta, y se avisa al usuario.
2. Mientras no se resuelva, la tarea del frontend queda BLOCKED o se acota a lo que la API sí ofrece. No se simula en el frontend una regla que le toca a la API (por ejemplo, calcular el envío gratis con un umbral escrito en el código).
3. El cambio se hace en base-shop con su propio flujo (su `CLAUDE.md`, ADR y versión). Al publicarse, se resincroniza `docs/api/` con `scripts/sync-api-docs.sh` y la brecha se cierra en `docs/API_GAPS.md`.

## Edición y commits

- Los cambios de varias líneas se hacen con edición directa o con scripts guardados en archivo. Un heredoc de shell sin comillas cambia secuencias como `\n` y `\d`; si hace falta uno, va entre comillas (`<<'EOF'`).
- Antes de cada commit se comprueba el código de salida de `npm run secrets:scan`, que necesita Docker en marcha. No se pone detrás de una tubería que esconda su error.
- `docs/api/` no se edita a mano (ADR-F002).

## Contexto

No sobrecargar una sesión con documentación irrelevante. Leer primero archivos directamente relacionados con la tarea. `docs/api/DECISIONS.md` y `docs/api/API_SPEC.md` son largos: buscar la sección o el ADR citado en lugar de leerlos completos.
