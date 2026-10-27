import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  COMMON_PASSWORD,
  expectAccessible,
  mockAccountApi,
  PRIVACY_NOTICE_VERSION,
  TAKEN_EMAIL,
  VALID_LINK_TOKEN,
} from './mock-api';

const GOOD_PASSWORD = 'una frase larga y segura';

async function fillRegistration(page: Page, email: string, password: string) {
  await page.getByLabel('Nombre o nombres').fill('María');
  await page.getByLabel('Apellidos').fill('López Hernández');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
}

test.describe('registro y verificación (REQUIREMENTS §5.7)', () => {
  test('se registra tras corregir la contraseña y puede reenviar el correo', async ({
    page,
  }) => {
    const api = await mockAccountApi(page);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Crea una' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Crear cuenta' }),
    ).toBeVisible();
    await expect(page.getByText('De 15 a 64 caracteres')).toBeVisible();
    await expectAccessible(page);

    await fillRegistration(page, 'maria@example.com', COMMON_PASSWORD);
    // El campo deja ver lo escrito.
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(
      page.getByLabel('Contraseña', { exact: true }),
    ).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Acepta el aviso de privacidad')).toBeVisible();
    await page
      .getByRole('checkbox', { name: /Acepto el aviso de privacidad/ })
      .click();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    // Mensaje propio según `code`, no el texto de la API.
    await expect(
      page.getByText('Es una contraseña muy común. Elige otra.'),
    ).toBeVisible();

    await page.getByLabel('Contraseña', { exact: true }).fill(GOOD_PASSWORD);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Revisa tu correo' }),
    ).toBeVisible();
    expect(api.bodies.at(-1)).toEqual({
      email: 'maria@example.com',
      password: GOOD_PASSWORD,
      firstNames: 'María',
      lastNames: 'López Hernández',
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    });
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Reenviar el correo' }).click();
    await expect(
      page.getByText('Si el email tiene una cuenta sin verificar'),
    ).toBeVisible();
    expect(api.bodies.at(-1)).toEqual({ email: 'maria@example.com' });
  });

  test('un email ya registrado ofrece iniciar sesión o recuperar la contraseña', async ({
    page,
  }) => {
    await mockAccountApi(page);
    await page.goto('/register');
    await fillRegistration(page, TAKEN_EMAIL, GOOD_PASSWORD);
    await page
      .getByRole('checkbox', { name: /Acepto el aviso de privacidad/ })
      .click();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Ya existe' });
    await expect(alert).toBeVisible();
    await alert.getByRole('link', { name: 'Recuperar la contraseña' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test('verifica el email y quita el token de la URL', async ({ page }) => {
    const api = await mockAccountApi(page);
    await page.goto(`/verify-email?token=${VALID_LINK_TOKEN}`);
    await expect(page.getByText('Tu email quedó verificado.')).toBeVisible();
    await expect(page).toHaveURL(/\/verify-email$/);
    expect(api.bodies).toEqual([{ token: VALID_LINK_TOKEN }]);
    await expectAccessible(page);
  });

  test('un enlace vencido ofrece pedir otro', async ({ page }) => {
    const api = await mockAccountApi(page);
    await page.goto('/verify-email?token=vencido');
    await expect(page.getByText('El enlace venció o ya se usó.')).toBeVisible();
    await page.getByLabel('Email de tu cuenta').fill('maria@example.com');
    await page.getByRole('button', { name: 'Enviar otro enlace' }).click();
    await expect(
      page.getByText('Si el email tiene una cuenta sin verificar'),
    ).toBeVisible();
    expect(api.calls.at(-1)).toBe('/v1/auth/email-verification/resend');
  });
});

test.describe('recuperación de contraseña (REQUIREMENTS §5.9)', () => {
  test('pide el enlace con el mismo mensaje exista o no la cuenta', async ({
    page,
  }) => {
    const api = await mockAccountApi(page);
    await page.goto('/login');
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Recuperar contraseña' }),
    ).toBeVisible();
    await expectAccessible(page);
    await page.getByLabel('Email').fill('nadie@example.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(
      page.getByText('Si el email tiene una cuenta, te enviamos un enlace.'),
    ).toBeVisible();
    await expect(page.getByText('puede tardar unos minutos')).toBeVisible();
    expect(api.bodies).toEqual([{ email: 'nadie@example.com' }]);
  });

  test('elige la contraseña nueva, corrige la política y vuelve al login', async ({
    page,
  }) => {
    const api = await mockAccountApi(page);
    await page.goto(`/reset-password?token=${VALID_LINK_TOKEN}`);
    await expect(page).toHaveURL(/\/reset-password$/);
    await expectAccessible(page);

    const password = page.getByLabel('Contraseña nueva', { exact: true });
    const confirmation = page.getByLabel('Confirma la contraseña nueva', {
      exact: true,
    });
    await password.fill(GOOD_PASSWORD);
    await confirmation.fill('otra frase distinta');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    expect(api.calls).toEqual([]);

    await password.fill(COMMON_PASSWORD);
    await confirmation.fill(COMMON_PASSWORD);
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(
      page.getByText('Es una contraseña muy común. Elige otra.'),
    ).toBeVisible();

    // El mismo enlace sigue sirviendo.
    await password.fill(GOOD_PASSWORD);
    await confirmation.fill(GOOD_PASSWORD);
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText('se cerraron todas tus sesiones', { exact: false }),
    ).toBeVisible();
    expect(api.bodies.at(-1)).toEqual({
      token: VALID_LINK_TOKEN,
      newPassword: GOOD_PASSWORD,
    });
  });

  test('un enlace vencido lleva a pedir otro', async ({ page }) => {
    await mockAccountApi(page);
    await page.goto('/reset-password?token=vencido');
    await page
      .getByLabel('Contraseña nueva', { exact: true })
      .fill(GOOD_PASSWORD);
    await page
      .getByLabel('Confirma la contraseña nueva', { exact: true })
      .fill(GOOD_PASSWORD);
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('El enlace venció o ya se usó.')).toBeVisible();
    await page.getByRole('link', { name: 'Pedir otro enlace' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
