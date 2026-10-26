# TASKS

> Estados y formato copiados de `docs/TASKS.md` de base-shop (ADR-F001). Las tareas del frontend llevan `TF-`; las de la API (T-xxx) están en base-shop.

## Estados

- TODO
- IN_PROGRESS
- BLOCKED
- REVIEW
- DONE
- DEFERRED

Las decisiones pendientes (PF-xx) están en `PROGRESS.md`. Una tarea marcada BLOCKED indica qué decisión o brecha de la API (`API_GAPS.md`, G-xx) la bloquea. Los casos de uso (UC-xxx) son los de `docs/api/REQUIREMENTS.md`.

## Inicialización

| ID | Tarea | Estado | Depende de | Criterios de aceptación |
|---|---|---|---|---|
| TF-001 | Reglas y contexto para IAs heredados de base-shop | DONE | — | `CLAUDE.md`, `AI_WORKFLOW.md`, `TEAM_GUIDE.md` y `DEVELOPMENT_GUIDE.md` adaptados con su origen; documentación de la API copiada en `docs/api/` con su origen y script de resincronización; documentos de proyecto creados; configuración de Git, CI mínima, ruleset y Dependabot; brechas de la API registradas en `API_GAPS.md` (ADR-F001 a ADR-F004) |
| TF-002 | Decisiones del stack | DONE | TF-001 | PF-01 a PF-06 cerradas con ADR-F aprobados (ADR-F005 a ADR-F010); filas de la tabla de stack de `PROJECT.md` con decisión; convenciones de código en `DEVELOPMENT_GUIDE.md` y estructura en `ARCHITECTURE.md` |
| TF-003 | Requisitos de la tienda pública | IN_PROGRESS | TF-001 | Cada pantalla de `REQUIREMENTS.md` §2 con sus rutas de la API, estados, errores por `type` y criterios de aceptación; navegadores soportados; primer sprint planeado en `SPRINT.md` |
| TF-004 | Esqueleto del proyecto y CI completa | TODO | TF-002 | Proyecto creado con el stack aprobado; `npm run dev` levanta la tienda en local contra la API; job `Pipeline` con instalación, lint y formato, compilación, tests, `npm audit` y build, sin cambiar su nombre; ruleset de `main` aplicado en GitHub |
| TF-005 | Aplicar el ruleset de `main` | TODO | TF-001 fusionada | `.github/rulesets/main.json` aplicado por un administrador del repositorio; `main` exige `Pipeline` y `Commit messages` |
