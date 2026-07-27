import { expect, test } from '@playwright/test';

test('root shell becomes interactive before deferred client tools load', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-app-shell]')).toBeVisible();
  await expect(page.locator('[data-route-loading]')).toHaveCount(0);
});
