import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const LAYERS = ['app', 'features', 'shared'];

export async function checkFeatureBoundaries(rootDir) {
  const rootPath = toPath(rootDir);
  const files = await collectSourceFiles(rootPath);
  const violations = [];

  for (const file of files) {
    const relativeFile = path.relative(rootPath, file).replaceAll('\\', '/');
    const sourceLayer = firstSegment(relativeFile);
    if (!LAYERS.includes(sourceLayer)) continue;

    const sourceFeature = sourceLayer === 'features' ? relativeFile.split('/')[1] : null;
    const sourceText = await fs.readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

    sourceFile.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
      const imported = normalizeImport(node.moduleSpecifier.text, relativeFile);
      if (!imported) return;

      const targetLayer = firstSegment(imported);
      const targetFeature = targetLayer === 'features' ? imported.split('/')[1] : null;
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

      if (sourceLayer === 'shared' && targetLayer === 'features') {
        violations.push({ file: relativeFile, line, reason: 'shared code cannot import a feature' });
      }

      if (sourceLayer === 'features' && targetLayer === 'app') {
        violations.push({ file: relativeFile, line, reason: 'features cannot import app routes' });
      }

      if (sourceLayer === 'features' && targetLayer === 'features' && sourceFeature !== targetFeature) {
        if (!imported.endsWith('/contract') && !imported.endsWith('/contract.ts')) {
          violations.push({
            file: relativeFile,
            line,
            reason: `feature "${sourceFeature}" cannot import internals from feature "${targetFeature}"`,
          });
        }
      }

      if (sourceLayer === 'app' && targetLayer !== 'features' && targetLayer !== 'shared' && targetLayer !== 'app') {
        violations.push({ file: relativeFile, line, reason: `app route cannot import legacy layer "${targetLayer}"` });
      }
    });
  }

  return violations;
}

function normalizeImport(specifier, relativeFile) {
  if (specifier.startsWith('@/')) return specifier.slice(2);
  if (!specifier.startsWith('.')) return null;

  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relativeFile), specifier));
  return resolved.replace(/\.(?:tsx?|jsx?)$/, '');
}

function firstSegment(value) {
  return value.split('/')[0];
}

async function collectSourceFiles(rootPath) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(entryPath));
    } else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function toPath(value) {
  return value instanceof URL ? fileURLToPath(value) : path.resolve(value);
}
