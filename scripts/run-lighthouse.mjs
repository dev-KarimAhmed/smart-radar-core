import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port = 3100;
const routes = process.argv.slice(2);
const targets = routes.length ? routes : ['/', '/rider', '/captain', '/register?role=rider', '/advertiser/dashboard', '/delegate', '/admin'];
const nextBin = path.resolve('../../node_modules/next/dist/bin/next');
const server = spawn(process.execPath, [nextBin, 'start', '--port', String(port)], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(`http://127.0.0.1:${port}/`);
  const results = [];

  for (const route of targets) {
    const reportPath = path.join(os.tmpdir(), `radar-lighthouse-${sanitize(route)}.json`);
    await run('npx.cmd', [
      '--yes',
      'lighthouse@12.8.2',
      `http://127.0.0.1:${port}${route}`,
      '--chrome-path=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      '--output=json',
      `--output-path=${reportPath}`,
      '--only-categories=performance',
      '--form-factor=mobile',
      '--screenEmulation.mobile=true',
      '--chrome-flags=--headless --no-sandbox --disable-gpu --incognito',
      '--quiet',
    ]);
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    results.push({
      route,
      performance: Math.round(report.categories.performance.score * 100),
      fcpMs: Math.round(report.audits['first-contentful-paint'].numericValue),
      lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
      ttfbMs: Math.round(report.audits['server-response-time'].numericValue),
      tbtMs: Math.round(report.audits['total-blocking-time'].numericValue),
      cls: Number(report.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      transferredBytes: Math.round(report.audits['total-byte-weight'].numericValue),
      lcpElement: report.audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet,
      lcpBreakdown: report.audits['lcp-breakdown-insight']?.details,
    });
    await fs.rm(reportPath, { force: true });
  }

  console.table(results);
  console.log(JSON.stringify(results, null, 2));
} finally {
  server.kill();
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for the production server');
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

function sanitize(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
}
