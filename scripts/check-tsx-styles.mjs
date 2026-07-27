import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const TAILWIND_TOKEN = /(?:^|\s)(?:[a-z-]+:)*(?:-?m[trblxy]?|-?p[trblxy]?|flex|grid|block|hidden|absolute|relative|fixed|sticky|w-|h-|min-|max-|text-|bg-|border|rounded|shadow|gap-|space-|items-|justify-|overflow-|z-|opacity-|animate-|transition|duration-|font-)/;

export async function checkTsxStyles(rootDir) {
  const rootPath = toPath(rootDir);
  const files = await collectFiles(rootPath, '.tsx');
  const violations = [];

  for (const file of files) {
    const sourceText = await fs.readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const relativeFile = path.relative(rootPath, file).replaceAll('\\', '/');
    const styleDeclarations = sourceFile.statements.filter(isModuleStylesDeclaration);

    if (styleDeclarations.length === 0) {
      violations.push(violation(relativeFile, 1, 'missing module-level styles object'));
    } else if (styleDeclarations.length > 1) {
      for (const declaration of styleDeclarations.slice(1)) {
        violations.push(violation(relativeFile, lineOf(sourceFile, declaration), 'multiple module-level styles objects'));
      }
    }

    visit(sourceFile, (node) => {
      if (ts.isJsxAttribute(node) && node.name.text === 'className') {
        const initializer = node.initializer;
        if (initializer && ts.isStringLiteral(initializer)) {
          violations.push(violation(relativeFile, lineOf(sourceFile, node), 'inline className string'));
          return;
        }

        if (
          initializer &&
          ts.isJsxExpression(initializer) &&
          initializer.expression &&
          (ts.isTemplateExpression(initializer.expression) || ts.isNoSubstitutionTemplateLiteral(initializer.expression))
        ) {
          violations.push(violation(relativeFile, lineOf(sourceFile, node), 'inline className template'));
          return;
        }

        if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
          inspectClassExpression(initializer.expression, sourceFile, relativeFile, violations);
        }
      }

      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        isInsideFunction(node) &&
        containsTailwindLiteral(node.initializer)
      ) {
        violations.push(violation(relativeFile, lineOf(sourceFile, node), 'component-local Tailwind class value'));
      }
    });
  }

  return violations;
}

function inspectClassExpression(expression, sourceFile, file, violations) {
  visit(expression, (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      TAILWIND_TOKEN.test(node.text)
    ) {
      violations.push(violation(file, lineOf(sourceFile, node), 'Tailwind class literal inside JSX expression'));
    }
  });
}

function containsTailwindLiteral(node) {
  let found = false;
  visit(node, (child) => {
    if ((ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) && TAILWIND_TOKEN.test(child.text)) {
      found = true;
    }
  });
  return found;
}

function isModuleStylesDeclaration(statement) {
  if (!ts.isVariableStatement(statement)) return false;
  return statement.declarationList.declarations.some((declaration) =>
    ts.isIdentifier(declaration.name) &&
    declaration.name.text === 'styles' &&
    declaration.initializer !== undefined,
  );
}

function isInsideFunction(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionLike(current)) return true;
    if (ts.isSourceFile(current)) return false;
    current = current.parent;
  }
  return false;
}

function visit(node, callback) {
  callback(node);
  node.forEachChild((child) => visit(child, callback));
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function violation(file, line, reason) {
  return { file, line, reason };
}

async function collectFiles(rootPath, extension) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function toPath(value) {
  return value instanceof URL ? fileURLToPath(value) : path.resolve(value);
}
