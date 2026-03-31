import { test, expect } from '@playwright/test';

test.describe('UI Responsiva - Formulario en Móvil', () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    'Este test solo es válido para navegadores móviles simulados.'
  );

  test('Debe permitir ocultar y mostrar el formulario en la versión móvil', async ({
    page,
  }) => {
    await page.goto('/');

    const toggleBtn = page.locator('#toggle-btn');
    const sidebarContent = page.locator('#sidebar-content');

    await expect(sidebarContent).toBeVisible();
    await expect(toggleBtn).toHaveText('Ocultar formulario');

    await toggleBtn.click();

    await expect(sidebarContent).toBeHidden();

    await expect(toggleBtn).toHaveText('Mostrar formulario');

    await toggleBtn.click();

    await expect(sidebarContent).toBeVisible();
    await expect(toggleBtn).toHaveText('Ocultar formulario');
  });
});
