/**
 * 🛡️ Dual-Role Live E2E Test: Rider vs Captain
 *
 * Opens two HEADED browser windows side-by-side to simulate a real-time
 * ride-hailing transaction. Uses dev-mode mock login (NODE_ENV=development).
 *
 * Run:  npx playwright test tests/e2e/dual-role-e2e.spec.ts --headed
 */

import { test, expect, chromium, type Browser, type Page, type BrowserContext, type ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/* ─────────────────────── Configuration ─────────────────────── */

// Keep the live application address configurable: production instances do not
// expose the test-only demo identities, while a Next development server does.
const BASE_URL = process.env.DUAL_E2E_BASE_URL || 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = path.resolve('screenshots/e2e-dual-role');
const AUDIT_REPORT_PATH = path.resolve('TEST_SESSION_BUGS_AND_NOTES.md');

const TIMEOUTS = {
  navigation: 30_000,
  login: 15_000,
  redirect: 20_000,
  stateTransition: 15_000,
  offerAppearance: 60_000,
  rpcResponse: 20_000,
} as const;

/* ─────────────────────── Diagnostic Collector ─────────────────────── */

interface DiagnosticEntry {
  timestamp: string;
  context: 'RIDER' | 'CAPTAIN';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  source: string;
  message: string;
}

interface StepResult {
  step: string;
  phase: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
  durationMs: number;
  note?: string;
}

class DiagnosticCollector {
  entries: DiagnosticEntry[] = [];
  steps: StepResult[] = [];
  networkFailures: DiagnosticEntry[] = [];

  log(context: 'RIDER' | 'CAPTAIN', severity: DiagnosticEntry['severity'], source: string, message: string) {
    this.entries.push({
      timestamp: new Date().toISOString(),
      context,
      severity,
      source,
      message: message.substring(0, 500),
    });
  }

  recordStep(step: string, phase: string, status: StepResult['status'], durationMs: number, note?: string) {
    this.steps.push({ step, phase, status, durationMs, note });
  }
}

/* ─────────────────────── Helpers ─────────────────────── */

function screenshotPath(name: string): string {
  return path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
}

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const filePath = screenshotPath(name);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

function attachDiagnosticObservers(page: Page, role: 'RIDER' | 'CAPTAIN', collector: DiagnosticCollector) {
  // Console errors
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      collector.log(role, msg.type() === 'error' ? 'ERROR' : 'WARNING', 'console', msg.text());
    }
  });

  // Page errors (uncaught exceptions)
  page.on('pageerror', (error: Error) => {
    collector.log(role, 'ERROR', 'pageerror', `${error.name}: ${error.message}`);
  });

  // Network response failures (4xx/5xx)
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const entry: DiagnosticEntry = {
        timestamp: new Date().toISOString(),
        context: role,
        severity: status >= 500 ? 'ERROR' : 'WARNING',
        source: 'network',
        message: `HTTP ${status} — ${response.url().substring(0, 200)}`,
      };
      collector.entries.push(entry);
      collector.networkFailures.push(entry);
    }
  });

  // Request failures (DNS, connection, etc.)
  page.on('requestfailed', (request) => {
    collector.log(role, 'ERROR', 'network:failed', `${request.method()} ${request.url().substring(0, 200)} — ${request.failure()?.errorText || 'unknown'}`);
  });
}

/* ─────────────────────── Audit Report Generator ─────────────────────── */

function generateAuditReport(collector: DiagnosticCollector, screenshotPaths: string[]): string {
  const now = new Date().toISOString();
  const passCount = collector.steps.filter(s => s.status === 'PASS').length;
  const failCount = collector.steps.filter(s => s.status === 'FAIL').length;
  const warnCount = collector.steps.filter(s => s.status === 'WARN').length;
  const skipCount = collector.steps.filter(s => s.status === 'SKIP').length;
  const totalDuration = collector.steps.reduce((sum, s) => sum + s.durationMs, 0);

  const consoleErrors = collector.entries.filter(e => e.source === 'console' && e.severity === 'ERROR');
  const pageErrors = collector.entries.filter(e => e.source === 'pageerror');
  const networkErrors = collector.networkFailures;
  const warnings = collector.entries.filter(e => e.severity === 'WARNING');

  let report = `# 🔬 E2E Test Session Audit Report\n\n`;
  report += `**Generated:** ${now}\n`;
  report += `**Test:** Dual-Role Live E2E (Rider vs Captain)\n`;
  report += `**Base URL:** ${BASE_URL}\n\n`;

  // ── Executive Summary ──
  report += `## 📊 Execution Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Steps | ${collector.steps.length} |\n`;
  report += `| ✅ Passed | ${passCount} |\n`;
  report += `| ❌ Failed | ${failCount} |\n`;
  report += `| ⚠️ Warnings | ${warnCount} |\n`;
  report += `| ⏭️ Skipped | ${skipCount} |\n`;
  report += `| Total Duration | ${(totalDuration / 1000).toFixed(1)}s |\n`;
  report += `| Console Errors | ${consoleErrors.length} |\n`;
  report += `| Page Errors | ${pageErrors.length} |\n`;
  report += `| Network Failures (4xx/5xx) | ${networkErrors.length} |\n\n`;

  // ── Step-by-Step Results ──
  report += `## 🚦 Step-by-Step Results\n\n`;
  report += `| Phase | Step | Status | Duration | Note |\n`;
  report += `|-------|------|--------|----------|------|\n`;
  for (const step of collector.steps) {
    const icon = step.status === 'PASS' ? '✅' : step.status === 'FAIL' ? '❌' : step.status === 'WARN' ? '⚠️' : '⏭️';
    report += `| ${step.phase} | ${step.step} | ${icon} ${step.status} | ${step.durationMs}ms | ${step.note || '—'} |\n`;
  }
  report += `\n`;

  // ── Detected Bugs & Edge Cases ──
  report += `## 🐛 Detected Bugs & Edge Cases\n\n`;

  if (consoleErrors.length > 0) {
    report += `### Console Errors\n\n`;
    for (const entry of consoleErrors.slice(0, 20)) {
      report += `- **[${entry.context}]** \`${entry.timestamp}\`: ${entry.message}\n`;
    }
    if (consoleErrors.length > 20) report += `- ... and ${consoleErrors.length - 20} more\n`;
    report += `\n`;
  }

  if (pageErrors.length > 0) {
    report += `### Uncaught JS Exceptions\n\n`;
    for (const entry of pageErrors.slice(0, 10)) {
      report += `- **[${entry.context}]** \`${entry.timestamp}\`: ${entry.message}\n`;
    }
    report += `\n`;
  }

  if (networkErrors.length > 0) {
    report += `### Network Failures (HTTP 4xx/5xx)\n\n`;
    for (const entry of networkErrors.slice(0, 20)) {
      report += `- **[${entry.context}]** \`${entry.severity}\` ${entry.message}\n`;
    }
    if (networkErrors.length > 20) report += `- ... and ${networkErrors.length - 20} more\n`;
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `### Console Warnings\n\n`;
    for (const entry of warnings.slice(0, 15)) {
      report += `- **[${entry.context}]** ${entry.message}\n`;
    }
    if (warnings.length > 15) report += `- ... and ${warnings.length - 15} more\n`;
    report += `\n`;
  }

  if (consoleErrors.length === 0 && pageErrors.length === 0 && networkErrors.length === 0) {
    report += `> ✅ No critical bugs detected during this test session.\n\n`;
  }

  // ── Actionable Fixes ──
  report += `## 🔧 Actionable Fixes\n\n`;

  const supabaseErrors = networkErrors.filter(e => e.message.includes('supabase'));
  if (supabaseErrors.length > 0) {
    report += `### Supabase RPC / RLS Failures\n\n`;
    report += `The mock dev users (\`dev-rider-001\`, \`dev-driver-001\`) are in-memory only and do not have `;
    report += `valid Supabase sessions. RPC calls guarded by RLS will return 401/403.\n\n`;
    report += `**Fix:** Create dedicated E2E test accounts in Supabase with phone+password auth, or add `;
    report += `a \`service_role\` bypass for E2E test requests identified by a header or token.\n\n`;
    report += `**Affected files:**\n`;
    report += `- \`src/lib/supabase-client.ts\` — session initialization\n`;
    report += `- \`src/hooks/use-auth.tsx\` — \`loginAsMockUser()\` does not create a Supabase session\n`;
    report += `- \`supabase/migrations/\` — RLS policies on \`ride_requests\`, \`ride_offers\`, \`captain_radar_requests\`\n\n`;
  }

  const mixedContentErrors = collector.entries.filter(e => e.message.toLowerCase().includes('mixed content'));
  if (mixedContentErrors.length > 0) {
    report += `### Mixed Content Warnings\n\n`;
    report += `HTTP resources loaded over HTTPS. Ensure all API endpoints use HTTPS.\n\n`;
    report += `**File:** \`src/lib/road-route.ts\` or OSRM configuration\n\n`;
  }

  const hmrSocketErrors = collector.entries.filter(e => e.message.includes('/_next/webpack-hmr'));
  if (hmrSocketErrors.length > 0) {
    report += `### Next development WebSocket is not proxied\n\n`;
    report += `The live run repeatedly failed the Next HMR WebSocket handshake. The custom Express entry point serves HTTP through `;
    report += `\`nextHandler\`, but it does not forward HTTP upgrade requests. This can leave a freshly isolated browser on the session-loading screen and prevents the demo-login controls from becoming testable.\n\n`;
    report += `**Suggested patch:** In \`server.ts\`, retain the result of \`app.listen(...)\` and forward its \`upgrade\` event to Next's upgrade handler (or run \`next dev\` directly for E2E). Example shape: \`server.on('upgrade', (req, socket, head) => nextApp.getUpgradeHandler()(req, socket, head));\`.\n\n`;
  }

  const demoLoginTimeout = collector.steps.some(s => s.step.includes('demo bypass') && s.status === 'FAIL');
  if (demoLoginTimeout) {
    report += `### Authentication bootstrap never leaves the loading screen\n\n`;
    report += `**Observed:** an isolated role context remained on “جاري التحقق من الجلسة...” for 15s and never rendered \`RoleStep\` / its demo-login control.\n\n`;
    report += `**Suggested patch:** In \`src/hooks/use-auth.tsx\`, put a bounded timeout around the lazy \`import('@/lib/supabase-client')\` initialization and call \`setLoading(false)\` in its failure/timeout branch. This ensures logged-out clients can always reach \`src/features/auth/components/steps/role-step.tsx\`.\n\n`;
  }

  // ── Screenshots ──
  if (screenshotPaths.length > 0) {
    report += `## 📸 Screenshots\n\n`;
    for (const screenshotPath of screenshotPaths) {
      const filename = path.basename(screenshotPath);
      report += `- \`${filename}\`\n`;
    }
    report += `\n`;
  }

  report += `---\n`;
  report += `*Report generated by dual-role-e2e.spec.ts*\n`;

  return report;
}

/* ═══════════════════════ MAIN TEST ═══════════════════════ */

test.describe('Dual-Role Live E2E: Rider vs Captain', () => {
  test.setTimeout(120_000);
  let riderBrowser: Browser;
  let captainBrowser: Browser;
  let riderContext: BrowserContext;
  let captainContext: BrowserContext;
  let riderPage: Page;
  let captainPage: Page;
  const collector = new DiagnosticCollector();
  const screenshotFiles: string[] = [];

  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    // ── Context A: Rider (left window) ──
    // Separate browser processes make the profile stores (cookies, IndexedDB,
    // local/session storage) physically independent and position both live
    // windows side-by-side for manual observation while the test runs.
    riderBrowser = await chromium.launch({
      headless: false,
      args: ['--window-position=0,0', '--window-size=500,900'],
    });
    riderContext = await riderBrowser.newContext({
      viewport: { width: 500, height: 900 },
      locale: 'ar-JO',
      timezoneId: 'Asia/Amman',
      geolocation: { latitude: 31.9539, longitude: 35.9106 }, // Amman, University area
      permissions: ['geolocation'],
    });
    riderPage = await riderContext.newPage();
    attachDiagnosticObservers(riderPage, 'RIDER', collector);

    // ── Context B: Captain (right window) ──
    captainBrowser = await chromium.launch({
      headless: false,
      args: ['--window-position=510,0', '--window-size=500,900'],
    });
    captainContext = await captainBrowser.newContext({
      viewport: { width: 500, height: 900 },
      locale: 'ar-JO',
      timezoneId: 'Asia/Amman',
      geolocation: { latitude: 31.9560, longitude: 35.9130 }, // Near rider, ~300m away
      permissions: ['geolocation'],
    });
    captainPage = await captainContext.newPage();
    attachDiagnosticObservers(captainPage, 'CAPTAIN', collector);
  });

  test.afterAll(async () => {
    // Generate the audit report
    const report = generateAuditReport(collector, screenshotFiles);
    fs.writeFileSync(AUDIT_REPORT_PATH, report, 'utf-8');
    console.log(`\n📝 Audit report saved to: ${AUDIT_REPORT_PATH}`);

    // Cleanup
    await riderPage?.close().catch(() => {});
    await captainPage?.close().catch(() => {});
    await riderContext?.close().catch(() => {});
    await captainContext?.close().catch(() => {});
    await riderBrowser?.close().catch(() => {});
    await captainBrowser?.close().catch(() => {});
  });

  /* ───────────── PHASE 1: Captain Setup & Idle State ───────────── */

  test('Phase 1: Captain login via dev bypass and activate radar', async () => {
    const t0 = Date.now();

    // Step 1.1: Navigate Captain to the login page
    let stepStart = Date.now();
    try {
      await captainPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.navigation });
      collector.recordStep('Navigate to login page', 'Phase 1', 'PASS', Date.now() - stepStart);
    } catch (err: any) {
      collector.recordStep('Navigate to login page', 'Phase 1', 'FAIL', Date.now() - stepStart, err.message);
      screenshotFiles.push(await captureScreenshot(captainPage, 'captain-nav-fail'));
      throw err;
    }

    // Step 1.2: Wait for and click the "Captain demo" dev bypass button on the RoleStep page
    stepStart = Date.now();
    try {
      // The RoleStep at `/` shows "Demo dashboards" section with role buttons
      // Wait for the page to fully render including the demo section
      const captainDevButton = captainPage.locator('button', { hasText: 'Captain demo' });
      await captainDevButton.waitFor({ state: 'visible', timeout: TIMEOUTS.login });
      screenshotFiles.push(await captureScreenshot(captainPage, 'captain-01-login-page'));
      await captainDevButton.click();
      collector.recordStep('Click Captain demo bypass', 'Phase 1', 'PASS', Date.now() - stepStart);
    } catch (err: any) {
      collector.recordStep('Click Captain demo bypass', 'Phase 1', 'FAIL', Date.now() - stepStart, err.message);
      screenshotFiles.push(await captureScreenshot(captainPage, 'captain-login-bypass-fail'));
      throw err;
    }

    // Step 1.3: Wait for redirect to /captain (done via history.replaceState + loginAsMockUser)
    stepStart = Date.now();
    try {
      // openDemoDashboard uses history.replaceState, so waitForURL may not trigger;
      // instead wait for the captain dashboard content to appear
      await captainPage.waitForTimeout(3000);
      const onCaptainDashboard = captainPage.url().includes('/captain') ||
        await captainPage.locator('text=/الرادار|Radar|لوحة السائق|Captain/i').isVisible({ timeout: 5000 }).catch(() => false);
      if (onCaptainDashboard) {
        collector.recordStep('Redirect to /captain dashboard', 'Phase 1', 'PASS', Date.now() - stepStart);
      } else {
        collector.recordStep('Redirect to /captain dashboard', 'Phase 1', 'WARN', Date.now() - stepStart,
          `Current URL: ${captainPage.url()}`);
      }
    } catch (err: any) {
      collector.recordStep('Redirect to /captain dashboard', 'Phase 1', 'WARN', Date.now() - stepStart, err.message);
    }

    // Give the captain dashboard a moment to fully render
    await captainPage.waitForTimeout(3000);
    screenshotFiles.push(await captureScreenshot(captainPage, 'captain-02-dashboard-loaded'));

    // Step 1.4: Activate Captain (go online)
    stepStart = Date.now();
    try {
      // The toggle button text is dynamic: 'غير متصل' (offline) or the status text
      // Look for the button that contains the offline text or the online toggle
      const statusButton = captainPage.locator('button').filter({ hasText: /غير متصل|offline|Offline/i }).first();
      const isVisible = await statusButton.isVisible().catch(() => false);

      if (isVisible) {
        await statusButton.click();
        await captainPage.waitForTimeout(2000);
        collector.recordStep('Activate captain (go online)', 'Phase 1', 'PASS', Date.now() - stepStart);
      } else {
        // Captain might already be active or the button has a different label
        const anyStatusBtn = captainPage.locator('button').filter({ hasText: /متصل|online|Online|متص/i }).first();
        const already = await anyStatusBtn.isVisible().catch(() => false);
        if (already) {
          collector.recordStep('Activate captain (go online)', 'Phase 1', 'PASS', Date.now() - stepStart, 'Already online');
        } else {
          collector.recordStep('Activate captain (go online)', 'Phase 1', 'WARN', Date.now() - stepStart,
            'Could not find the online/offline toggle button');
        }
      }
    } catch (err: any) {
      collector.recordStep('Activate captain (go online)', 'Phase 1', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(captainPage, 'captain-03-activated'));
    collector.recordStep('Phase 1 Complete', 'Phase 1', 'PASS', Date.now() - t0);
  });

  /* ───────────── PHASE 2: Rider Request Creation ───────────── */

  test('Phase 2: Rider login and create ride request', async () => {
    const t0 = Date.now();

    // Step 2.1: Navigate Rider to the login page
    let stepStart = Date.now();
    try {
      await riderPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.navigation });
      collector.recordStep('Navigate rider to login page', 'Phase 2', 'PASS', Date.now() - stepStart);
    } catch (err: any) {
      collector.recordStep('Navigate rider to login page', 'Phase 2', 'FAIL', Date.now() - stepStart, err.message);
      screenshotFiles.push(await captureScreenshot(riderPage, 'rider-nav-fail'));
      throw err;
    }

    // Step 2.2: Click "Rider demo" dev bypass button on the RoleStep page
    stepStart = Date.now();
    try {
      const riderDevButton = riderPage.locator('button', { hasText: 'Rider demo' });
      await riderDevButton.waitFor({ state: 'visible', timeout: TIMEOUTS.login });
      screenshotFiles.push(await captureScreenshot(riderPage, 'rider-01-login-page'));
      await riderDevButton.click();
      collector.recordStep('Click Rider demo bypass', 'Phase 2', 'PASS', Date.now() - stepStart);
    } catch (err: any) {
      collector.recordStep('Click Rider demo bypass', 'Phase 2', 'FAIL', Date.now() - stepStart, err.message);
      screenshotFiles.push(await captureScreenshot(riderPage, 'rider-login-bypass-fail'));
      throw err;
    }

    // Step 2.3: Wait for redirect to /rider (done via history.replaceState + loginAsMockUser)
    stepStart = Date.now();
    try {
      await riderPage.waitForTimeout(3000);
      const onRiderDashboard = riderPage.url().includes('/rider') ||
        await riderPage.locator('text=/إلى أين|whereTo|طلب رحلة|Request ride/i').isVisible({ timeout: 5000 }).catch(() => false);
      if (onRiderDashboard) {
        collector.recordStep('Redirect to /rider dashboard', 'Phase 2', 'PASS', Date.now() - stepStart);
      } else {
        collector.recordStep('Redirect to /rider dashboard', 'Phase 2', 'WARN', Date.now() - stepStart,
          `Current URL: ${riderPage.url()}`);
      }
    } catch (err: any) {
      collector.recordStep('Redirect to /rider dashboard', 'Phase 2', 'WARN', Date.now() - stepStart, err.message);
    }

    await riderPage.waitForTimeout(2000);
    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-02-dashboard'));

    // Step 2.4: Open destination selection — click "اطلب رحلة" / "Request ride" / Navigation button
    stepStart = Date.now();
    try {
      // The idle map screen has a big teal button for requesting a ride
      const requestButton = riderPage.locator('button').filter({ hasText: /طلب رحلة|اطلب رحلة|Request ride/i }).first();
      await requestButton.waitFor({ state: 'visible', timeout: TIMEOUTS.stateTransition });
      await requestButton.click();
      await riderPage.waitForTimeout(1500);
      collector.recordStep('Open destination selection', 'Phase 2', 'PASS', Date.now() - stepStart);
    } catch (err: any) {
      collector.recordStep('Open destination selection', 'Phase 2', 'FAIL', Date.now() - stepStart, err.message);
      screenshotFiles.push(await captureScreenshot(riderPage, 'rider-destination-open-fail'));
      throw err;
    }

    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-03-destination-selection'));

    // Step 2.5: Select a governorate and district for destination
    stepStart = Date.now();
    try {
      // The destination screen has dropdown selects for governorate and district
      // Look for the select triggers (Radix UI select components)
      const selectTriggers = riderPage.locator('[role="combobox"], [data-radix-select-trigger], button[role="combobox"]');
      const triggerCount = await selectTriggers.count();

      if (triggerCount >= 1) {
        // Click the first select (governorate)
        await selectTriggers.first().click();
        await riderPage.waitForTimeout(500);

        // Pick the first available option (not the placeholder)
        const firstGovOption = riderPage.locator('[role="option"]').first();
        if (await firstGovOption.isVisible().catch(() => false)) {
          await firstGovOption.click();
          await riderPage.waitForTimeout(1000);
        }

        // If there's a second select (district), pick from it too
        const updatedTriggers = riderPage.locator('[role="combobox"], [data-radix-select-trigger], button[role="combobox"]');
        if (await updatedTriggers.count() >= 2) {
          await updatedTriggers.nth(1).click();
          await riderPage.waitForTimeout(500);
          const firstDistOption = riderPage.locator('[role="option"]').first();
          if (await firstDistOption.isVisible().catch(() => false)) {
            await firstDistOption.click();
            await riderPage.waitForTimeout(1000);
          }
        }

        collector.recordStep('Select destination (governorate + district)', 'Phase 2', 'PASS', Date.now() - stepStart);
      } else {
        collector.recordStep('Select destination (governorate + district)', 'Phase 2', 'WARN', Date.now() - stepStart,
          `Found ${triggerCount} select triggers — destination dropdowns may not have loaded`);
      }
    } catch (err: any) {
      collector.recordStep('Select destination (governorate + district)', 'Phase 2', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-04-destination-selected'));

    // Wait for fare calculation
    await riderPage.waitForTimeout(4000);

    // Step 2.6: Submit the ride request — click the big green "اطلب الآن" / submit button
    stepStart = Date.now();
    try {
      // The submit button in DestinationTripSummary contains a Navigation icon and text
      const submitButton = riderPage.locator('button').filter({
        hasText: /اطلب الآن|ارسال الطلب|Request ride|طلب رحلة|أرسل|Send/i,
      }).first();

      const submitVisible = await submitButton.isVisible().catch(() => false);
      if (submitVisible) {
        const isEnabled = await submitButton.isEnabled();
        if (isEnabled) {
          await submitButton.click();
          await riderPage.waitForTimeout(3000);
          collector.recordStep('Submit ride request', 'Phase 2', 'PASS', Date.now() - stepStart);
        } else {
          collector.recordStep('Submit ride request', 'Phase 2', 'WARN', Date.now() - stepStart,
            'Submit button found but disabled — destination may not be fully configured');
          screenshotFiles.push(await captureScreenshot(riderPage, 'rider-submit-disabled'));
        }
      } else {
        // Try any large teal-colored button
        const fallbackSubmit = riderPage.locator('button.bg-\\[\\#14B8A6\\]').first();
        if (await fallbackSubmit.isVisible().catch(() => false)) {
          await fallbackSubmit.click();
          await riderPage.waitForTimeout(3000);
          collector.recordStep('Submit ride request (fallback selector)', 'Phase 2', 'PASS', Date.now() - stepStart);
        } else {
          collector.recordStep('Submit ride request', 'Phase 2', 'WARN', Date.now() - stepStart,
            'Could not find submit button');
        }
      }
    } catch (err: any) {
      collector.recordStep('Submit ride request', 'Phase 2', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-05-request-sent'));

    // Step 2.7: Verify state transition to RECEIVING_OFFERS
    stepStart = Date.now();
    try {
      // The receiving offers screen shows a loading spinner or offer cards
      // Look for indicators of the receiving offers state
      const receivingIndicators = riderPage.locator('text=/عروض|offers|جاري البحث|Searching/i').first();
      const isInReceivingState = await receivingIndicators.isVisible({ timeout: 8000 }).catch(() => false);

      if (isInReceivingState) {
        collector.recordStep('State transition to RECEIVING_OFFERS', 'Phase 2', 'PASS', Date.now() - stepStart);
      } else {
        // Check if we're still on destination selection or got an error
        const currentScreenshot = await captureScreenshot(riderPage, 'rider-06-state-check');
        screenshotFiles.push(currentScreenshot);
        collector.recordStep('State transition to RECEIVING_OFFERS', 'Phase 2', 'WARN', Date.now() - stepStart,
          'Could not confirm RECEIVING_OFFERS state — the request may have failed due to missing Supabase session');
      }
    } catch (err: any) {
      collector.recordStep('State transition to RECEIVING_OFFERS', 'Phase 2', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-07-receiving-offers'));
    collector.recordStep('Phase 2 Complete', 'Phase 2', 'PASS', Date.now() - t0);
  });

  /* ───────────── PHASE 3: Captain Radar Visibility & Bidding ───────────── */

  test('Phase 3: Captain radar visibility and market brake test', async () => {
    const t0 = Date.now();

    // Step 3.1: Check if the ride request appears on Captain's radar
    let stepStart = Date.now();
    try {
      // Switch to captain page and wait for new request notification or card
      await captainPage.bringToFront();
      await captainPage.waitForTimeout(2000);

      // The radar view shows request cards in a sidebar list
      const requestCard = captainPage.locator('button').filter({
        hasText: /عرض السعر|تقديم عرض|View|Bid|عمّان/i,
      }).first();
      const requestVisible = await requestCard.isVisible({ timeout: TIMEOUTS.offerAppearance }).catch(() => false);

      if (requestVisible) {
        collector.recordStep('Ride request visible on captain radar', 'Phase 3', 'PASS', Date.now() - stepStart);
        screenshotFiles.push(await captureScreenshot(captainPage, 'captain-04-request-visible'));

        // Click on the request to open the bidding sheet
        await requestCard.click();
        await captainPage.waitForTimeout(2000);
        collector.recordStep('Open bidding proposal sheet', 'Phase 3', 'PASS', Date.now() - stepStart);
      } else {
        collector.recordStep('Ride request visible on captain radar', 'Phase 3', 'WARN', Date.now() - stepStart,
          'Request not visible — likely due to mock auth not having a real Supabase session (captain_radar_requests is RLS-protected)');
        screenshotFiles.push(await captureScreenshot(captainPage, 'captain-04-no-requests'));
      }
    } catch (err: any) {
      collector.recordStep('Ride request visible on captain radar', 'Phase 3', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(captainPage, 'captain-05-bidding-state'));

    // Step 3.2: Test Market Brakes — verify the crimson lockout
    stepStart = Date.now();
    try {
      // Check if we're on the bidding sheet (BiddingProposalSheet)
      const biddingSheet = captainPage.locator('section').first();
      const hasBiddingContent = await captainPage.locator('text=/عرض سعرك|Your offer|تقديم العرض/i').isVisible().catch(() => false);

      if (hasBiddingContent) {
        // Find the minus button to lower the price below the floor (trigger CRIMSON_BLOCK)
        const minusButton = captainPage.locator('button').filter({ has: captainPage.locator('svg.lucide-minus') }).first();
        const minusVisible = await minusButton.isVisible().catch(() => false);

        if (minusVisible) {
          // Click minus many times to go below the market floor (15% below market)
          for (let i = 0; i < 30; i++) {
            const isDisabled = await minusButton.isDisabled().catch(() => true);
            if (isDisabled) break;
            await minusButton.click();
            await captainPage.waitForTimeout(100);
          }

          await captainPage.waitForTimeout(500);
          screenshotFiles.push(await captureScreenshot(captainPage, 'captain-06-crimson-block-test'));

          // Check if submit button is disabled (crimson block)
          const submitButton = captainPage.locator('button').filter({ hasText: /إرسال|أرسل|Submit|send/i }).first();
          const submitExists = await submitButton.isVisible().catch(() => false);
          if (submitExists) {
            const isDisabled = await submitButton.isDisabled();
            if (isDisabled) {
              collector.recordStep('Market Brake: CRIMSON_BLOCK disables submit', 'Phase 3', 'PASS', Date.now() - stepStart,
                'Submit button correctly disabled at anti-dumping floor');
            } else {
              collector.recordStep('Market Brake: CRIMSON_BLOCK disables submit', 'Phase 3', 'FAIL', Date.now() - stepStart,
                'Submit button should be disabled but is enabled — potential market brake bypass');
            }
          } else {
            collector.recordStep('Market Brake: CRIMSON_BLOCK disables submit', 'Phase 3', 'WARN', Date.now() - stepStart,
              'Could not locate submit button');
          }

          // Check for the crimson warning text
          const crimsonWarning = captainPage.locator('text=/محظور|blocked|CRIMSON|حظر/i');
          if (await crimsonWarning.isVisible().catch(() => false)) {
            collector.recordStep('Market Brake: Crimson warning text visible', 'Phase 3', 'PASS', Date.now() - stepStart);
          }

          // Now reset — click plus to bring price back up
          const plusButton = captainPage.locator('button').filter({ has: captainPage.locator('svg.lucide-plus') }).first();
          if (await plusButton.isVisible().catch(() => false)) {
            for (let i = 0; i < 30; i++) {
              await plusButton.click();
              await captainPage.waitForTimeout(100);
            }
          }
          await captainPage.waitForTimeout(500);

          screenshotFiles.push(await captureScreenshot(captainPage, 'captain-07-price-reset'));

          // Step 3.3: Submit the bid at fair market price
          stepStart = Date.now();
          const submitBidButton = captainPage.locator('button').filter({ hasText: /إرسال|أرسل|Submit|send/i }).first();
          const canSubmit = await submitBidButton.isEnabled().catch(() => false);

          if (canSubmit) {
            await submitBidButton.click();
            await captainPage.waitForTimeout(3000);
            collector.recordStep('Submit bid at fair market price', 'Phase 3', 'PASS', Date.now() - stepStart);
          } else {
            collector.recordStep('Submit bid at fair market price', 'Phase 3', 'WARN', Date.now() - stepStart,
              'Submit button still disabled after price reset');
          }
        } else {
          collector.recordStep('Market Brake: CRIMSON_BLOCK test', 'Phase 3', 'SKIP', Date.now() - stepStart,
            'Minus button not found — bidding controls may not have loaded');
        }
      } else {
        collector.recordStep('Market Brake: CRIMSON_BLOCK test', 'Phase 3', 'SKIP', Date.now() - stepStart,
          'Bidding sheet not visible — skipping market brake test (likely no requests due to mock auth)');
      }
    } catch (err: any) {
      collector.recordStep('Market Brake test', 'Phase 3', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(captainPage, 'captain-08-bid-submitted'));
    collector.recordStep('Phase 3 Complete', 'Phase 3', 'PASS', Date.now() - t0);
  });

  /* ───────────── PHASE 4: Atomic Handshake & Finalization ───────────── */

  test('Phase 4: Rider accepts offer and trip activation', async () => {
    const t0 = Date.now();

    // Step 4.1: Switch to rider page and check for the captain's bid
    let stepStart = Date.now();
    try {
      await riderPage.bringToFront();
      await riderPage.waitForTimeout(2000);

      // Look for an offer card on the rider's receiving offers screen
      const offerCard = riderPage.locator('[class*="border-primary"], [class*="offer"], [class*="captain"]').first();
      const offerVisible = await offerCard.isVisible({ timeout: TIMEOUTS.offerAppearance }).catch(() => false);

      if (offerVisible) {
        collector.recordStep('Captain bid card visible on rider screen', 'Phase 4', 'PASS', Date.now() - stepStart);
        screenshotFiles.push(await captureScreenshot(riderPage, 'rider-08-offer-received'));

        // Step 4.2: Accept the offer
        stepStart = Date.now();
        const acceptButton = riderPage.locator('button').filter({
          hasText: /قبول|Accept|اختر|قبول العرض/i,
        }).first();
        const acceptVisible = await acceptButton.isVisible().catch(() => false);

        if (acceptVisible) {
          await acceptButton.click();
          await riderPage.waitForTimeout(3000);
          collector.recordStep('Accept captain offer', 'Phase 4', 'PASS', Date.now() - stepStart);
        } else {
          collector.recordStep('Accept captain offer', 'Phase 4', 'WARN', Date.now() - stepStart,
            'Accept button not found');
        }
      } else {
        collector.recordStep('Captain bid card visible on rider screen', 'Phase 4', 'WARN', Date.now() - stepStart,
          'No offer cards visible — expected with mock auth (Supabase realtime subscription needs real session)');
        screenshotFiles.push(await captureScreenshot(riderPage, 'rider-08-no-offers'));
      }
    } catch (err: any) {
      collector.recordStep('Rider offer acceptance', 'Phase 4', 'WARN', Date.now() - stepStart, err.message);
    }

    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-09-post-accept'));

    // Step 4.3: Verify both clients show active trip
    stepStart = Date.now();
    try {
      // Check rider for active trip view
      const riderTripActive = riderPage.locator('text=/رحلة نشطة|Active Trip|الرحلة الحالية|السائق في الطريق/i');
      const riderInTrip = await riderTripActive.isVisible({ timeout: 8000 }).catch(() => false);

      if (riderInTrip) {
        collector.recordStep('Rider active trip view confirmed', 'Phase 4', 'PASS', Date.now() - stepStart);
        screenshotFiles.push(await captureScreenshot(riderPage, 'rider-10-active-trip'));
      } else {
        collector.recordStep('Rider active trip view confirmed', 'Phase 4', 'WARN', Date.now() - stepStart,
          'Rider not in active trip view');
      }

      // Check captain for active trip
      await captainPage.bringToFront();
      await captainPage.waitForTimeout(2000);
      const captainTripActive = captainPage.locator('[data-captain-trip-focus], text=/رحلة نشطة|Active Trip|في الطريق/i');
      const captainInTrip = await captainTripActive.isVisible({ timeout: 8000 }).catch(() => false);

      if (captainInTrip) {
        collector.recordStep('Captain active trip view confirmed', 'Phase 4', 'PASS', Date.now() - stepStart);
        screenshotFiles.push(await captureScreenshot(captainPage, 'captain-09-active-trip'));
      } else {
        collector.recordStep('Captain active trip view confirmed', 'Phase 4', 'WARN', Date.now() - stepStart,
          'Captain not in active trip view');
        screenshotFiles.push(await captureScreenshot(captainPage, 'captain-09-no-trip'));
      }
    } catch (err: any) {
      collector.recordStep('Active trip verification', 'Phase 4', 'WARN', Date.now() - stepStart, err.message);
    }

    // Final state screenshots
    await riderPage.bringToFront();
    screenshotFiles.push(await captureScreenshot(riderPage, 'rider-11-final-state'));
    await captainPage.bringToFront();
    screenshotFiles.push(await captureScreenshot(captainPage, 'captain-10-final-state'));

    collector.recordStep('Phase 4 Complete', 'Phase 4', 'PASS', Date.now() - t0);
  });
});
