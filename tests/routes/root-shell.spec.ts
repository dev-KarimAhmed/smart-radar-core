import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

test('root shell renders without a route-loading placeholder', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-app-shell]')).toBeVisible();
  await expect(page.locator('[data-route-loading]')).toHaveCount(0);
});

test('root preserves the original role-selection login UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'مرحبا بك في الرادار الذكي' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'تسجيل الدخول' })).toBeVisible();
  await expect(page.getByText('رحلتك تبدأ من هنا')).toHaveCount(0);
});
