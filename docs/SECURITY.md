# SECURITY — Frontend

> Principios copiados de `docs/SECURITY.md` de base-shop (ADR-F001) y adaptados al navegador. La seguridad del lado de la API (autenticación, autorización, rate limiting, datos personales) está en `docs/api/SECURITY.md` y no se repite aquí.

## Principios

Heredados de la API:

- No almacenar secretos en el repositorio.
- Validar y sanitizar entradas.
- Proteger información sensible.
- No mostrar stack traces ni mensajes internos al usuario.
- Logging sin secretos ni datos sensibles.
- Revisar dependencias vulnerables: la CI falla con vulnerabilidades altas y críticas (`npm run audit`), salvo excepciones revisadas que no llegan al navegador y vencen en una fecha (ADR-F011), y Dependabot propone actualizaciones semanales.
- Detectar secretos en cada cambio: gitleaks antes de cada commit (`npm run secrets:scan`) y en la CI.
- La CI corre con permisos de solo lectura, actions de terceros fijadas por SHA y sin interpolar datos del pull request en sus scripts.
- Ninguna dependencia ejecuta scripts al instalarse sin revisión (`allowScripts` y `.npmrc`).
- `main` solo recibe cambios por pull request con la CI en verde.

Propios del frontend:

- **Todo lo que llega al navegador es público.** Ninguna clave, token de servicio ni secreto en el bundle ni en variables de entorno públicas del framework.
- **La autorización la hace la API.** Ocultar un botón no protege nada; el frontend nunca da por permitido algo que la API no confirmó.
- **XSS:** nunca se inserta HTML que venga de la API o del usuario sin escapar (descripciones de producto, nombres, direcciones). Política de seguridad de contenido (CSP) para el frontend: `PENDIENTE DE DECISIÓN` con el stack y el hosting (PF-01, ADR-F004).
- **Tokens de enlaces** (`/verify-email`, `/reset-password`, `/order-access`): se leen de la URL, se envían a la API en el cuerpo y se quitan de la URL visible. Las páginas con token no cargan recursos de terceros, para que el token no salga en el `Referer`, y además declaran `referrer: no-referrer` (TF-011).
- **Datos personales en el navegador:** email, dirección y código público de la orden de invitado viajan en el cuerpo, nunca en la URL (base-shop ADR-0071). No se guardan en almacenamiento del navegador más allá de lo necesario para la sesión.
- **Sin analítica ni scripts de terceros** hasta que se decida con el aviso de privacidad.

## Sesión y tokens

La API entrega un token de acceso de unos 15 minutos y un refresh token de 7 días en el cuerpo, sin cookies; presentar un refresh token ya rotado revoca la sesión (base-shop ADR-0023, ADR-0114).

Decidido en ADR-F006, el mismo modelo que el backoffice:

- token de acceso solo en memoria; refresh token en `localStorage`, con una llave propia de la tienda;
- dos pestañas nunca renuevan a la vez: una sola renovación por pestaña y un Web Lock entre pestañas, que lee el refresh token más reciente;
- cerrar sesión llama a `POST /v1/auth/logout` y borra memoria, `localStorage` y la caché de datos; las demás pestañas se enteran por el evento `storage`;
- sin servidor intermedio ni cookies, así que no aplica CSRF (`docs/api/SECURITY.md`).

Riesgo aceptado: un XSS podría leer el refresh token. Mitigaciones: sin `v-html`, sin scripts de terceros, iconos y fuentes locales y CSP estricta con el hosting. Límite conocido: una renovación perdida al recargar revoca la sesión (`API_GAPS.md`, G-09).

El `cartId` del carrito de invitado es su única credencial (base-shop ADR-0059) y se trata con el mismo cuidado.

## Gestión de secretos

- La tienda es una SPA sin servidor propio (ADR-F005, ADR-F006): no tiene secretos, y sus variables `NUXT_PUBLIC_*` terminan en el bundle, así que nunca llevan uno. Si el modo híbrido llega a necesitar secretos, vivirán en variables del servidor, en `.env` fuera de Git, declaradas en `.env.example` con valores de ejemplo no reales.
- Un secreto detectado se rota de inmediato y se saca del historial; solo los falsos positivos revisados van en `.gitleaksignore`, con un comentario.

## Encabezados de seguridad del frontend

CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` y HSTS del servidor del frontend: `PENDIENTE DE DECISIÓN` con el stack y el hosting (PF-01, ADR-F004).

## Revisión humana

Como en `TEAM_GUIDE.md`: todo cambio en el manejo de tokens, el checkout y el pago, los datos personales o los textos legales requiere revisión humana.
