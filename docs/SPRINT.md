# SPRINT

> Formato copiado de `docs/SPRINT.md` de base-shop (ADR-F001).

## Sprint actual

Sprint 1 (pantallas): un visitante navega el catálogo, ve un producto y arma un carrito de invitado (TF-006 a TF-009). Empieza cuando el usuario lo indique.

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

### Sprint 0 (inicialización), 2026-10-26

- **Objetivo:** dejar listo el repositorio para construir la tienda pública: reglas para IAs, documentación, decisiones del stack y requisitos.
- **Resultado:** cumplido el mismo día.
  - TF-001: reglas y contexto heredados de base-shop (PR #1).
  - TF-002: stack con Nuxt 4 SPA y lo demás como el backoffice (ADR-F005 a ADR-F010, PR #2).
  - TF-003: requisitos de cada pantalla y cuatro sprints de pantallas (PR #3).
  - TF-004: esqueleto Nuxt con su CI completa, auditoría con excepciones revisadas (ADR-F011) y documentación de la API en 1.8.0 (PR #4). El usuario hizo la prueba de humo contra la API local.
  - TF-005: el usuario aplicó el ruleset de `main` (PR #7).
- **Fuera del sprint:** base-shop 1.8.0 resolvió G-08 (una URL por frontend en los correos).

