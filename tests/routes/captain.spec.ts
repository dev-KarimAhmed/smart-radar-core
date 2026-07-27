import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

test('captain route uses its independent feature shell', async ({ page }) => {
  await page.goto('/captain');

  await expect(page.locator('[data-captain-route]')).toBeVisible();
  await expect(page.locator('[data-all-role-dashboard]')).toHaveCount(0);
});
