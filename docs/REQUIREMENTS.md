# REQUIREMENTS — Tienda pública

> Estructura inspirada en `docs/REQUIREMENTS.md` de base-shop (ADR-F001). Los casos de uso, estados, errores y reglas de negocio son los de la API: `docs/api/REQUIREMENTS.md` y `docs/api/BUSINESS_RULES.md`. Este documento dice qué pantallas los cubren y cómo se comportan en el navegador. Las secciones (§) sin prefijo son de `docs/api/API_SPEC.md`.

**Estado:** aprobado por el usuario el 2026-10-26 (TF-003). Un cambio de alcance o de comportamiento se aprueba de nuevo antes de implementarlo.

## 1. Actores

Visitante, cliente invitado y cliente registrado, como en `docs/api/REQUIREMENTS.md` §1. El staff queda fuera del alcance inicial (`PROJECT.md` §3): una cuenta de staff que inicia sesión en la tienda ve un aviso de que su cuenta no compra en la tienda en línea (E-09) y se le cierra la sesión.

## 2. Mapa de pantallas

Las rutas del frontend van en inglés, como las tres que fija la API (§3), y no llevan datos personales (`SECURITY.md`). Los filtros del catálogo sí van en la URL, para poder compartirla y volver atrás.

| Ruta del frontend | Pantalla | Casos de uso | Detalle |
|---|---|---|---|
| `/` | Inicio | UC-CAT-01, UC-CAT-03 | §5.1 |
| `/products` | Catálogo: listado, búsqueda y filtros | UC-CAT-01, UC-CAT-03 | §5.2 |
| `/products/{slug}` | Detalle de producto | UC-CAT-02 | §5.3 |
| `/cart` | Carrito | UC-CRT-01 a 06 | §5.4 |
| `/checkout` | Checkout de invitado y de cliente | UC-IAM-22, UC-ORD-01, UC-ORD-02, UC-PRM-04, UC-PRM-05, UC-PAY-01 | §5.5 |
| `/checkout/done` | Orden colocada e instrucciones de pago | UC-PAY-01 | §5.6 |
| `/register` | Registro | UC-IAM-01, UC-IAM-03 | §5.7 |
| `/verify-email` | Verificación de email (enlace del correo) | UC-IAM-02, UC-IAM-03 | §5.7 |
| `/login` | Inicio de sesión | UC-IAM-04 a 06, UC-CRT-06 | §5.8 |
| `/forgot-password` | Solicitar recuperación | UC-IAM-07 | §5.9 |
| `/reset-password` | Restablecer contraseña (enlace del correo) | UC-IAM-08 | §5.9 |
| `/account` | Mi cuenta: datos, contraseña y email | UC-IAM-09, UC-IAM-10, rectificación | §5.10 |
| `/account/addresses` | Mis direcciones | UC-IAM-11, UC-IAM-22 | §5.11 |
| `/account/orders` y `/account/orders/{publicCode}` | Mis pedidos y su detalle | UC-ORD-03, UC-CRT-09 | §5.12 |
| `/order-lookup` | Pedido de invitado: consulta y enlace de acceso | UC-ORD-04, UC-ORD-05, UC-CRT-09 | §5.13 |
| `/order-access` | Pedidos de invitado (enlace del correo) | UC-ORD-05 | §5.13 |
| `/privacy` | Aviso de privacidad | UC-IAM-23 | §5.14 |

El código público de la orden de un cliente va en la URL de `/account/orders/{publicCode}`, como en la API (`GET /v1/me/orders/{publicCode}`), porque esa ruta exige sesión. El de un invitado nunca va en la URL (base-shop ADR-0071).

## 3. Páginas que exige la API

Los correos de la API enlazan a estas páginas del frontend, sobre `FRONTEND_BASE_URL`, con `?token=…`. Deben existir con esa ruta exacta:

| Página | Para qué | Fuente |
|---|---|---|
| `/verify-email` | Confirmar el email con el token | base-shop ADR-0117 |
| `/reset-password` | Restablecer la contraseña con el token | base-shop ADR-0118 |
| `/order-access` | Abrir los pedidos de invitado con el token | base-shop ADR-0148 |

El token se envía a la API en el cuerpo y se quita de la URL visible después de leerlo, para que no quede en el historial ni en el `Referer`. Desde base-shop 1.8.0, `FRONTEND_BASE_URL` es la tienda y la recuperación de contraseña del staff va al backoffice (`BACKOFFICE_BASE_URL`, base-shop ADR-0169; `API_GAPS.md`, G-08).

## 4. Comportamientos transversales

### 4.1 Errores

La API responde Problem Details (§6). La tienda decide por `type`, nunca por el texto de `title` o `detail`, y muestra mensajes propios en español.

| `type` | Comportamiento |
|---|---|
| `validation-error`, `password-policy-violation` | Cada entrada de `errors` se muestra junto a su campo; un campo que la pantalla no tiene se muestra arriba del formulario. Los formularios validan antes con las mismas reglas del contrato (Zod, ADR-F007), solo para ayudar: la que cuenta es la de la API |
| `unauthenticated`, `invalid-refresh-token` | Se intenta renovar la sesión una vez (ADR-F006). Si no se puede, se borra la sesión; una pantalla que pide sesión (Mi cuenta, mis pedidos) lleva a `/login` con la ruta de regreso, y una pública sigue sin sesión (TF-010) |
| `staff-cannot-purchase` | Aviso de que las cuentas de staff no compran en la tienda en línea; se cierra la sesión |
| `not-found` | Página o mensaje "no encontrado" propio de cada pantalla |
| `rate-limit-exceeded` | Mensaje con la espera de `Retry-After`; el botón que lo provocó queda deshabilitado hasta entonces, sin reintentos automáticos |
| `internal-error` y errores sin `type` conocido | Mensaje genérico con el `correlationId` visible para soporte, sin detalles técnicos |
| Sin respuesta (red caída o API detenida) | Mensaje de conexión con botón para reintentar; las lecturas reintentan solas una vez (TanStack Query) y las escrituras no |

Los demás `type` se tratan en la pantalla que los recibe (§5).

### 4.2 Precios y totales

- Todo importe se muestra a partir de un `Money` de la API, con formato `es-MX` en pesos e "IVA incluido". La tienda no suma, no descuenta ni calcula IVA o envío (CLAUDE.md, regla 15): el subtotal del carrito sale de `Cart.subtotal` y los totales del checkout, de `CheckoutQuote`.
- `compareAtPrice` se muestra tachado junto al precio cuando no es `null`. El descuento de una promoción solo aparece en la cotización y en la orden (§26.7).

### 4.3 Consistencia eventual

Donde un efecto ocurre en segundo plano (§2.5), la pantalla lo advierte y vuelve a consultar en lugar de suponer el estado:

- después de pedir un correo (verificación, recuperación, enlace de acceso): "El correo puede tardar unos minutos";
- en el detalle de una orden en PENDING_PAYMENT o EXPIRED: "El estado puede tardar unos segundos en actualizarse";
- al volver al carrito después de una orden expirada: sus líneas regresan al carrito (UC-CRT-08).

### 4.4 Idempotencia

Colocar la orden e iniciar el pago llevan `Idempotency-Key` (§4). La tienda genera una llave UUIDv4 por intento y la reutiliza si el mismo intento se reenvía (error de red, `idempotency-request-in-progress`); un cambio en los datos del formulario o en el total esperado genera una llave nueva. La llave vive en memoria, no en almacenamiento del navegador.

### 4.5 Carrito de invitado y sesión

- El `cartId` de invitado es su credencial (base-shop ADR-0059) y se guarda en `localStorage` con una llave propia de la tienda (ADR-F006). El carrito se crea al agregar el primer producto, no al abrir la tienda.
- Si la API responde 404 o un carrito con `status` CHECKED_OUT o MERGED, la tienda olvida ese `cartId` y crea otro al siguiente agregado.
- Al iniciar sesión con un carrito de invitado con líneas, se fusiona con `POST /v1/me/cart/merge` y se olvida el `cartId` (UC-CRT-06). La fusión suma con tope de 30 sin avisar; la tienda dice que el carrito se combinó.
- Al cerrar sesión, el carrito se queda en la cuenta y la tienda empieza sin carrito de invitado.

### 4.6 Accesibilidad

- Toda pantalla se puede usar con teclado y lector de pantalla, con foco visible y orden lógico; al cambiar de ruta, el foco va al título de la página.
- Los errores de formulario se anuncian (`aria-live`) y se asocian a su campo (`aria-describedby`); el foco va al primer campo con error.
- Los cambios del carrito y del total del checkout se anuncian.
- Contraste AA, objetivos táctiles de al menos 24×24 px y sin depender solo del color (por ejemplo, "Agotado" con texto).
- Las pruebas end-to-end corren axe en cada pantalla, sin violaciones graves ni críticas (ADR-F008).

## 5. Pantallas

Cada pantalla lista las rutas de la API que usa, sus estados, los errores propios (además de §4.1) y sus criterios de aceptación.

### 5.1 Inicio (`/`)

- **API:** `GET /v1/catalog/categories` (§11.4); `GET /v1/catalog/products?sort=-publishedAt&pageSize=12` (§11.2).
- **Muestra:** buscador, categorías de primer nivel y los productos más recientes. Sin banners ni productos destacados: la API no tiene ese concepto y no se simula.
- **Estados:** cargando (esqueletos), sin productos ("Pronto tendremos productos") y error de conexión.
- **Criterios:**
  - el buscador lleva a `/products?q=…` y exige de 2 a 100 caracteres, como la API;
  - cada categoría lleva a `/products?category={slug}`;
  - cada tarjeta muestra imagen o un marcador sin imagen, título, marca, `fromPrice` como "Desde $…" (el listado no dice si las variantes tienen precios distintos), `compareAtPrice` y "Agotado" si `available` es `false`.

### 5.2 Catálogo (`/products`)

- **API:** `GET /v1/catalog/products` con `q`, `category`, `brand`, `minPrice`, `maxPrice`, `available`, `sort`, `page`, `pageSize` (§11.2); `GET /v1/catalog/categories` y `GET /v1/catalog/brands` para los filtros (§11.4, §11.5).
- **Muestra:** resultados en tarjetas (como §5.1), total de resultados, filtros, orden y paginación.
- **Estados:** cargando; sin resultados, con la búsqueda y los filtros activos y la opción de quitarlos; error.
- **Errores propios:** `validation-error` con `unknownCategory` o `unknownBrands` (una URL vieja con una categoría o marca que ya no está visible): se quita el filtro y se avisa. `priceRange` y `relevanceNeedsQ` se evitan en el formulario.
- **Criterios:**
  - los filtros, el orden y la página viven en la URL; recargar o compartir la URL muestra lo mismo, y "atrás" regresa al estado anterior;
  - el orden "Relevancia" solo aparece con búsqueda; sin búsqueda, el predeterminado es "Más recientes" (`-publishedAt`);
  - los precios del filtro se escriben en pesos y se envían en centavos;
  - cambiar un filtro regresa a la página 1;
  - `pageSize` fijo de 24;
  - una página mayor que `totalPages` muestra el estado sin resultados con enlace a la página 1.

### 5.3 Detalle de producto (`/products/{slug}`)

- **API:** `GET /v1/catalog/products/{slug}` (§11.3); agregar al carrito (§5.4).
- **Muestra:** galería con `altText`, título, marca, categorías (enlazan al catálogo filtrado), descripción como texto (sin HTML, `SECURITY.md`), selector de opciones según `optionNames`, precio de la variante elegida, `compareAtPrice`, disponibilidad y cantidad.
- **Estados:** cargando; 404 "Producto no disponible", con enlace al catálogo; error.
- **Errores propios al agregar:** `variant-not-sellable` (la variante dejó de venderse: se recarga el producto y se avisa); `validation-error` con `lineQuantity` (pasaría de 30 en el carrito); `cart-line-limit-reached` (100 variantes distintas).
- **Criterios:**
  - con una sola variante no hay selector; con varias, "Agregar al carrito" se habilita al elegir una combinación que existe;
  - las combinaciones que no existen no se pueden elegir y las agotadas se marcan "Agotado" (`available: false`) pero se pueden ver;
  - al elegir una variante con imágenes propias (`variantId`), la galería muestra primero las suyas;
  - la cantidad va de 1 a 30;
  - al agregar, aviso accesible con enlace al carrito y el contador del carrito actualizado con `itemCount`;
  - nunca se muestran existencias: la API no las da (base-shop ADR-0061).

### 5.4 Carrito (`/cart`)

- **API:** invitado: `POST /v1/carts`, `GET /v1/carts/{cartId}`, `POST /v1/carts/{cartId}/lines`, `PATCH` y `DELETE /v1/carts/{cartId}/lines/{variantId}`. Cliente: `GET /v1/me/cart`, `POST /v1/me/cart/lines`, `PATCH` y `DELETE /v1/me/cart/lines/{variantId}` (§14.2).
- **Muestra:** líneas con imagen, producto (enlace), opciones, precio unitario, cantidad, total de la línea; `itemCount` y `subtotal`; botón al checkout.
- **Estados:** cargando; vacío, con enlace al catálogo; con líneas no vendibles (`sellable: false`: "Ya no está disponible", sin precio, solo se puede quitar); con líneas no surtibles (`canFulfill: false`: "No hay suficientes para la cantidad pedida"); error.
- **Errores propios:** `cart-not-active` (se olvida el carrito y se avisa: "Tu carrito ya se usó en una orden"); `variant-not-sellable` al cambiar una cantidad; `validation-error` con `lineQuantity`; 404 de una línea que ya no está (se recarga el carrito).
- **Criterios:**
  - cambiar la cantidad (1 a 30) o quitar una línea actualiza el carrito con la respuesta de la API, sin recalcular en el navegador;
  - el subtotal dice que no incluye envío ni descuentos, que se ven en el checkout;
  - el botón al checkout se deshabilita si no hay líneas vendibles; con líneas no vendibles o no surtibles se puede continuar, y el checkout pide resolverlas (`readyToPlace`);
  - el contador del encabezado refleja `itemCount` en todas las pantallas.

### 5.5 Checkout (`/checkout`)

Una sola página con pasos: contacto (solo invitado), dirección, resumen y confirmación.

- **API:**
  - cotizar: `POST /v1/checkout/quote` con `cartId` (invitado) o `POST /v1/me/checkout/quote` (cliente), con `couponCode` opcional (§15.2);
  - dirección: `GET /v1/geo/states` y `GET /v1/geo/states/{stateCode}/municipalities` (§10); el cliente elige de `GET /v1/me/addresses` o escribe una nueva (§9.14);
  - colocar: `POST /v1/orders` (invitado: `cartId`, `contactEmail`, `shippingAddress`, `expectedTotal`, `privacyNoticeVersion`, `couponCode`) o `POST /v1/me/orders` (cliente: `addressId` o `shippingAddress`, `expectedTotal`, `couponCode`), con `Idempotency-Key` (§15.3, §4.4).
- **Muestra:** líneas de la cotización con su descuento, `subtotal`, `discountTotal` y `promotion.name`, `shippingCost` (o "Gratis"), cuánto falta para `freeShippingThreshold` si no es `null`, `taxTotal` como IVA incluido, `grandTotal` y `estimatedDelivery` en días hábiles desde el pago.
- **Estados:**
  - sin sesión: se ofrece iniciar sesión o seguir como invitado;
  - cliente sin email verificado (`Account.emailVerified: false`): aviso con botón para reenviar la verificación; no se puede colocar la orden (BR-USR-05);
  - `readyToPlace: false`: se marcan las líneas no vendibles o no surtibles y se pide volver al carrito;
  - carrito vacío: se lleva al carrito.
- **Errores propios:**
  - `coupon-not-applicable`: mensaje según `reason` (`unavailable`: "El cupón no existe o no está vigente"; `minimumNotMet`, `noEligibleLines`, `exhausted`, `alreadyUsed`), y la cotización sigue sin cupón;
  - `total-mismatch`: se vuelve a cotizar, se muestra el total nuevo (`currentTotal`) y se pide confirmar otra vez;
  - `insufficient-stock`: se marcan las líneas de `lines` con `canFulfill` y se pide ajustar el carrito;
  - `variant-not-sellable`: se vuelve a cotizar y se marcan;
  - `email-not-verified`: como el estado anterior;
  - `empty-cart`, `cart-not-active`: se lleva al carrito con aviso;
  - `idempotency-request-in-progress`: se reintenta con la misma llave tras unos segundos;
  - `rate-limit-exceeded`: §4.1 (5 órdenes por email de contacto por hora, 10 por carrito o usuario en 10 minutos, 10 cupones inexistentes por IP).
- **Criterios:**
  - se cotiza al entrar, al aplicar o quitar un cupón y al elegir la dirección; el total que se envía como `expectedTotal` es el último `grandTotal` mostrado;
  - el formulario de dirección sigue `AddressInput` (§8.2): estado y municipio en listas que salen del catálogo geográfico, teléfono de 10 dígitos y código postal de 5;
  - el invitado acepta el aviso de privacidad con una casilla que enlaza a `/privacy`; la versión enviada es `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION` (G-01, ADR-F010);
  - el cliente puede guardar la dirección nueva en su libreta, con una llamada aparte a `POST /v1/me/addresses` antes de colocar; si la libreta está llena (`address-limit-reached`), se usa sin guardar;
  - el botón de colocar se deshabilita mientras se envía y no se puede enviar dos veces;
  - al colocar la orden, el carrito de invitado se olvida (quedó CHECKED_OUT) y se pasa a §5.6 con el `publicCode` y el `cartId` de origen en memoria.

### 5.6 Orden colocada e instrucciones de pago (`/checkout/done`)

- **API:** `POST /v1/orders/{publicCode}/payments` con `cartId` de origen y `provider: "MANUAL"` (invitado), o `POST /v1/me/orders/{publicCode}/payments` (cliente), con `Idempotency-Key` (§16.2).
- **Muestra:** código público, total, `paymentDueAt` ("Apartamos tus productos hasta …"), y la acción de pago: con `action.type` `PAY_IN_STORE`, el código, el monto y `instructions` de la API. Otro `type` (llegará `REDIRECT` con PayPal, G-04) muestra un mensaje genérico hasta que se implemente.
- **Estados:** iniciando pago; acción lista; sin forma de pagar.
- **Errores propios:**
  - `validation-error` con `isEnabledProvider` en `provider` (el pago manual está deshabilitado, G-03): "Tu orden está apartada, pero ahora no podemos recibir el pago en línea; comunícate con la tienda", con el código;
  - `invalid-state-transition`: se consulta la orden y se muestra su estado (por ejemplo, ya expiró);
  - errores de red: se reintenta con la misma llave.
- **Criterios:**
  - el pago se inicia solo al llegar a la pantalla, una vez;
  - recargar la página sin los datos en memoria lleva a `/order-lookup` (invitado) o al detalle de la orden (cliente), sin perder la orden;
  - la pantalla dice que llegará un correo con la orden (§2.5) y que, si no se paga a tiempo, la orden vence y los productos regresan al carrito.

### 5.7 Registro y verificación (`/register`, `/verify-email`)

- **API:** `POST /v1/auth/register` (§9.2), `POST /v1/auth/email-verification/confirm` (§9.3), `POST /v1/auth/email-verification/resend` (§9.4).
- **Registro:** email, contraseña, nombres, apellidos y casilla del aviso de privacidad (versión de `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION`). Al registrarse no hay sesión: se muestra "Revisa tu correo" con la opción de reenviar y un enlace a `/login`.
- **Verificación:** lee `token` de la URL, lo quita de la URL visible, lo envía y muestra el resultado.
- **Errores propios:** `password-policy-violation` según `errors[].code` (`passwordLength`: de 15 a 64 caracteres; `passwordCharacters`; `commonPassword`); `duplicate-value` en `email` ("Ya existe una cuenta con ese email", con enlaces a iniciar sesión y recuperar la contraseña); `invalid-or-expired-token` ("El enlace venció o ya se usó", con formulario para pedir otro).
- **Criterios:**
  - la política de contraseña se explica antes de escribirla (15 a 64 caracteres, base-shop ADR-0047) y el campo permite mostrar lo escrito;
  - el reenvío responde siempre lo mismo, exista o no el email (BR-USR-12);
  - la página de verificación no carga recursos de terceros (`SECURITY.md`).

### 5.8 Inicio y cierre de sesión (`/login`)

- **API:** `POST /v1/auth/login` (§9.5), `GET /v1/me` (§9.10), `POST /v1/me/cart/merge` (§14.2), `POST /v1/auth/refresh` (§9.6), `POST /v1/auth/logout` (§9.7).
- **Criterios:**
  - `invalid-credentials` muestra un solo mensaje, sin decir si el email existe (base-shop ADR-0062);
  - tras iniciar sesión se consulta la cuenta; si `type` no es `CUSTOMER`, §1;
  - se fusiona el carrito de invitado (§4.5) y se regresa a la ruta de origen (por ejemplo, el checkout), solo si es una ruta interna;
  - la sesión se renueva y se cierra como dice ADR-F006: una renovación a la vez entre pestañas y cierre en todas las pestañas;
  - el encabezado muestra "Mi cuenta" y "Cerrar sesión" con sesión, e "Iniciar sesión" sin ella.

### 5.9 Recuperación de contraseña (`/forgot-password`, `/reset-password`)

- **API:** `POST /v1/auth/password-reset/request` (§9.8), `POST /v1/auth/password-reset/confirm` (§9.9).
- **Criterios:**
  - la solicitud responde siempre "Si el email tiene una cuenta, te enviamos un enlace" (202), con el aviso de §4.3;
  - `/reset-password` lee y quita el token de la URL y pide la contraseña nueva dos veces (la confirmación solo la compara el navegador);
  - con `password-policy-violation` el enlace sigue sirviendo y el usuario corrige; con `invalid-or-expired-token` se ofrece pedir otro;
  - al terminar, se avisa que se cerraron todas las sesiones y se lleva a `/login`;
  - la página no carga recursos de terceros.

### 5.10 Mi cuenta (`/account`)

- **API:** `GET /v1/me`, `PATCH /v1/me` (§9.11), `POST /v1/me/password` (§9.12), `POST /v1/me/email` (§9.13), `POST /v1/auth/email-verification/resend`.
- **Muestra:** nombres, apellidos y email, con su estado de verificación.
- **Errores propios:** `invalid-credentials` (contraseña actual incorrecta); `password-policy-violation` con `samePassword`; `duplicate-value` en `email`; `validation-error` con `sameEmail`; `rate-limit-exceeded`.
- **Criterios:**
  - la ruta exige sesión; sin ella, `/login` con regreso;
  - cambiar la contraseña conserva la sesión actual y avisa que se cerraron las demás;
  - cambiar el email avisa que hay que verificar el nuevo antes de comprar.

### 5.11 Mis direcciones (`/account/addresses`)

- **API:** `GET` y `POST /v1/me/addresses`, `PATCH` y `DELETE /v1/me/addresses/{addressId}` (§9.14); catálogo geográfico (§10).
- **Criterios:**
  - lista con la predeterminada primero, como la devuelve la API;
  - alta y edición con el formulario de `AddressInput` del checkout (mismo componente);
  - al cambiar el estado se pide otra vez el municipio;
  - borrar pide confirmación;
  - con 10 direcciones se oculta el alta y se explica el límite (`address-limit-reached` como respaldo);
  - errores de ubicación (`isState`, `isMunicipalityOfState`, `isActiveMunicipality`) en sus campos.

### 5.12 Mis pedidos (`/account/orders`, `/account/orders/{publicCode}`)

- **API:** `GET /v1/me/orders` con `status`, `page` y `sort` (§15.4); `GET /v1/me/orders/{publicCode}`; `POST /v1/me/orders/{publicCode}/payments` (§16.2); `POST /v1/me/orders/{publicCode}/reorder` (§14.3).
- **Muestra:** listado con código, fecha, estado, artículos y total; detalle con líneas, descuento, totales, dirección, plazo, pago y envío (paquetería y guía cuando existan).
- **Estados de la orden** (BR-ORD-05), con nombre en español y una explicación corta: PENDING_PAYMENT (con `paymentDueAt` y botón para ver las instrucciones de pago), PAID, AWAITING_MANUAL_FULFILLMENT ("Estamos preparando tu pedido"), SHIPPED, DELIVERED, CANCELLED (con aviso si hay reembolso pendiente), EXPIRED ("Venció sin pago; los productos regresaron a tu carrito"), REFUNDED.
- **Criterios:**
  - el listado se filtra por estado y pagina con 20 por página;
  - "Volver a comprar" solo en CANCELLED y REFUNDED; tras la recompra se lleva al carrito y se listan las variantes de `skippedVariantIds` que no se pudieron copiar;
  - un código que no es del cliente muestra "Pedido no encontrado".

### 5.13 Pedidos de invitado (`/order-lookup`, `/order-access`)

- **API:** `POST /v1/orders/lookup` (§15.5), `POST /v1/orders/access-links` y `POST /v1/orders/access` (§15.6), `POST /v1/orders/reorder` (§14.3), `POST /v1/orders/{publicCode}/payments` (§16.2).
- **Consulta:** email y código público en un formulario; el detalle se muestra como §5.12. El código acepta minúsculas y sin guion.
- **Enlace de acceso:** "¿Perdiste tu código?" pide el email y responde siempre "Si tienes pedidos, te enviamos un enlace" (202).
- **`/order-access`:** lee y quita el token, muestra las órdenes del email (hasta 50) y, al elegir una, consulta su detalle con el email y el código (§15.5), sin poner ninguno en la URL.
- **Errores propios:** `not-found` con un solo mensaje ("No encontramos un pedido con esos datos"), sin decir qué dato falló (BR-ORD-11); `invalid-or-expired-token`, con formulario para pedir otro enlace; `rate-limit-exceeded`, porque consulta, recompra y enlace comparten 10 intentos por IP en 15 minutos.
- **Criterios:**
  - email y código viajan solo en el cuerpo y no se guardan en el navegador;
  - "Volver a comprar" en CANCELLED y REFUNDED, con el `cartId` del carrito de invitado actual si existe;
  - en PENDING_PAYMENT se muestran el código, el total y el vencimiento. Las instrucciones de la API solo se obtienen con el `cartId` de origen (G-11): si la tienda ya no lo tiene, remite al correo de la orden.

### 5.14 Aviso de privacidad (`/privacy`)

- **API:** `GET /v1/privacy/retention-policy` (§23.1).
- **Muestra:** el texto del aviso y su versión (la de `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION`), con los plazos de conservación que da la API.
- **Bloqueo:** el texto legal no existe todavía y su dueño está por decidir (G-01, PF-07). Hasta entonces, la página muestra un texto provisional marcado como tal, solo en local.

### 5.15 Encabezado, pie y páginas de error

- Encabezado en todas las pantallas: logo a `/`, buscador, contador del carrito y cuenta.
- Pie con enlace al aviso de privacidad. Los datos de contacto de la tienda no están en la API pública (G-06) y se omiten hasta resolverlo.
- Ruta inexistente: página 404 con enlace al inicio y al catálogo.

## 6. Requisitos no funcionales

### 6.1 Navegadores soportados

Las dos últimas versiones de Chrome, Edge, Firefox y Samsung Internet, y Safari 16.4 o posterior en macOS e iOS. Es la base de las APIs que usa la sesión (Web Locks, ADR-F006) y de Nuxt 4. En otros navegadores la tienda puede funcionar, sin garantía. Las pruebas end-to-end de ADR-F008 corren en Chromium, en escritorio y móvil; agregar Firefox y WebKit se decide en TF-004 según el tiempo de la CI.

### 6.2 Presupuesto de rendimiento

Medido con Lighthouse en perfil móvil (teléfono de gama media, 4G lenta simulada) contra la API local, sobre el build de producción (`nuxt generate`):

| Métrica | Presupuesto |
|---|---|
| Largest Contentful Paint en `/`, `/products` y `/products/{slug}` | ≤ 2.5 s en producción, con el modo híbrido (ADR-F005). Mientras la tienda sea SPA, tope local contra regresiones de 3.0 s en `/` y 4.0 s en `/products` y `/products/{slug}` (ADR-F012) |
| Interaction to Next Paint | ≤ 200 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| JavaScript inicial (entrada más la página), comprimido | ≤ 200 KB |
| Cada página adicional, comprimida | ≤ 80 KB |

- Imágenes del catálogo con `width` y `height` declarados y carga diferida fuera de la primera pantalla. Las imágenes llegan en tamaño original (G-02), así que el LCP de las páginas con imágenes depende de lo que suba el staff; se mide y se reporta, sin bloquear mientras G-02 siga abierta.
- Fuentes e iconos locales (`SECURITY.md`), sin cargas de terceros.
- Se mide con el build servido con gzip y una API simulada, con la mediana de 3 corridas (ADR-F012). La CI lo mide en cada pull request con `npm run perf:budget` y falla si se pasa un tope de LCP, el CLS, el JavaScript inicial o el de una página (TF-015). INP no se mide en laboratorio: se reporta el Total Blocking Time como referencia.

### 6.3 Otros

- Accesibilidad: WCAG 2.2 nivel AA (§4.6).
- Idioma: español de México; fechas y montos con `es-MX` y la zona horaria del navegador.
- Seguridad: `SECURITY.md`.

## 7. Fuera del alcance inicial

Sin API que lo respalde, no se construye ni se simula (CLAUDE.md, regla 17): banners y productos destacados, reseñas, lista de deseos, inventario por tienda, pago en línea (G-04), datos de la tienda (G-06) y envío gratis anunciado fuera del checkout (G-05).

## 8. Pendientes

- Lo que falta en la API para cubrir estas pantallas: `API_GAPS.md`.
