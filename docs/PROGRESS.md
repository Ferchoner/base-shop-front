# PROJECT PROGRESS

> Formato copiado de `docs/PROGRESS.md` de base-shop (ADR-F001).

## Current Phase

Inicialización. Reglas, documentación y CI mínima hechas (TF-001). Framework decidido: Nuxt 4 SPA (ADR-F005); el resto del stack propuesto en ADR-F006 a ADR-F010, en revisión (TF-002). Siguen los requisitos de la tienda pública (TF-003). Solo entorno local (ADR-F004).

## Completed

- [x] Repositorio creado con licencia Apache-2.0
- [x] TF-001 Reglas y contexto para IAs heredados de base-shop (2026-10-26)

## In Progress

- TF-002 Decisiones del stack (REVIEW: ADR-F006 a ADR-F010 esperan aprobación)

## Next

- TF-003 Requisitos de la tienda pública
- TF-004 Esqueleto del proyecto y CI completa
- TF-005 Aplicar el ruleset de `main`

## Blocked

Ninguna tarea todavía. Las brechas de la API que bloquearán pantallas están en `API_GAPS.md`: G-01 y G-03 afectan al checkout, y G-08 a la verificación de email y la recuperación de contraseña.

## Pending Decisions

| ID | Decisión | Afecta a |
|---|---|---|
| PF-02 | Sesión en el navegador. Propuesta en ADR-F006 | TF-002, login |
| PF-03 | Estilos y componentes. Propuesta en ADR-F007 | TF-002 |
| PF-04 | Tests y calidad. Propuesta en ADR-F008 | TF-002, TF-004 |
| PF-05 | Cliente de la API y tipos. Propuesta en ADR-F007 y ADR-F009 | TF-002, TF-004 |
| PF-06 | Puerto local y variables. Propuesta en ADR-F010 | TF-004 |
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

## Notas

- Versión de la API usada: 1.7.0 (`docs/api/README.md`).
