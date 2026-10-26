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
| TF-003 | Requisitos de la tienda pública | DONE | TF-001 | Cada pantalla de `REQUIREMENTS.md` §2 con sus rutas de la API, estados, errores por `type` y criterios de aceptación; navegadores soportados; primer sprint planeado en `SPRINT.md` |
| TF-004 | Esqueleto del proyecto y CI completa | DONE | TF-002 | Proyecto creado con el stack aprobado; `npm run dev` levanta la tienda en local contra la API; job `Pipeline` con instalación, lint y formato, compilación, tests, `npm audit` y build, sin cambiar su nombre; ruleset de `main` aplicado en GitHub |
| TF-005 | Aplicar el ruleset de `main` | DONE | TF-001 fusionada | `.github/rulesets/main.json` aplicado por un administrador del repositorio; `main` exige `Pipeline` y `Commit messages` |

## Pantallas

Detalle de cada pantalla en `REQUIREMENTS.md` (§ de la columna "Criterios"). Toda tarea de pantalla incluye tests de componentes con la API simulada, una prueba end-to-end con axe sin violaciones graves ni críticas (ADR-F008) y los estados de carga, vacío y error que lista su sección.

| ID | Tarea | Estado | Depende de | Criterios de aceptación |
|---|---|---|---|---|
| TF-006 | Base de la aplicación: encabezado, pie, página 404, cliente de la API con tipos generados del OpenAPI y manejo de errores por `type` | TODO | TF-004 | `REQUIREMENTS.md` §4.1, §4.2, §4.6 y §5.15 |
| TF-007 | Inicio y catálogo con búsqueda, filtros, orden y paginación | TODO | TF-006 | `REQUIREMENTS.md` §5.1 y §5.2 |
| TF-008 | Detalle de producto con selector de variantes | TODO | TF-006 | `REQUIREMENTS.md` §5.3 |
| TF-009 | Carrito de invitado | TODO | TF-008 | `REQUIREMENTS.md` §4.5 y §5.4 (rutas de invitado) |
| TF-010 | Sesión: inicio y cierre, renovación entre pestañas, carrito del cliente y fusión | TODO | TF-009 | `REQUIREMENTS.md` §4.5, §5.4 (rutas de cliente) y §5.8; ADR-F006 |
| TF-011 | Registro, verificación de email y recuperación de contraseña | TODO | TF-010 | `REQUIREMENTS.md` §5.7 y §5.9. Con la API 1.8.0 o posterior, que envía estos enlaces a la tienda (G-08 resuelta) |
| TF-012 | Checkout de invitado y de cliente, e inicio del pago | TODO | TF-010 | `REQUIREMENTS.md` §4.3, §4.4, §5.5 y §5.6. Versión del aviso de privacidad por variable mientras G-01 siga abierta; sin pago manual habilitado, el mensaje de §5.6 (G-03) |
| TF-013 | Mi cuenta, direcciones y mis pedidos | TODO | TF-012 | `REQUIREMENTS.md` §5.10 a §5.12 |
| TF-014 | Pedidos de invitado: consulta, enlace de acceso y recompra | TODO | TF-012 | `REQUIREMENTS.md` §5.13 |
| TF-015 | Presupuesto de rendimiento en la CI | TODO | TF-007 | Lighthouse en la CI contra el build con la API simulada, que falla si se pasa el presupuesto de `REQUIREMENTS.md` §6.2 (salvo el LCP con imágenes mientras G-02 siga abierta) |
| TF-016 | Aviso de privacidad | BLOCKED | TF-006 | `REQUIREMENTS.md` §5.14. Bloqueada por G-01 y PF-07: falta el texto legal y su dueño |
