// @ts-check
// Copiado de base-ecomm-admin eslint.config.mjs (commit bbcd5af, ADR-F008 y ADR-F009).
import prettier from 'eslint-config-prettier';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    ignores: ['app/shared/api/generated/**', 'docs/**'],
  },
  {
    files: ['app/features/*/**'],
    rules: {
      // Regla de dependencias (ADR-F009): una feature no importa a otra.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/features/*/**', '../../*/**'],
              message:
                'Una feature no importa a otra; mueve lo común a ~/shared.',
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      // Nunca HTML sin escapar (SECURITY.md, ADR-F006).
      'vue/no-v-html': 'error',
    },
  },
  prettier,
);
