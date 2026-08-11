import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = process.cwd();
const nextPackage = fileURLToPath(import.meta.resolve('next/package.json'));
const playwrightPackage = fileURLToPath(import.meta.resolve('@playwright/test/package.json'));
const nextCli = path.join(path.dirname(nextPackage), 'dist', 'bin', 'next');
const playwrightCli = path.join(path.dirname(playwrightPackage), 'cli.js');
const port = '3101';
const baseURL = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, [nextCli, 'start', '-p', port], {
  cwd: projectRoot,
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);

try {
  await waitForServer(baseURL);
  const tests = spawn(process.execPath, [playwrightCli, 'test', 'tests/routes', ...process.argv.slice(2)], {
    cwd: projectRoot,
    env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: '1' },
    stdio: 'inherit',
    windowsHide: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    tests.once('error', reject);
    tests.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  server.kill();
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited before tests with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Production server did not become ready at ${url}`);
}
