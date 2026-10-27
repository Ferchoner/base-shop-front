# PROJECT PROGRESS

> Formato copiado de `docs/PROGRESS.md` de base-shop (ADR-F001).

## Current Phase

Inicialización. Reglas, documentación y CI mínima hechas (TF-001). Stack decidido (TF-002): Nuxt 4 SPA y lo demás como el backoffice (ADR-F005 a ADR-F010). Requisitos de la tienda pública aprobados (TF-003), con cuatro sprints de pantallas planeados. Esqueleto del proyecto y CI completa (TF-004) y `main` protegida (TF-005). Sprint 0 cerrado. Sprint 1 de pantallas cerrado: base de la app (TF-006), inicio y catálogo (TF-007), detalle de producto (TF-008) y carrito de invitado (TF-009), con el presupuesto de rendimiento medido y los topes de LCP de ADR-F012. Sprint 2 cerrado: sesión del cliente y carrito del cliente con fusión (TF-010), y registro, verificación de email y recuperación de contraseña (TF-011), con el catálogo dentro de su tope de LCP tras descargar las páginas al interactuar. Sprint 3 cerrado: las páginas piden sus datos al resolver la ruta (TF-017, ADR-F013), invitado y cliente colocan una orden y reciben las instrucciones de pago (TF-012, ADR-F014) y el invitado consulta sus pedidos y vuelve a comprar (TF-014), con el presupuesto medido y dentro de los topes de ADR-F012. Sprint 4 en curso: Mi cuenta, la libreta de direcciones y mis pedidos (TF-013). Solo entorno local (ADR-F004).

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
- [x] TF-009 Carrito de invitado con contador en el encabezado (2026-10-27)
- [x] Sprint 1 cerrado (2026-10-27)
- [x] TF-010 Sesión del cliente, carrito del cliente y fusión del carrito de invitado (2026-10-27)
- [x] TF-011 Registro, verificación de email y recuperación de contraseña (2026-10-27)
- [x] Sprint 2 cerrado (2026-10-27)
- [x] TF-017 Peticiones de la página al resolver la ruta: catálogo y producto bajo su LCP del sprint 1 (2026-10-27)
- [x] TF-012 Checkout de invitado y de cliente, e inicio del pago (2026-10-27)
- [x] TF-014 Pedidos de invitado: consulta, enlace de acceso y recompra (2026-10-27)
- [x] Sprint 3 cerrado (2026-10-27)
- [x] TF-013 Mi cuenta, direcciones y mis pedidos (2026-10-27)

## In Progress

Ninguna.

## Next

- Sprint 4: TF-015 (y TF-016 si G-01 se resolvió), y el cierre del sprint con el presupuesto medido

## Blocked

- TF-016 Aviso de privacidad: G-01 y PF-07.

Otras brechas de la API que afectan pantallas, en `API_GAPS.md`: G-01 y G-03 afectan al checkout (TF-012); G-11 y G-13, a los pedidos (TF-013, TF-014).

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
| ADR-F012 | LCP de 2.5 s como meta de producción y topes locales contra regresiones |
| ADR-F013 | Las páginas piden sus datos en cuanto el router las resuelve |
| ADR-F014 | La orden recién colocada vive solo en memoria |

## Notas

- Versión de la API usada: 1.8.0 (`docs/api/README.md`).
