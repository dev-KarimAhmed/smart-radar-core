import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

test('registration deep link preserves role and switches language without reloading', async ({ page }) => {
  await page.goto('/register?role=captain&lang=en');

  await expect(page.getByText(/Smart Radar · Captain/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create Rider Account' })).toBeVisible();

  await page.getByRole('button', { name: 'Switch language to Arabic' }).click();

  await expect(page.getByRole('button', { name: 'تغيير اللغة إلى الإنجليزية' })).toBeVisible();
  await expect(page.getByText(/الرادار الذكي · كابتن/)).toBeVisible();
});

test('registration mode and dependent district choices remain interactive', async ({ page }) => {
  await page.goto('/register?role=rider&lang=en');

  await page.getByRole('button', { name: 'Login', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Rider Login' })).toBeVisible();

  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create Rider Account' })).toBeVisible();

  const selects = page.locator('select');
  await selects.first().selectOption('giza');
  await expect(selects.nth(1).locator('option')).toContainText(['Dokki', 'Haram', '6th of October']);
});
