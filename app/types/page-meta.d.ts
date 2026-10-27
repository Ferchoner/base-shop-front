// Adaptado de base-ecomm-admin app/types/page-meta.d.ts (commit bbcd5af, ADR-F009): en la tienda casi
// todo es público, así que se marca lo que pide sesión y no al revés.
declare module '#app' {
  interface PageMeta {
    /** Pide sesión de cliente; sin ella lleva a `/login` y regresa (REQUIREMENTS §5.8). */
    auth?: boolean;
    /** Solo sin sesión, como `/login`: con sesión lleva a la ruta de origen o al inicio. */
    guestOnly?: boolean;
  }
}

export {};
