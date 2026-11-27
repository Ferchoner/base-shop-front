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
| TF-006 | Base de la aplicación: encabezado, pie, página 404, cliente de la API con tipos generados del OpenAPI y manejo de errores por `type` | DONE | TF-004 | `REQUIREMENTS.md` §4.1, §4.2, §4.6 y §5.15. El contador del carrito, la cuenta y el enlace al aviso de privacidad del encabezado y el pie se agregan con TF-009, TF-010 y TF-016 |
| TF-007 | Inicio y catálogo con búsqueda, filtros, orden y paginación | DONE | TF-006 | `REQUIREMENTS.md` §5.1 y §5.2 |
| TF-008 | Detalle de producto con selector de variantes | DONE | TF-006 | `REQUIREMENTS.md` §5.3, salvo la cantidad y el botón de agregar, que van con el carrito en TF-009 |
| TF-009 | Carrito de invitado | DONE | TF-008 | `REQUIREMENTS.md` §4.5 y §5.4 (rutas de invitado), el contador del carrito en el encabezado (§5.15), y la cantidad, "Agregar al carrito" y sus errores en el detalle de producto (§5.3) |
| TF-010 | Sesión: inicio y cierre, renovación entre pestañas, carrito del cliente y fusión | DONE | TF-009 | `REQUIREMENTS.md` §4.5, §5.4 (rutas de cliente) y §5.8; ADR-F006. Con el acceso a la cuenta en el encabezado (§5.15) |
| TF-011 | Registro, verificación de email y recuperación de contraseña | DONE | TF-010 | `REQUIREMENTS.md` §5.7 y §5.9. Con la API 1.8.0 o posterior, que envía estos enlaces a la tienda (G-08 resuelta) |
| TF-012 | Checkout de invitado y de cliente, e inicio del pago | DONE | TF-010, TF-017 | `REQUIREMENTS.md` §4.3, §4.4, §5.5 y §5.6. El botón "Continuar al checkout" del carrito ya lleva a `/checkout`. Versión del aviso de privacidad por variable mientras G-01 siga abierta; sin pago manual habilitado, el mensaje de §5.6 (G-03). La casilla del aviso no enlaza a `/privacy` hasta TF-016, como en el registro. La orden colocada vive en memoria (ADR-F014) |
| TF-013 | Mi cuenta, direcciones y mis pedidos | DONE | TF-012 | `REQUIREMENTS.md` §5.10 a §5.12. Al recargar `/checkout/done`, el cliente llega a `/account/orders` (ADR-F014); el detalle inicia el pago de una orden pendiente y reutiliza `OrderDetail` de TF-014. Tras la recompra se cuentan las variantes omitidas, sin nombrarlas (G-13) |
| TF-014 | Pedidos de invitado: consulta, enlace de acceso y recompra | DONE | TF-012 | `REQUIREMENTS.md` §5.13. `/checkout/done` ya lleva al invitado a `/order-lookup` al recargar (ADR-F014). Tras la recompra se cuentan las variantes omitidas, sin nombrarlas (G-13) |
| TF-015 | Presupuesto de rendimiento en la CI | DONE | TF-007 | Lighthouse en la CI contra el build con la API simulada, que falla si se pasa el presupuesto de `REQUIREMENTS.md` §6.2, con los topes locales de LCP de ADR-F012 (salvo el LCP con imágenes mientras G-02 siga abierta). Antes, recuperar el margen del catálogo que se perdió con TF-013 (elegido por el usuario): chunks comunes copiados en las páginas (ADR-F015) |
| TF-016 | Aviso de privacidad | BLOCKED | TF-006 | `REQUIREMENTS.md` §5.14. Bloqueada por G-01 y PF-07: falta el texto legal y su dueño. Con el enlace al aviso en el pie (§5.15) y junto a la casilla de aceptación del registro (§5.7) |
| TF-017 | Ajuste del reparto de chunks antes del checkout | DONE | TF-011 | ADR-F012 (seguimiento del sprint 2). El LCP del catálogo y del producto vuelve a quedar en o por debajo del medido al cerrar el sprint 1 (3.66 s y 3.48 s), o se documenta por qué no se puede, sin pasar los 200 KB de JavaScript inicial de `REQUIREMENTS.md` §6.2 y medido igual que ahí. Resuelto adelantando las peticiones de la página, no los chunks (ADR-F013): catálogo 3.60 s, producto 3.43 s, 171 KB |

## Herramientas

| ID | Tarea | Estado | Depende de | Criterios de aceptación |
|---|---|---|---|---|
| TF-018 | Agente y skills de Claude Code para implementar, verificar y revisar el contrato de la API | DONE | TF-004 | `.claude/agents/revisor-de-cambios.md` (solo lectura) y las skills `implementar-cambio`, `verificar-cambio` y `revisar-contrato-api` en `.claude/skills/`, que solo se invocan a mano; cada ruta, script de npm y paso de la CI que citan existe; ninguna fija la versión de la API, que se lee de `docs/api/README.md`; `CLAUDE.md` distingue la versión de la que se adaptó (1.7.0) de la vigente |

## Mantenimiento

| ID | Tarea | Estado | Depende de | Criterios de aceptación |
|---|---|---|---|---|
| TF-019 | Vulnerabilidades altas de `node-forge` en la auditoría | DONE | TF-004 | `node-forge` en 1.4.4 o posterior; `npm run audit` sin vulnerabilidades altas ni críticas y sin excepciones que sobren (ADR-F011); el job `Pipeline` pasa |
| TF-020 | `npm run audit` en Windows y fallos de `npm audit` | DONE | TF-019 | `npm run audit` y `node scripts/audit.ts` corren en Windows con el mismo resultado que en la CI; si `npm audit` no arranca, el script muestra el error y no `undefined`; si `npm audit` falla y responde con un error en JSON (sin red, sin lockfile) o sin informe, la auditoría falla y no se da por buena (ADR-F011); un informe de más de 1 MiB no se corta; un mensaje vacío se reemplaza por el código de salida; tests de cómo se lanza en Windows y en Linux y de cada fallo |
| TF-021 | `npm run typecheck` también revisa scripts y tests | DONE | TF-020 | `npm run typecheck` (y el paso de la CI) revisa `scripts/`, `tests/unit/`, `tests/e2e/` y `playwright.config.ts`, cada uno con los tipos de su entorno: Nuxt para los tests unitarios, Node para lo demás; un error de tipos en cualquiera de ellos lo hace fallar; los errores que ya había quedan corregidos sin debilitar los tests |
| TF-022 | `npm run perf:budget` en Windows | TODO | TF-015 | `scripts/perf-budget.ts` lanza Lighthouse sin depender de `node_modules/.bin/lighthouse`, que en Windows es un `.cmd` y falla con `ENOENT` (como en TF-020): por ejemplo, `node` con `node_modules/lighthouse/cli/index.js`; `npm run perf:budget` mide en Windows igual que en la CI; un test cubre cómo se lanza |
| TF-023 | Regresión de LCP con `@nuxt/icon` 2.6.2 o posterior | TODO | TF-015 | Con las dependencias del PR #27, el presupuesto de la CI falla en el inicio (LCP 3020 y 3010 ms, tope 3000). Aislado en local: `@nuxt/icon` 2.6.3 (lo exige `@nuxt/ui` 4.13, `^2.6.2`) parte su runtime en módulos nuevos y carga el componente SVG con `import()`, y el JavaScript inicial pasa de 9 a 14 archivos; con 2.6.1 vuelven los 9 y el LCP del catálogo y del producto queda unos 100 ms sobre `main` en vez de 600. La tienda usa `@nuxt/icon` 2.6.2 o posterior sin pasar los topes de ADR-F012 ni subirlos, con la medición en la CI, o se documenta por qué no se puede; las demás subidas del PR #27 se fusionan aparte |
