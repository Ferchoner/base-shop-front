# ARCHITECTURE — Frontend

> Principios copiados de `docs/ARCHITECTURE.md` de base-shop (ADR-F001). La arquitectura interna de la API (NestJS, capas, outbox) no se copió: el frontend solo depende de su contrato (ADR-F002).

## Principios

Iguales a los de la API:

- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión
- SOLID
- Clean Code
- Seguridad por diseño
- Testabilidad
- Modularidad

Propios del frontend:

- La API es la fuente de verdad del negocio: el frontend presenta, guía y valida para ayudar, pero no decide precios, totales, stock ni estados.
- Un solo punto de acceso a la API (cliente tipado, PF-05): las pantallas no arman URLs, encabezados ni manejo de errores por su cuenta.
- Accesibilidad y rendimiento como requisitos, no como mejoras.

## Integración con la API

Fija, sin importar el stack:

- Contrato: `docs/api/API_SPEC.md` y `docs/api/openapi/v1.json` (base-shop 1.7.0).
- Transporte: HTTPS en producción, JSON, `Authorization: Bearer`, sin cookies del lado de la API (base-shop ADR-0023, ADR-0085).
- Errores: Problem Details (RFC 9457), decididos por `type`.
- Lo que la API no ofrece: `API_GAPS.md`.

## Estilo, estructura y renderizado

`PENDIENTE DE DECISIÓN` (PF-01 a PF-05, TF-002):

- framework y modo de renderizado (servidor, estático o cliente), que decide también el SEO del catálogo;
- si existe un servidor propio del frontend (BFF) entre el navegador y la API, que decide cómo se guarda la sesión (PF-02);
- estructura de carpetas, estado del cliente, estilos y componentes;
- generación del cliente de la API desde OpenAPI;
- estrategia de tests (unitarios, componentes, end-to-end contra la API local).

Cada punto se decide con un ADR-F y se documenta aquí.
