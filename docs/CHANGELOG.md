# CHANGELOG

> Formato copiado de `docs/CHANGELOG.md` de base-shop (ADR-F001). El de la API está en `docs/api/CHANGELOG.md`.

## Unreleased

- Sprint 4 cerrado con el presupuesto de rendimiento medido: inicio 2.56 s, catálogo 3.66 s y producto 3.45 s de LCP, dentro de sus topes, con 179 KB de JavaScript inicial. En el runner de la CI: 2.77 s, 3.76 s y 3.69 s (seguimiento de ADR-F012). TF-016 sigue bloqueada por G-01.

- TF-015: presupuesto de rendimiento en la CI (`REQUIREMENTS.md` §6.2, ADR-F012).
  - `npm run perf:budget` sirve el build con gzip, simula la API del catálogo y corre Lighthouse 3 veces en el inicio, el catálogo y el producto. Falla si la mediana pasa un tope de LCP, si el CLS pasa de 0.1 o si el JavaScript inicial o el de una página pasan de 200 KB y 80 KB. Corre en el job `Pipeline` y deja la tabla en el resumen.
  - Lighthouse fijo en 13.5.0, la versión con la que se midieron los topes.
  - Antes, el margen del catálogo que se perdió con TF-013: los chunks comunes pequeños se copian en las páginas que los usan (ADR-F015). Inicio de 2.87 a 2.55 s, catálogo de 3.93 a 3.62 s y producto de 3.60 a 3.51 s; JavaScript inicial de 172.7 a 179.2 KB.

- TF-013: Mi cuenta, direcciones y mis pedidos (`REQUIREMENTS.md` §5.10 a §5.12).
  - `/account`: nombre y apellidos; email con su verificación y reenvío del enlace; cambio de email con la contraseña actual (avisa que hay que verificar el nuevo antes de comprar) y cambio de contraseña (esta sesión sigue y se cierran las demás). Errores propios en su campo: contraseña incorrecta, email ocupado o igual al actual, y la regla de la política que no se cumple.
  - `/account/addresses`: la libreta con la predeterminada primero; agregar y editar con los campos del checkout, cambiar la predeterminada y borrar con confirmación. Con 10 direcciones ya no ofrece agregar. Los errores de ubicación del catálogo del INEGI van en su campo.
  - `/account/orders`: pedidos del más reciente al más antiguo, 20 por página, con filtro por estado; página y estado en la URL.
  - `/account/orders/{código}`: el detalle de TF-014, "Ver instrucciones de pago" en una orden pendiente y "Volver a comprar" en una cancelada o reembolsada. Un código que no es del cliente dice "Pedido no encontrado".
  - Al recargar `/checkout/done`, el cliente llega a sus pedidos (ADR-F014).
  - Navegación propia entre Mis datos, Mis pedidos y Mis direcciones.
  - Del backoffice (commit `bbcd5af`): el cambio de contraseña de la sesión y el diálogo de confirmación.
  - Rendimiento: el catálogo sube de 3.72 s a 3.94 s de LCP, dentro de su tope de 4.0 s (ADR-F012). Mis pedidos comparte con él la paginación, el filtro en la URL y la lista de opciones, y el empaquetador los separa en archivos pequeños que el catálogo descarga aparte.

- Sprint 3 cerrado con el presupuesto de rendimiento medido: inicio 2.79 s, catálogo 3.72 s y producto 3.56 s de LCP, dentro de sus topes, con 172 KB de JavaScript inicial. El checkout y los pedidos suman unos 150 ms por un chunk más en la tanda de cada página (seguimiento de ADR-F012).

- TF-014: pedidos de invitado (`REQUIREMENTS.md` §5.13).
  - `/order-lookup`: consulta con email y código, que acepta minúsculas y sin guion. Un solo mensaje si no se encuentra, sin decir qué dato falló. "¿Perdiste tu código?" pide un enlace por correo.
  - `/order-access`: lee y quita el token del enlace, lista los pedidos del email y abre el detalle de cada uno sin poner el email ni el código en la URL. Un enlace vencido o usado ofrece pedir otro.
  - Detalle de la orden con su estado explicado, fechas, pago, envío con paquetería y guía, dirección y productos. En una orden pendiente, el código, el total y el vencimiento; las instrucciones de pago solo si se colocó en esta pestaña (G-11).
  - "Volver a comprar" en órdenes canceladas o reembolsadas, al carrito actual o a uno nuevo, con aviso de cuántos productos ya no se venden (G-13, nueva brecha de la API).
  - Enlace "Consultar un pedido" en el pie.

- TF-012: checkout de invitado y de cliente, e inicio del pago (`REQUIREMENTS.md` §4.4, §5.5 y §5.6; ADR-F014).
  - `/checkout`: sin sesión, iniciar sesión o seguir como invitado (email y aviso de privacidad). El cliente elige una dirección guardada o escribe otra y puede guardarla. Estado y municipio salen del catálogo del INEGI.
  - Resumen con las líneas, el cupón, el descuento y su promoción, el envío o "Gratis", cuánto falta para el envío gratis, el IVA incluido, el total y la entrega estimada, todo de la cotización de la API.
  - Errores propios: cupón que no aplica (por motivo), total que cambió (con el nuevo), productos sin stock o que ya no se venden, email sin confirmar (con reenvío), carrito vacío o ya usado (vuelve al carrito) y demasiados intentos.
  - Colocar la orden e iniciar el pago llevan `Idempotency-Key`: la misma en un reenvío idéntico, otra si cambia el total o un dato.
  - `/checkout/done`: código, total, hasta cuándo se apartan los productos y cómo pagar en la tienda. Sin pago manual habilitado (G-03), la orden queda apartada con su código y se pide comunicarse con la tienda. Si la orden ya no admite pago, muestra su estado.
  - Del backoffice (commit `bbcd5af`): catálogo geográfico, campos y esquema de dirección, estados de la orden y mensajes de cupón.

- TF-017: el catálogo y el producto piden sus datos en cuanto el router resuelve la página, sin esperar a que se monte el encabezado (ADR-F013). El LCP del catálogo baja de 3.92 s a 3.60 s y el del producto de 3.53 s a 3.43 s, con el mismo JavaScript inicial (171 KB). Cada dato se sigue pidiendo una sola vez.

- Corregido: el contador del carrito podía volver a 0 justo después de agregar un producto. Una lectura del carrito que respondía después de la escritura ponía el carrito de antes; ahora agregar o cambiar una línea cancela la lectura en curso (`REQUIREMENTS.md` §5.4).

- Sprint 2 cerrado con el presupuesto de rendimiento medido. Los enlaces descargan su página al interactuar con ellos y no al aparecer en pantalla: el LCP del catálogo baja de 4.08 s a 3.97 s, dentro de su tope de 4.0 s, y el del producto de 3.79 s a 3.48 s. Nueva TF-017 para ajustar el reparto de chunks antes del checkout (seguimiento de ADR-F012).

- TF-011: registro, verificación de email y recuperación de contraseña (`REQUIREMENTS.md` §5.7 y §5.9).
  - `/register`: nombres, apellidos, email, contraseña con la política explicada antes de escribirla y botón para mostrarla, y casilla del aviso de privacidad con la versión de `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION`. Sin esa variable, el registro no está disponible. Al registrarse: "Revisa tu correo", reenvío y enlace al login.
  - Mensajes propios para cada regla de la contraseña (`passwordLength`, `passwordCharacters`, `commonPassword`) y, ante un email ya registrado, enlaces para iniciar sesión o recuperar la contraseña.
  - `/verify-email` y `/reset-password` leen el token, lo quitan de la URL y no envían `Referer`. Un enlace vencido ofrece pedir otro; con un error de la política, el mismo enlace sigue sirviendo.
  - `/forgot-password` y el reenvío responden lo mismo exista o no la cuenta, con el aviso de que el correo puede tardar.
  - Al restablecer la contraseña se cierra la sesión de la pestaña y `/login` avisa que se cerraron todas.
  - `/login` enlaza a la recuperación y al registro.
  - La CI construye con `NUXT_PUBLIC_PRIVACY_NOTICE_VERSION=e2e-2026-10` para probar el registro.

- TF-010: sesión del cliente (`REQUIREMENTS.md` §4.5, §5.4 y §5.8; ADR-F006).
  - `/login`: un solo mensaje ante credenciales inválidas, sin decir si el email existe, y regreso a la ruta de origen solo si es interna. Una cuenta de staff ve "Las cuentas de personal no compran en la tienda en línea" y se le cierra la sesión.
  - Token de acceso en memoria y refresh token en `localStorage` (`base-shop-front.refreshToken`). Renovación de una en una, también entre pestañas con un Web Lock, antes de vencer y ante un 401. La sesión se recupera al abrir la tienda sin hacer esperar a las páginas públicas.
  - "Cerrar sesión" llama a la API, borra el refresh token, vacía la caché y olvida el carrito de invitado; las demás pestañas se enteran y dejan las páginas que piden sesión.
  - Con sesión, el carrito es el de la cuenta (`/v1/me/cart`). Al iniciar sesión, un carrito de invitado con productos se fusiona y la tienda avisa "Combinamos los productos de tu carrito con los de tu cuenta".
  - Encabezado con "Mi cuenta" y "Cerrar sesión", o "Iniciar sesión". `/account` muestra por ahora nombre, email y si está verificado; lo demás llega con TF-013.
  - Del backoffice (commit `bbcd5af`): `token-storage`, `exclusive`, `redirect`, `auth-gateway`, `session.store`, los plugins, el middleware, el login y sus tests.

- Sprint 1 cerrado con el presupuesto de rendimiento medido. ADR-F012 (aceptada): LCP de 2.5 s como meta de producción con el modo híbrido, y topes locales contra regresiones de 3.0 s en el inicio y 4.0 s en el catálogo y el producto, que TF-015 pondrá en la CI.

- TF-009: carrito de invitado (`REQUIREMENTS.md` §4.5 y §5.4).
  - El `cartId` se guarda en `localStorage` (`base-shop-front.cartId`), compartido por las pestañas, y el carrito se crea al agregar el primer producto. Un carrito que ya no existe o ya no está activo se olvida, y el siguiente agregado crea otro.
  - Detalle de producto: cantidad de 1 a 30 y "Agregar al carrito", con aviso accesible y enlace al carrito. Errores propios: variante que dejó de venderse (recarga el producto), tope de 30 unidades y de 100 productos distintos.
  - `/cart`: líneas con imagen, opciones, precio unitario, cantidad y total de la API; "Ya no está disponible" sin precio y "No hay suficientes para la cantidad pedida" sin revelar existencias. El subtotal aclara que no incluye envío ni descuentos, y los cambios se anuncian.
  - Contador del carrito en el encabezado con `itemCount`.
  - "Continuar al checkout" lleva a `/checkout`, que llega con TF-012.

- TF-008: detalle de producto en `/products/{slug}` (`REQUIREMENTS.md` §5.3).
  - Galería con miniaturas y `altText`; al elegir una variante con imágenes propias, van primero.
  - Selector de opciones en cascada: cada opción ofrece los valores que existen con las anteriores, así que una combinación inexistente no se puede elegir y nunca hay que deshacer para llegar a otra. Lo agotado se marca y se puede ver.
  - Precio y disponibilidad de la variante elegida, sin existencias; antes de elegir, "Desde" con el precio más bajo.
  - Descripción como texto, marca y categorías que llevan al catálogo filtrado, y "Producto no disponible" para un 404.
  - La cantidad y "Agregar al carrito" llegan con el carrito (TF-009).

- TF-007: inicio y catálogo.
  - Inicio con las categorías de primer nivel y los 12 productos más recientes; sin productos, "Pronto tendremos productos" (`REQUIREMENTS.md` §5.1).
  - Catálogo en `/products` con búsqueda, categoría, marcas, rango de precio en pesos (se envía en centavos), solo disponibles, orden y paginación de 24, todo en la URL; "atrás" deshace el último cambio (§5.2).
  - "Relevancia" solo con búsqueda. Lo que la API rechazaría (rango al revés, relevancia sin búsqueda, más de 20 marcas) se descarta antes de enviarlo, y una categoría o marca que ya no existe se quita de la URL con un aviso.
  - Los esqueletos de carga ya no se anuncian uno por uno: `USkeleton` de Nuxt UI los marca como alertas.
  - Del backoffice (commit `bbcd5af`): `use-list-params.ts` (con `push` en lugar de `replace`), `ListPagination.vue` y `flattenTree`.
  - `API_GAPS.md`: nueva G-12 (el OpenAPI limita `brand` a 100 caracteres en total, la API a 20 slugs).

- TF-006: base de la tienda.
  - Encabezado con logo y buscador (de 2 a 100 caracteres, lleva a `/products?q=`), enlace para saltar al contenido y pie con la nota de precios con IVA. El contador del carrito, la cuenta y el aviso de privacidad llegan con TF-009, TF-010 y TF-016.
  - Mensajes de error propios de la tienda según el `type` del Problem Details, con referencia para soporte solo en errores inesperados y espera visible tras un 429 (`REQUIREMENTS.md` §4.1).
  - `PriceTag`: precio de la API, precio de comparación tachado solo si es mayor, "Desde" e "IVA incluido" (§4.2).
  - Al cambiar de pantalla, el foco va al título (§4.6). Página 404 con enlaces al inicio y al catálogo.
  - Del backoffice (commit `bbcd5af`) se copiaron `form-errors.ts`, `QueryState.vue` y `ProblemAlert.vue` (este último adaptado), con su origen.

- Sprint 0 cerrado: TF-004 con la prueba de humo contra la API 1.8.0 local, y TF-005 con el ruleset de `main` aplicado.

- Documentación de la API resincronizada con base-shop 1.8.0 (tag `v1.8.0`, commit `8bde9da`). La API tiene ahora una URL por frontend para los enlaces de sus correos (base-shop ADR-0169), así que `API_GAPS.md` G-08 queda resuelta. El contrato de `/v1` no cambió (`openapi/v1.json` igual) y los tipos generados no cambian.

- TF-004: esqueleto del proyecto y CI completa.
  - Nuxt 4 SPA con Nuxt UI, TanStack Query, Pinia, ofetch, Zod y tipos generados del OpenAPI, en el puerto 3002.
  - Del backoffice (commit `bbcd5af`) se copiaron el cliente HTTP, Problem Details, dinero y fechas, la configuración de ESLint, Vitest y Playwright, y sus tests, cada archivo con su origen.
  - Inicio provisional que comprueba la conexión con la API, y página de error.
  - CI: el job `Pipeline` suma instalación, lint, formato, tipos del contrato al día, typecheck, tests, auditoría, build y e2e con axe.
  - Auditoría con excepciones revisadas (ADR-F011, aprobada): `node-forge`, que solo usa el servidor de desarrollo y no tiene versión corregida.

- TF-003: requisitos de la tienda pública, aprobados por el usuario.
  - `REQUIREMENTS.md` detalla cada pantalla con su ruta del frontend, las rutas de la API, estados, errores por `type` y criterios de aceptación, además de errores, precios, idempotencia, carrito y accesibilidad comunes a todas.
  - Navegadores soportados y presupuesto de rendimiento.
  - Tareas de pantallas TF-006 a TF-016 y cuatro sprints planeados en `SPRINT.md`.
  - `API_GAPS.md`: nueva G-11 (instrucciones de pago del invitado solo con el carrito de origen).

- TF-002 (ADR-F005 a ADR-F010): decisiones del stack.
  - Nuxt 4 + Vue 3 como SPA, igual que el backoffice base-ecomm-admin; el modo híbrido se valora con el hosting (ADR-F005, aceptada).
  - Aprobadas por el usuario: sesión en el navegador sin servidor intermedio (ADR-F006), librerías del backoffice (ADR-F007), tests y calidad (ADR-F008), organización por features con código copiado del backoffice (ADR-F009) y entorno local en el puerto 3002 (ADR-F010).
  - `API_GAPS.md`: G-07 resuelta por ADR-F006; nuevas G-08 (una sola URL de frontend para los correos), G-09 (renovación perdida) y G-10 (límite por IP sin excepción para un servidor del frontend).

- TF-001 (ADR-F001 a ADR-F004): reglas y contexto para IAs heredados de base-shop.
  - `CLAUDE.md`, `docs/AI_WORKFLOW.md`, `docs/TEAM_GUIDE.md` y `docs/DEVELOPMENT_GUIDE.md` adaptados al frontend, con su origen.
  - Documentación de la API 1.7.0 copiada en `docs/api/`, con su origen en `docs/api/README.md` y `scripts/sync-api-docs.sh` para resincronizarla.
  - Documentos del proyecto: `PROJECT`, `REQUIREMENTS`, `ARCHITECTURE`, `SECURITY`, `DECISIONS`, `TASKS`, `PROGRESS`, `SPRINT` y `API_GAPS`.
  - Configuración copiada de la API: `.editorconfig`, `.gitattributes`, `.prettierrc`, `.npmrc`, `.nvmrc`, revisión de mensajes de commit, escaneo de secretos con gitleaks y ruleset de `main`; CI con los jobs `Pipeline` y `Commit messages`, y Dependabot.
