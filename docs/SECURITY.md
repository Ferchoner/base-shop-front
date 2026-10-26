# SECURITY — Frontend

> Principios copiados de `docs/SECURITY.md` de base-shop (ADR-F001) y adaptados al navegador. La seguridad del lado de la API (autenticación, autorización, rate limiting, datos personales) está en `docs/api/SECURITY.md` y no se repite aquí.

## Principios

Heredados de la API:

- No almacenar secretos en el repositorio.
- Validar y sanitizar entradas.
- Proteger información sensible.
- No mostrar stack traces ni mensajes internos al usuario.
- Logging sin secretos ni datos sensibles.
- Revisar dependencias vulnerables: la CI falla con vulnerabilidades altas y críticas (`npm audit --audit-level=high`, cuando haya dependencias) y Dependabot propone actualizaciones semanales.
- Detectar secretos en cada cambio: gitleaks antes de cada commit (`npm run secrets:scan`) y en la CI.
- La CI corre con permisos de solo lectura, actions de terceros fijadas por SHA y sin interpolar datos del pull request en sus scripts.
- Ninguna dependencia ejecuta scripts al instalarse sin revisión (`allowScripts` y `.npmrc`).
- `main` solo recibe cambios por pull request con la CI en verde.

Propios del frontend:

- **Todo lo que llega al navegador es público.** Ninguna clave, token de servicio ni secreto en el bundle ni en variables de entorno públicas del framework.
- **La autorización la hace la API.** Ocultar un botón no protege nada; el frontend nunca da por permitido algo que la API no confirmó.
- **XSS:** nunca se inserta HTML que venga de la API o del usuario sin escapar (descripciones de producto, nombres, direcciones). Política de seguridad de contenido (CSP) para el frontend: `PENDIENTE DE DECISIÓN` con el stack y el hosting (PF-01, ADR-F004).
- **Tokens de enlaces** (`/verify-email`, `/reset-password`, `/order-access`): se leen de la URL, se envían a la API en el cuerpo y se quitan de la URL visible. Las páginas con token no cargan recursos de terceros, para que el token no salga en el `Referer`.
- **Datos personales en el navegador:** email, dirección y código público de la orden de invitado viajan en el cuerpo, nunca en la URL (base-shop ADR-0071). No se guardan en almacenamiento del navegador más allá de lo necesario para la sesión.
- **Sin analítica ni scripts de terceros** hasta que se decida con el aviso de privacidad.

## Sesión y tokens

La API entrega un token de acceso de unos 15 minutos y un refresh token de 7 días en el cuerpo, sin cookies; presentar un refresh token ya rotado revoca la sesión (base-shop ADR-0023, ADR-0114).

Dónde se guardan y cómo se renuevan: `PENDIENTE DE DECISIÓN` (PF-02). Requisitos para la decisión:

- el refresh token no debe quedar al alcance de JavaScript de la página si se puede evitar (un XSS lo robaría por 7 días);
- dos pestañas no deben renovar a la vez con el mismo refresh token, porque la segunda revocaría la sesión;
- si se usan cookies (por ejemplo, con un BFF), se revisa CSRF, como pide `docs/api/SECURITY.md`;
- cerrar sesión llama a `POST /v1/auth/logout` y borra todo rastro local.

El `cartId` del carrito de invitado es su única credencial (base-shop ADR-0059) y se trata con el mismo cuidado.

## Gestión de secretos

- El frontend no tiene secretos propios por ahora. Si un BFF los necesita, viven en variables de entorno del servidor, en `.env` fuera de Git, y se declaran en `.env.example` con valores de ejemplo no reales.
- Un secreto detectado se rota de inmediato y se saca del historial; solo los falsos positivos revisados van en `.gitleaksignore`, con un comentario.

## Encabezados de seguridad del frontend

CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` y HSTS del servidor del frontend: `PENDIENTE DE DECISIÓN` con el stack y el hosting (PF-01, ADR-F004).

## Revisión humana

Como en `TEAM_GUIDE.md`: todo cambio en el manejo de tokens, el checkout y el pago, los datos personales o los textos legales requiere revisión humana.
