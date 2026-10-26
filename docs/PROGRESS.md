# PROJECT PROGRESS

> Formato copiado de `docs/PROGRESS.md` de base-shop (ADR-F001).

## Current Phase

Inicialización. Reglas, documentación y CI mínima hechas (TF-001). Stack decidido (TF-002): Nuxt 4 SPA y lo demás como el backoffice (ADR-F005 a ADR-F010). Requisitos de la tienda pública aprobados (TF-003), con cuatro sprints de pantallas planeados. Esqueleto del proyecto y CI completa (TF-004) y `main` protegida (TF-005). Sprint 0 cerrado. Sprint 1 de pantallas en curso: base de la app (TF-006) inicio y catálogo (TF-007) y detalle de producto (TF-008) hechos. Solo entorno local (ADR-F004).

## Completed

- [x] Repositorio creado con licencia Apache-2.0
- [x] TF-001 Reglas y contexto para IAs heredados de base-shop (2026-10-26)
- [x] TF-002 Decisiones del stack (2026-10-26)
- [x] TF-003 Requisitos de la tienda pública (2026-10-26)
- [x] TF-004 Esqueleto del proyecto y CI completa, con prueba de humo contra la API 1.8.0 local hecha por el usuario (2026-10-26)
- [x] Sprint 0 cerrado (2026-10-26)
- [x] TF-005 Ruleset de `main` aplicado por el usuario (2026-10-26)
- [x] TF-006 Base de la app: encabezado, pie, errores por `type`, precios y foco al cambiar de pantalla (2026-10-26)
- [x] TF-007 Inicio y catálogo con búsqueda, filtros, orden y paginación en la URL (2026-10-26)
- [x] TF-008 Detalle de producto con galería y selector de variantes (2026-10-26)

## In Progress

- Sprint 1: TF-009.

## Next

- TF-009 Carrito de invitado

## Blocked

- TF-016 Aviso de privacidad: G-01 y PF-07.

Otras brechas de la API que afectan pantallas, en `API_GAPS.md`: G-01 y G-03 afectan al checkout (TF-012).

## Pending Decisions

| ID | Decisión | Afecta a |
|---|---|---|
| PF-07 | Dueño del texto y de la versión del aviso de privacidad (G-01), con revisión legal | Registro, checkout de invitado |
| PF-08 | Con qué proveedor se cobra en línea antes de abrir la tienda (G-04), junto con la API | Checkout, salida a producción |
| PF-09 | Hosting, dominio, HTTPS, CSP y encabezados del servidor del frontend, junto con los de la API (base-shop P-05, P-06); con él, si el catálogo pasa a modo híbrido (ADR-F005, G-10) y cómo se redimensionan las imágenes (G-02) | Salida a producción (ADR-F004) |

## Decisiones cerradas

| ID | Resumen |
|---|---|
| ADR-F001 | Reglas y documentación heredadas de base-shop, con identificadores propios con `F` |
| ADR-F002 | Copia exacta de la documentación de la API en `docs/api/`, con origen y script de resincronización |
| ADR-F003 | Git, CI y protección de `main` como en base-shop |
| ADR-F004 | Solo entorno local |
| ADR-F005 | Nuxt 4 como SPA, igual que el backoffice; el modo híbrido se valora con el hosting (cierra PF-01) |
| ADR-F006 | Sesión en el navegador sin servidor intermedio, como el backoffice (cierra PF-02) |
| ADR-F007 | Librerías del backoffice: Nuxt UI, TanStack Query, Pinia, ofetch, openapi-typescript, Zod (cierra PF-03 y PF-05) |
| ADR-F008 | Vitest + MSW, Playwright con axe, ESLint + Prettier + vue-tsc (cierra PF-04) |
| ADR-F009 | Organización por features con código copiado del backoffice |
| ADR-F010 | Puerto 3002 y variables públicas (cierra PF-06) |
| ADR-F011 | Auditoría de dependencias con excepciones revisadas que vencen |

## Notas

- Versión de la API usada: 1.8.0 (`docs/api/README.md`).
