import { promises as fs } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const chunksRoot = path.resolve('.next/static/chunks');
const budgetPath = path.resolve('tests/performance/bundle-budget.json');

const files = await collectFiles(chunksRoot);
const rows = await Promise.all(files.map(async (file) => {
  const contents = await fs.readFile(file);
  return {
    file: path.relative(chunksRoot, file).replaceAll('\\', '/'),
    rawBytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength,
  };
}));

rows.sort((left, right) => right.gzipBytes - left.gzipBytes);
console.table(rows.slice(0, 30));

const totals = rows.reduce(
  (result, row) => ({
    rawBytes: result.rawBytes + row.rawBytes,
    gzipBytes: result.gzipBytes + row.gzipBytes,
  }),
  { rawBytes: 0, gzipBytes: 0 },
);
console.log(JSON.stringify({ chunkCount: rows.length, ...totals }, null, 2));

try {
  const budget = JSON.parse(await fs.readFile(budgetPath, 'utf8'));
  if (totals.gzipBytes > budget.totalGzipBytes) {
    throw new Error(`Total gzip chunks ${totals.gzipBytes} exceed budget ${budget.totalGzipBytes}`);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

async function collectFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    if (entry.isFile() && /\.(?:js|css)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}
