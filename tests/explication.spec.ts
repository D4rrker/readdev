import { test, expect } from '@playwright/test';

test.describe('Generación de explicaciones y manejo de errores', () => {
  test('Debe procesar un texto y mostrar el resultado simulado', async ({
    page,
  }) => {
    await page.route('**/api/explain', async (route) => {
      const mockChunk = {
        type: 'chunk',
        text: 'Esta es una explicación simulada por Playwright.',
      };
      const mockDone = { type: 'done' };

      const fakeStream = `data: ${JSON.stringify(mockChunk)}\n\ndata: ${JSON.stringify(mockDone)}\n\n`;

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: fakeStream,
      });
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /text/i }).click();

    const textarea = page.locator('textarea');
    await textarea.fill('const saludo = "Hola Mundo";');

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    const resultPanel = page.locator('#result-panel');

    await expect(resultPanel).toBeVisible();

    await expect(resultPanel).toContainText(
      'Esta es una explicación simulada por Playwright.'
    );
  });

  test('Debe de procesar y mostrar el error en pantalla correctamente', async ({
    page,
  }) => {
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error simulado' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[type="url"]');
    await input.fill('https://docs.astro.build/es/guides/middleware/');

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    const resultPanel = page.locator('#result-panel');
    await expect(resultPanel).toBeVisible();

    await expect(resultPanel).toContainText(
      'Algo salió mal. Inténtalo de nuevo.'
    );
  });

  test('Debe bloquear temas fuera de contexto y mostrar el error de la IA', async ({
    page,
  }) => {
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ type: 'error', message: 'Tema fuera de contexto' })}\n\n`,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /text/i }).click();

    const textarea = page.locator('textarea');
    await textarea.fill(
      'Dime los ingredientes para hacer una tarta de manzana.'
    );

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    const errorText = page.getByText('Tema fuera de contexto');
    await expect(errorText).toBeVisible();
  });
});
