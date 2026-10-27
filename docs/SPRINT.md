# SPRINT

> Formato copiado de `docs/SPRINT.md` de base-shop (ADR-F001).

## Sprint actual

Sprint 2 (pantallas): un cliente se registra, verifica su email, inicia sesión y conserva su carrito (TF-010, TF-011). Empezó el 2026-10-27. TF-010 en revisión.

## Próximos sprints

Cada sprint termina en algo que se puede probar de punta a punta contra la API local.

| Sprint | Objetivo | Tareas |
|---|---|---|
| 1 | Un visitante navega el catálogo, ve un producto y arma un carrito de invitado | TF-006, TF-007, TF-008, TF-009 |
| 2 | Un cliente se registra, verifica su email, inicia sesión y conserva su carrito | TF-010, TF-011 |
| 3 | Invitado y cliente colocan una orden y reciben las instrucciones de pago; el invitado consulta su pedido | TF-012, TF-014 |
| 4 | Mi cuenta y mis pedidos; presupuesto de rendimiento en la CI | TF-013, TF-015 (y TF-016 si G-01 se resolvió) |

Criterio de cierre de cada sprint: sus tareas en DONE y el presupuesto de rendimiento medido (`REQUIREMENTS.md` §6.2).

## Historial

### Sprint 1 (pantallas), 2026-10-26 a 2026-10-27

- **Objetivo:** un visitante navega el catálogo, ve un producto y arma un carrito de invitado.
- **Resultado:** cumplido.
  - TF-006: encabezado, pie, página 404, mensajes de error propios y precios (PR #9).
  - TF-007: inicio y catálogo con filtros, orden y paginación en la URL (PR #10).
  - TF-008: detalle de producto con galería y selector de variantes (PR #11).
  - TF-009: carrito de invitado con contador en el encabezado (PR #12).
- **Presupuesto de rendimiento:** medido (`REQUIREMENTS.md` §6.2). El JavaScript inicial ocupa 169 KB comprimido; CLS e interacción quedan dentro del presupuesto.
  - LCP: inicio 2.59 s, catálogo 3.66 s, producto 3.48 s.
  - El LCP pasa de 2.5 s por el arranque de la SPA. El usuario eligió dejar 2.5 s como meta de producción con el modo híbrido y poner topes locales contra regresiones (ADR-F012).
- **Fuera del sprint:** `API_GAPS.md` G-12, una diferencia menor del OpenAPI en el filtro `brand`.

### Sprint 0 (inicialización), 2026-10-26

- **Objetivo:** dejar listo el repositorio para construir la tienda pública: reglas para IAs, documentación, decisiones del stack y requisitos.
- **Resultado:** cumplido el mismo día.
  - TF-001: reglas y contexto heredados de base-shop (PR #1).
  - TF-002: stack con Nuxt 4 SPA y lo demás como el backoffice (ADR-F005 a ADR-F010, PR #2).
  - TF-003: requisitos de cada pantalla y cuatro sprints de pantallas (PR #3).
  - TF-004: esqueleto Nuxt con su CI completa, auditoría con excepciones revisadas (ADR-F011) y documentación de la API en 1.8.0 (PR #4). El usuario hizo la prueba de humo contra la API local.
  - TF-005: el usuario aplicó el ruleset de `main` (PR #7).
- **Fuera del sprint:** base-shop 1.8.0 resolvió G-08 (una URL por frontend en los correos).

