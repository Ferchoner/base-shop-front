# PROJECT — Tienda pública (frontend)

> Estructura copiada de `docs/PROJECT.md` de base-shop (ADR-F001). El de la API está en `docs/api/PROJECT.md`.

## 1. Visión

Construir la tienda en línea pública que usan los clientes de base-shop: ver el catálogo, armar el carrito, comprar como invitado o con cuenta y seguir sus pedidos.

## 2. Objetivo

Una aplicación web segura, accesible, rápida en teléfonos, mantenible y documentada, que consume la API REST base-shop (`/v1`) sin redefinir sus reglas de negocio.

La API es independiente del frontend (base-shop ADR-0010, ADR-0023): no usa cookies ni supone un framework cliente. Las decisiones propias del navegador (sesión, almacenamiento, renderizado) las toma este repositorio.

## 3. Alcance inicial

Incluido, sobre las rutas públicas y de cliente de la API (los casos de uso UC-xxx son los de `docs/api/REQUIREMENTS.md`):

- Catálogo: listado, búsqueda y filtros, detalle de producto con variantes, categorías y marcas (UC-CAT-01 a 03).
- Carrito de invitado y de cliente, con su fusión al iniciar sesión (UC-CRT-01 a 06).
- Checkout como invitado o como cliente registrado: dirección con el catálogo del INEGI, cotización, cupón, colocar la orden e iniciar el pago (UC-IAM-22, UC-ORD-01 y 02, UC-PRM-04 y 05, UC-PAY-01).
- Cuenta: registro, verificación de email, inicio y cierre de sesión, recuperación y cambio de contraseña, cambio de email, datos personales y direcciones (UC-IAM-01 a 11).
- Pedidos: mis pedidos, consulta de pedido de invitado, enlace de acceso por correo y recompra de órdenes canceladas (UC-ORD-03 a 05, UC-CRT-09).
- Privacidad: aviso de privacidad y plazos de conservación (UC-IAM-23; ver `API_GAPS.md`, G-01).

Fuera del alcance inicial:

- Panel del staff (todo `/v1/admin`): administración de catálogo, precios, inventario, órdenes, envíos, promociones, órdenes de trabajo y venta en la tienda física. Se decide después si es otra aplicación o parte de esta.
- Pago en línea: la API solo tiene el pago en tienda (`API_GAPS.md`, G-04).
- Despliegue: solo entorno local (ADR-F004).
- Aplicación móvil nativa.

El alcance funcional detallado se mantiene en `REQUIREMENTS.md`.

## 4. Stack tecnológico

| Área | Estado | Decisión | Referencia |
|---|---|---|---|
| Lenguaje | Definido | TypeScript en modo estricto sobre Node.js 24, como la API | ADR-F001, base-shop ADR-0025 |
| Gestor de paquetes | Definido | npm, con `package-lock.json` versionado; scripts de instalación negados por defecto | ADR-F003, base-shop ADR-0108 |
| Framework y renderizado | PENDIENTE DE DECISIÓN | — | PF-01 |
| Sesión y tokens en el navegador | PENDIENTE DE DECISIÓN | — | PF-02 |
| Estilos y componentes | PENDIENTE DE DECISIÓN | — | PF-03 |
| Testing | PENDIENTE DE DECISIÓN | — | PF-04 |
| Cliente de la API y tipos | PENDIENTE DE DECISIÓN | Tipos generados desde `docs/api/openapi/v1.json` | PF-05, ADR-F002 |
| Lint y formato | Definido parcialmente | Prettier con la configuración de la API; lint con el stack | ADR-F003, PF-01 |
| CI | Definido | GitHub Actions con los jobs `Pipeline` y `Commit messages`, `main` protegida, GitHub Flow, Dependabot semanal | ADR-F003 |
| Detección de secretos | Definido | gitleaks antes de cada commit y en la CI | ADR-F003 |
| Hosting y CD | Pospuesto | Solo local | ADR-F004 |

## 5. Usuarios del sistema

- Visitante (sin sesión).
- Cliente invitado (compra con email de contacto).
- Cliente registrado (necesita email verificado para comprar, base-shop BR-USR-05).

El staff no usa esta aplicación en el alcance inicial.

## 6. País, moneda, idioma e impuestos

Heredados de la API: México, MXN e IVA del 16% incluido en los precios (base-shop ADR-0026, ADR-0027). Interfaz en español de México. Los importes los calcula la API.

## 7. Versión de la API

| Versión del frontend | Versión de la API probada |
|---|---|
| (sin versión todavía) | 1.7.0 |

## 8. Estado

Fase: inicialización. El repositorio tiene las reglas, la documentación y la CI mínima (TF-001). Siguen las decisiones del stack (TF-002), los requisitos de la tienda pública (TF-003) y el esqueleto del proyecto (TF-004). Ver `TASKS.md` y `PROGRESS.md`.
