import { Project, SyntaxKind, Node, StringLiteral, JsxText, NoSubstitutionTemplateLiteral } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// 1. Initialize ts-morph Project
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const arabicRegex = /[\u0600-\u06FF]/;
let totalReplaced = 0;

// 2. Load existing translations
const arJsonPath = path.resolve('src/messages/ar.json');
const enJsonPath = path.resolve('src/messages/en.json');
const arJson = JSON.parse(fs.readFileSync(arJsonPath, 'utf-8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

if (!arJson.extracted) arJson.extracted = {};
if (!enJson.extracted) enJson.extracted = {};

function generateKey(text: string) {
  const hash = crypto.createHash('md5').update(text.trim()).digest('hex').substring(0, 6);
  return `auto_${hash}`;
}

function processNode(node: Node, tFuncName: string, fileUpdated: { value: boolean }) {
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    const text = node.getLiteralText();
    if (arabicRegex.test(text)) {
      // Don't replace if inside an import
      if (node.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) return;
      // Don't replace if it's already inside a `t()` call
      const callExpr = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
      if (callExpr && callExpr.getExpression().getText() === tFuncName) return;
      // Don't replace if it's a JSX attribute that is not children/string type 
      // Actually strings in JSX attributes like placeholder="عربي" should be replaced with placeholder={t('key')}
      const key = generateKey(text);
      arJson.extracted[key] = text;
      enJson.extracted[key] = text; // Just copy Arabic for now

      const parent = node.getParent();
      if (Node.isJsxAttribute(parent)) {
        node.replaceWithText(`{${tFuncName}('${key}')}`);
      } else {
        node.replaceWithText(`${tFuncName}('${key}')`);
      }
      fileUpdated.value = true;
      totalReplaced++;
      return; // Stop traversing children
    }
  } else if (Node.isJsxText(node)) {
    const text = node.getText();
    if (arabicRegex.test(text)) {
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        const key = generateKey(trimmed);
        arJson.extracted[key] = trimmed;
        enJson.extracted[key] = trimmed;
        node.replaceWithText(`{${tFuncName}('${key}')}`);
        fileUpdated.value = true;
        totalReplaced++;
      }
      return;
    }
  }

  node.forEachChild(child => processNode(child, tFuncName, fileUpdated));
}

// 3. Process Files
const files = project.getSourceFiles('src/**/*.{ts,tsx}');

for (const file of files) {
  if (file.getFilePath().includes('/messages/')) continue;

  const content = file.getText();
  if (!arabicRegex.test(content)) continue;

  let fileUpdated = { value: false };
  let tFuncName = 't';

  // Only inject useTranslations if it's a React component file (usually .tsx)
  if (file.getExtension() === '.tsx') {
    // Check if useTranslations is already imported
    let hasImport = false;
    for (const imp of file.getImportDeclarations()) {
      if (imp.getModuleSpecifierValue() === 'next-intl') {
        hasImport = true;
        const named = imp.getNamedImports().find(n => n.getName() === 'useTranslations');
        if (!named) imp.addNamedImport('useTranslations');
      }
    }
    
    if (!hasImport) {
      file.addImportDeclaration({
        namedImports: ['useTranslations'],
        moduleSpecifier: 'next-intl',
      });
    }

    // Process nodes
    file.forEachChild(child => processNode(child, tFuncName, fileUpdated));

    if (fileUpdated.value) {
      // Find the primary component function and inject `const t = useTranslations('extracted');`
      // This is a naive approach: we look for the default export or the first function that returns JSX
      const funcs = file.getFunctions();
      for (const func of funcs) {
        if (func.getBodyText()?.includes('<') || func.isDefaultExport()) {
          if (!func.getBodyText()?.includes('useTranslations(')) {
            func.insertStatements(0, `const t = useTranslations('extracted');`);
          }
          break;
        }
      }
      // If we couldn't inject, maybe it's an arrow function
      const varDecls = file.getVariableDeclarations();
      for (const v of varDecls) {
        const init = v.getInitializer();
        if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
          if (init.getBodyText()?.includes('<')) {
             if (!init.getBodyText()?.includes('useTranslations(')) {
                // If it's a block body
                if (Node.isBlock(init.getBody())) {
                  (init.getBody() as any).insertStatements(0, `const t = useTranslations('extracted');`);
                }
             }
             break;
          }
        }
      }
    }
  } else {
    // For .ts files, it's too risky to auto-inject hooks. Just flag them or skip.
    console.warn(`[WARNING] Skipping non-TSX file with Arabic text: ${file.getFilePath()}`);
  }

  if (fileUpdated.value) {
    file.saveSync();
  }
}

// 4. Save JSON files
fs.writeFileSync(arJsonPath, JSON.stringify(arJson, null, 2), 'utf-8');
fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf-8');

console.log(`Extraction complete. Replaced ${totalReplaced} strings.`);
