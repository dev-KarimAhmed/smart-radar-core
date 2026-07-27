import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

for (const route of [
  { path: '/advertiser/dashboard', marker: 'advertiser' },
  { path: '/delegate', marker: 'delegate' },
  { path: '/admin', marker: 'admin' },
] as const) {
  test(`${route.marker} route uses its independent feature shell`, async ({ page }) => {
    await page.goto(route.path);

    await expect(page.locator(`[data-${route.marker}-route]`)).toBeVisible();
    await expect(page.locator('[data-all-role-dashboard]')).toHaveCount(0);
  });
}
