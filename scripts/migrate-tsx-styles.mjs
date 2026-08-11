import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function transformTsxStyles(source, fileName = 'component.tsx') {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sourceFile.statements.some(isModuleStylesDeclaration)) return source;

  const entries = [];
  const edits = [];
  let sequence = 0;
  let needsCn = false;

  const addStyle = (value, node) => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    const key = `style${line}_${sequence += 1}`;
    entries.push({ key, value });
    return `styles.${key}`;
  };

  visit(sourceFile, (node) => {
    if (!ts.isJsxAttribute(node) || node.name.text !== 'className' || !node.initializer) return;

    if (ts.isStringLiteral(node.initializer)) {
      edits.push({
        start: node.initializer.getStart(sourceFile),
        end: node.initializer.end,
        text: `{${addStyle(node.initializer.text, node.initializer)}}`,
      });
      return;
    }

    if (!ts.isJsxExpression(node.initializer) || !node.initializer.expression) return;
    const expression = node.initializer.expression;

    if (ts.isNoSubstitutionTemplateLiteral(expression)) {
      edits.push({
        start: expression.getStart(sourceFile),
        end: expression.end,
        text: addStyle(expression.text, expression),
      });
      return;
    }

    if (ts.isTemplateExpression(expression)) {
      needsCn = true;
      const parts = [];
      if (expression.head.text.trim()) parts.push(addStyle(expression.head.text.trim(), expression.head));
      for (const span of expression.templateSpans) {
        parts.push(transformExpression(span.expression));
        if (span.literal.text.trim()) parts.push(addStyle(span.literal.text.trim(), span.literal));
      }
      edits.push({
        start: expression.getStart(sourceFile),
        end: expression.end,
        text: `cn(${parts.join(', ')})`,
      });
      return;
    }

    const expressionEdits = [];
    visit(expression, (child) => {
      if (
        (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) &&
        child.text.trim() &&
        isClassValueLiteral(child, expression)
      ) {
        expressionEdits.push({
          start: child.getStart(sourceFile),
          end: child.end,
          text: addStyle(child.text, child),
        });
      }
    });
    edits.push(...expressionEdits);
  });

  if (entries.length === 0) {
    entries.push({ key: 'root', value: '' });
  }

  let output = applyEdits(source, edits);
  const insertionPoint = findImportInsertionPoint(sourceFile);
  const hasCnImport = /import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*['"]@\/lib\/utils['"]/.test(source);
  const importText = needsCn && !hasCnImport ? "\nimport { cn } from '@/lib/utils';" : '';
  const stylesText = `\n${importText}\nconst styles = {\n${entries
    .map(({ key, value }) => `  ${key}: ${JSON.stringify(value)},`)
    .join('\n')}\n} as const;\n`;

  const adjustedInsertionPoint = translatePosition(insertionPoint, edits);
  output = `${output.slice(0, adjustedInsertionPoint)}${stylesText}${output.slice(adjustedInsertionPoint)}`;
  return output;

  function transformExpression(expression) {
    const expressionSource = source.slice(expression.getStart(sourceFile), expression.end);
    const localEdits = [];
    visit(expression, (child) => {
      if (
        (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) &&
        child.text.trim() &&
        isClassValueLiteral(child, expression)
      ) {
        localEdits.push({
          start: child.getStart(sourceFile) - expression.getStart(sourceFile),
          end: child.end - expression.getStart(sourceFile),
          text: addStyle(child.text, child),
        });
      }
    });
    return applyEdits(expressionSource, localEdits);
  }
}

async function runCli(paths) {
  for (const inputPath of paths) {
    const absolutePath = path.resolve(inputPath);
    const source = await fs.readFile(absolutePath, 'utf8');
    const output = transformTsxStyles(source, absolutePath);
    if (output !== source) await fs.writeFile(absolutePath, output, 'utf8');
  }
}

function applyEdits(source, edits) {
  let output = source;
  for (const edit of [...edits].sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`;
  }
  return output;
}

function translatePosition(position, edits) {
  return edits.reduce((translated, edit) => {
    if (edit.end > position) return translated;
    return translated + edit.text.length - (edit.end - edit.start);
  }, position);
}

function findImportInsertionPoint(sourceFile) {
  let position = 0;
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) {
      position = statement.end;
      continue;
    }
    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      position === 0
    ) {
      position = statement.end;
      continue;
    }
    break;
  }
  return position;
}

function isModuleStylesDeclaration(statement) {
  return ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.some((declaration) =>
      ts.isIdentifier(declaration.name) && declaration.name.text === 'styles'
    );
}

function isClassValueLiteral(node, root) {
  let child = node;
  let parent = node.parent;
  while (parent && child !== root) {
    if (ts.isConditionalExpression(parent)) {
      return child === parent.whenTrue || child === parent.whenFalse;
    }
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return child === parent.right;
    }
    if (ts.isCallExpression(parent)) {
      return parent.arguments.includes(child);
    }
    if (ts.isArrayLiteralExpression(parent)) {
      return parent.elements.includes(child);
    }
    child = parent;
    parent = parent.parent;
  }
  return false;
}

function visit(node, callback) {
  callback(node);
  node.forEachChild((child) => visit(child, callback));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.length < 3) {
    throw new Error('Usage: node scripts/migrate-tsx-styles.mjs <file.tsx> [...]');
  }
  await runCli(process.argv.slice(2));
}
