# SPRINT

> Formato copiado de `docs/SPRINT.md` de base-shop (ADR-F001).

## Sprint actual

Sprint 0 (inicialización), desde el 2026-10-26.

- **Objetivo:** dejar listo el repositorio para construir la tienda pública: reglas para IAs, documentación, decisiones del stack y requisitos.
- **Pasos:**
  1. TF-001 Reglas y contexto para IAs heredados de base-shop.
  2. TF-002 Decisiones del stack.
  3. TF-003 Requisitos de la tienda pública.
  4. TF-004 Esqueleto del proyecto y CI completa.
- **Criterio de cierre:** las cuatro tareas en DONE, con el primer sprint de pantallas planeado.

## Avance

- 2026-10-26: TF-001 hecha (PR #1). TF-002 hecha (PR #2): Nuxt 4 SPA (ADR-F005) y el resto del stack como el backoffice (ADR-F006 a ADR-F010, aprobadas el mismo día). TF-003 hecha: pantallas detalladas en `REQUIREMENTS.md` y sprints de pantallas planeados abajo, aprobados el mismo día. TF-004: esqueleto Nuxt con su CI completa fusionado (PR #4), con la documentación de la API resincronizada a 1.8.0; falta la prueba de humo de `npm run dev` contra la API real. TF-005 hecha: el usuario aplicó el ruleset de `main`.

## Próximos sprints

Cada sprint termina en algo que se puede probar de punta a punta contra la API local.

| Sprint | Objetivo | Tareas |
|---|---|---|
| 1 | Un visitante navega el catálogo, ve un producto y arma un carrito de invitado | TF-006, TF-007, TF-008, TF-009 |
| 2 | Un cliente se registra, verifica su email, inicia sesión y conserva su carrito | TF-010, TF-011 |
| 3 | Invitado y cliente colocan una orden y reciben las instrucciones de pago; el invitado consulta su pedido | TF-012, TF-014 |
| 4 | Mi cuenta y mis pedidos; presupuesto de rendimiento en la CI | TF-013, TF-015 (y TF-016 si G-01 se resolvió) |

El sprint 1 empieza al cerrar TF-004 (esqueleto y CI). Criterio de cierre de cada sprint: sus tareas en DONE y el presupuesto de rendimiento medido (`REQUIREMENTS.md` §6.2).

## Historial

Ninguno todavía.
