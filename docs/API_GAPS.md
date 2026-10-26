# API GAPS — Lo que el frontend necesita y la API no ofrece

Registro de lo que la tienda pública necesita de la API base-shop y que su contrato (`docs/api/API_SPEC.md`, versión 1.7.0) no cubre o cubre a medias. Cada brecha se comunica al usuario y se resuelve en base-shop con su propio flujo; el frontend no la simula (`AI_WORKFLOW.md`, "Cambios que tocan la API").

## Estados

- ABIERTA: detectada y comunicada, sin decisión.
- DECIDIDA: hay decisión (en la API o en el frontend) y falta implementarla.
- RESUELTA: la API publicó el cambio y `docs/api/` ya está sincronizada, o se decidió que no hace falta.

## Brechas

| ID | Brecha | Impacto en la tienda | Propuesta | Prioridad | Estado |
|---|---|---|---|---|---|
| G-01 | **Aviso de privacidad sin dueño en la API.** El registro (`POST /v1/auth/register`) y el checkout de invitado (`POST /v1/orders`) exigen `privacyNoticeVersion`, pero la API acepta cualquier texto de 1 a 50 caracteres: no publica el texto del aviso ni cuál es su versión vigente, y no comprueba la versión recibida (base-shop ADR-0067). Solo publica los plazos de conservación (`GET /v1/privacy/retention-policy`) | La tienda tiene que mostrar el aviso y enviar su versión. Si cada cliente inventa la versión, la constancia legal de qué aceptó el comprador queda en manos del frontend | (a) La API publica el aviso vigente (texto o URL y versión) y rechaza versiones que no existen; o (b) el frontend es el dueño del texto y de la versión, con un ADR-F que lo diga. Requiere revisión legal (base-shop `PROJECT.md` §9) | Alta: bloquea registro y checkout de invitado | ABIERTA |
| G-02 | **Imágenes solo en tamaño original.** La API guarda y sirve cada imagen tal como se subió, hasta 5 MB, sin miniaturas ni tamaños derivados, y sin quitar metadatos EXIF (base-shop ADR-0024, ADR-0121) | El listado del catálogo descargaría imágenes completas por cada tarjeta: lento en teléfonos y costoso en datos | (a) La API genera tamaños derivados (miniatura, tarjeta, detalle) al subir; o (b) el frontend usa un optimizador de imágenes del framework o un CDN que redimensione (PF-01). (b) basta para el entorno local; (a) conviene antes de producción | Media | ABIERTA |
| G-03 | **Métodos de pago no consultables públicamente.** Hoy solo existe el pago manual en tienda, y solo si un superadministrador lo habilitó (base-shop ADR-0162). La configuración (`GET /v1/admin/payment-settings`) es solo para el staff; un cliente que intenta pagar con el pago manual apagado recibe 400 `validation-error` | La tienda no puede saber antes del checkout si hay forma de pagar. El comprador podría colocar la orden, apartar stock y descubrir después que no puede pagarla | Ruta pública de solo lectura con los proveedores habilitados (por ejemplo, `GET /v1/payments/providers`) | Alta: afecta al checkout | ABIERTA |
| G-04 | **Sin pago en línea.** El único pago real es en la tienda física (`action.type: PAY_IN_STORE`); PayPal está semiimplementado y fuera del MVP, y Mercado Pago y Stripe están pospuestos (base-shop ADR-0040, ADR-0158, T-191 a T-193) | La compra en línea termina con instrucciones para pagar en la tienda. Es suficiente para el entorno local, no para vender en línea | Decisión de negocio: con qué proveedor cobrar antes de abrir la tienda. El frontend se diseña con `action.type` extensible (`REDIRECT` llegará con PayPal) | Media: no bloquea el desarrollo local | ABIERTA |
| G-05 | **Datos del envío no públicos.** El costo fijo, el monto para envío gratis y el plazo de entrega estimado solo los ve el staff (`GET /v1/admin/shipping/method`). El cliente ve el costo hasta cotizar el checkout (`CheckoutQuote`) | La tienda no puede mostrar "Envío gratis desde $1,500" ni el plazo estimado en el producto o el carrito sin escribir esos valores en el código, que dejarían de coincidir cuando el administrador los cambie | Ruta pública de solo lectura con `flatFee`, `freeShippingThreshold` y el plazo (por ejemplo, `GET /v1/shipping/method`) | Baja | ABIERTA |
| G-06 | **Datos de la tienda no públicos.** Nombre, dirección y teléfono de la tienda existen como configuración de la API, pero solo el staff los consulta (`GET /v1/admin/store-profile`, base-shop ADR-0163) | El pie de página, el contacto y las instrucciones de pago en tienda ("dónde pagar") necesitan la dirección de la tienda física | Ruta pública con los datos que la tienda quiere mostrar; o configuración propia del frontend, con un ADR-F | Baja | ABIERTA |
| G-07 | **Sesión en el navegador sin cookies.** La API entrega el token de acceso y el refresh token en el cuerpo, sin cookies, a propósito (base-shop ADR-0023); `docs/api/SECURITY.md` dice que si se usan cookies hay que revisar CSRF | Guardar un refresh token de 7 días en `localStorage` lo expone a cualquier XSS. No es una carencia de la API, pero obliga a decidir en el frontend | Lo decide el frontend en PF-02 (por ejemplo, un BFF del propio frontend que guarde el refresh token en una cookie `HttpOnly`, sin cambiar la API). Si se elige otra vía que pida cambios en la API, se registra aquí | Alta: bloquea login | ABIERTA |

## Configuración, no brechas

No piden cambios en la API, solo configurarla para el frontend en local:

- `CORS_ALLOWED_ORIGINS` con el origen del frontend (base-shop ADR-0085).
- `FRONTEND_BASE_URL` con la URL del frontend, y las páginas `/verify-email`, `/reset-password` y `/order-access` en el frontend (base-shop ADR-0056, ADR-0117, ADR-0118, ADR-0148).
- `IMAGE_BASE_URL` para que las URLs de las imágenes apunten a la API local (base-shop ADR-0121).
