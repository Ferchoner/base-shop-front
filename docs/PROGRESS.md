# PROJECT PROGRESS

> Formato copiado de `docs/PROGRESS.md` de base-shop (ADR-F001).

## Current Phase

Inicialización. Reglas, documentación y CI mínima en revisión (TF-001). Siguen las decisiones del stack (TF-002) y los requisitos de la tienda pública (TF-003). Solo entorno local (ADR-F004).

## Completed

- [x] Repositorio creado con licencia Apache-2.0

## In Progress

- TF-001 Reglas y contexto para IAs heredados de base-shop (REVIEW)

## Next

- TF-002 Decisiones del stack
- TF-003 Requisitos de la tienda pública
- TF-004 Esqueleto del proyecto y CI completa
- TF-005 Aplicar el ruleset de `main`

## Blocked

Ninguna tarea todavía. Las brechas de la API que bloquearán pantallas están en `API_GAPS.md` (G-01 y G-03 afectan al checkout; G-07 al inicio de sesión).

## Pending Decisions

| ID | Decisión | Afecta a |
|---|---|---|
| PF-01 | Framework y modo de renderizado (servidor, estático o cliente), incluido el SEO del catálogo, el lint y el optimizador de imágenes (G-02) | TF-002, TF-004 |
| PF-02 | Sesión en el navegador: dónde se guardan el token de acceso y el refresh token, renovación entre pestañas, BFF o no (G-07, `SECURITY.md`) | TF-002, login |
| PF-03 | Estilos y componentes, con accesibilidad AA | TF-002 |
| PF-04 | Tests: unitarios, componentes y end-to-end contra la API local | TF-002, TF-004 |
| PF-05 | Cliente de la API y generación de tipos desde `docs/api/openapi/v1.json` | TF-002, TF-004 |
| PF-06 | Puerto local y variables de entorno del frontend (la API espera `http://localhost:5173` por defecto en `FRONTEND_BASE_URL`) | TF-004 |
| PF-07 | Dueño del texto y de la versión del aviso de privacidad (G-01), con revisión legal | Registro, checkout de invitado |
| PF-08 | Con qué proveedor se cobra en línea antes de abrir la tienda (G-04), junto con la API | Checkout, salida a producción |
| PF-09 | Hosting, dominio, HTTPS, CSP y encabezados del servidor del frontend, junto con los de la API (base-shop P-05, P-06) | Salida a producción (ADR-F004) |

## Decisiones cerradas

| ID | Resumen |
|---|---|
| ADR-F001 | Reglas y documentación heredadas de base-shop, con identificadores propios con `F` |
| ADR-F002 | Copia exacta de la documentación de la API en `docs/api/`, con origen y script de resincronización |
| ADR-F003 | Git, CI y protección de `main` como en base-shop |
| ADR-F004 | Solo entorno local |

## Notas

- Versión de la API usada: 1.7.0 (`docs/api/README.md`).
