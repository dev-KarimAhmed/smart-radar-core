import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  });
});

async function installRiderSession(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
  const encode = (value: object) => btoa(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    aud: 'authenticated',
    exp: expiresAt,
    sub: 'rider-sidebar-test',
  })}.signature`;

  await page.addInitScript(({ session }) => {
    localStorage.setItem('radar_supabase_auth_session', JSON.stringify(session));
  }, {
    session: {
      access_token: accessToken,
      refresh_token: 'test-refresh-token',
      expires_at: expiresAt,
      expires_in: 3_600,
      token_type: 'bearer',
      user: {
        id: 'rider-sidebar-test',
        aud: 'authenticated',
        role: 'authenticated',
        phone: '+962790000000',
        app_metadata: {},
        user_metadata: {
          role: 'RIDER',
          full_name: 'راكب الاختبار',
          phone: '+962790000000',
          district_id: 1,
        },
        created_at: '2026-01-01T00:00:00.000Z',
      },
    },
  });
}

test('rider can open the restored account sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRiderSession(page);

  await page.goto('/rider');
  await page.getByRole('button', { name: 'فتح قائمة الحساب' }).click();

  await expect(page.getByRole('navigation', { name: 'قائمة حساب الراكب' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();
});

test('desktop rider dashboard preserves its original sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installRiderSession(page);

  await page.goto('/rider');

  await expect(page.getByRole('complementary', { name: 'قائمة الراكب الرئيسية' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'اطلب رحلة' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'رحلاتي' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();
});

test('reloading an authenticated rider shows loading before the rider page without a login flash', async ({ page }) => {
  await installRiderSession(page);
  await page.addInitScript(() => {
    const phases = { loading: false, login: false };
    Object.assign(window, { __riderReloadPhases: phases });
    const observe = () => {
      const text = document.body?.innerText || '';
      if (text.includes('جاري التحقق من الجلسة') || text.includes('جاري تحميل المنصة')) phases.loading = true;
      if (text.includes('مرحبا بك في الرادار الذكي')) phases.login = true;
    };
    new MutationObserver(observe).observe(document, { childList: true, subtree: true });
  });

  await page.goto('/rider');
  await expect(page.locator('[data-rider-route]')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'قائمة الراكب الرئيسية' })).toBeVisible();

  const phases = await page.evaluate(() => (
    window as typeof window & { __riderReloadPhases: { loading: boolean; login: boolean } }
  ).__riderReloadPhases);
  expect(phases.loading).toBe(true);
  expect(phases.login).toBe(false);
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
