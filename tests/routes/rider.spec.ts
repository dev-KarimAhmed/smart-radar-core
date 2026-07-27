import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

test('rider route uses its independent feature shell', async ({ page }) => {
  await page.goto('/rider');

  await expect(page.locator('[data-rider-route]')).toBeVisible();
  await expect(page.locator('[data-all-role-dashboard]')).toHaveCount(0);
});

test('rider initialization does not loop district requests', async ({ page }) => {
  let districtRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/districts')) districtRequests += 1;
  });

  await page.goto('/rider');
  await page.waitForTimeout(2_000);

  expect(districtRequests).toBeLessThanOrEqual(1);
});
