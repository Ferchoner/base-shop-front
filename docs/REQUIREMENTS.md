# REQUIREMENTS — Tienda pública

> Estructura inspirada en `docs/REQUIREMENTS.md` de base-shop (ADR-F001). Los casos de uso, estados, errores y reglas de negocio son los de la API: `docs/api/REQUIREMENTS.md` y `docs/api/BUSINESS_RULES.md`. Este documento dice qué pantallas los cubren y cómo se comportan en el navegador.

**Estado:** borrador. Se completa en TF-003 y se aprueba antes de implementar pantallas.

## 1. Actores

Visitante, cliente invitado y cliente registrado, como en `docs/api/REQUIREMENTS.md` §1. El staff queda fuera del alcance inicial (`PROJECT.md` §3).

## 2. Pantallas y casos de uso

Mapa inicial; cada pantalla se detalla en TF-003 con sus rutas de la API, estados vacíos, errores por `type` y criterios de aceptación.

| Pantalla | Casos de uso de la API | Rutas principales |
|---|---|---|
| Inicio y listado del catálogo | UC-CAT-01, UC-CAT-03 | `GET /v1/catalog/products`, `GET /v1/catalog/categories`, `GET /v1/catalog/brands` |
| Detalle de producto | UC-CAT-02 | `GET /v1/catalog/products/{slug}` |
| Carrito | UC-CRT-01 a 06 | `/v1/carts/{cartId}…` (invitado), `/v1/me/cart…` (cliente), `POST /v1/me/cart/merge` |
| Checkout (invitado y cliente) | UC-IAM-22, UC-ORD-01, UC-ORD-02, UC-PRM-04, UC-PRM-05, UC-PAY-01 | `/v1/geo/…`, `POST /v1/checkout/quote`, `POST /v1/me/checkout/quote`, `POST /v1/orders`, `POST /v1/me/orders`, pagos de §16.2 |
| Confirmación de la orden e instrucciones de pago | UC-PAY-01 | `action` de la respuesta de iniciar pago |
| Registro, verificación y reenvío | UC-IAM-01 a 03 | `/v1/auth/register`, `/v1/auth/email-verification/…` |
| Inicio de sesión, renovación y cierre | UC-IAM-04 a 06 | `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout` |
| Recuperación de contraseña | UC-IAM-07, 08 | `/v1/auth/password-reset/…` |
| Mi cuenta: datos, contraseña, email y direcciones | UC-IAM-09 a 11 | `/v1/me…` |
| Mis pedidos y detalle | UC-ORD-03, UC-CRT-09 | `/v1/me/orders…`, `POST /v1/me/orders/{publicCode}/reorder` |
| Pedido de invitado y enlace de acceso | UC-ORD-04, UC-ORD-05, UC-CRT-09 | `POST /v1/orders/lookup`, `POST /v1/orders/access-links`, `POST /v1/orders/access`, `POST /v1/orders/reorder` |
| Aviso de privacidad | UC-IAM-23 | `GET /v1/privacy/retention-policy` (ver `API_GAPS.md`, G-01) |

Las rutas exactas se toman de `docs/api/API_SPEC.md` al detallar cada pantalla.

## 3. Páginas que exige la API

Los correos de la API enlazan a estas páginas del frontend, sobre `FRONTEND_BASE_URL`, con `?token=…`. Deben existir con esa ruta exacta:

| Página | Para qué | Fuente |
|---|---|---|
| `/verify-email` | Confirmar el email con el token | base-shop ADR-0117 |
| `/reset-password` | Restablecer la contraseña con el token | base-shop ADR-0118 |
| `/order-access` | Abrir los pedidos de invitado con el token | base-shop ADR-0148 |

El token se envía a la API en el cuerpo y se quita de la URL visible después de leerlo, para que no quede en el historial ni en el `Referer`.

## 4. Comportamientos transversales

Derivados del contrato de la API; se detallan en TF-003:

- Errores por `type`, con mensajes en español y el `correlationId` visible en los inesperados.
- Advertencia de consistencia eventual donde aplica (`docs/api/API_SPEC.md` §2.5).
- Reintento con la misma `Idempotency-Key` al colocar la orden y al iniciar el pago.
- Espera con `Retry-After` en 429.
- Orden expirada: el carrito se restaura solo (UC-CRT-08); la interfaz lo explica.

## 5. Requisitos no funcionales

- Accesibilidad: WCAG 2.2 nivel AA.
- Rendimiento: presupuesto por definir (TF-003); la tienda es una SPA (ADR-F005).
- Navegadores soportados: `PENDIENTE DE DECISIÓN` (TF-003).
- Seguridad: `SECURITY.md`.

## 6. Pendientes

- Lo que falta en la API para cubrir estas pantallas: `API_GAPS.md`.
