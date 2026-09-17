import { Project, SyntaxKind, Node } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.tsx');

const arJsonPath = path.join(__dirname, '../src/messages/ar.json');
const enJsonPath = path.join(__dirname, '../src/messages/en.json');

const arMessages = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

if (!arMessages.auto) arMessages.auto = {};
if (!enMessages.auto) enMessages.auto = {};

const ARABIC_REGEX = /[\u0600-\u06FF]/;
let modifiedFilesCount = 0;

function hashString(str: string) {
  return 'key_' + crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
}

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  const fileName = path.relative(process.cwd(), filePath);
  
  if (fileName.includes('i18n') || fileName.includes('messages')) continue;

  let fileModified = false;
  const functionsToInjectHook = new Set<Node>();

  sourceFile.forEachDescendant((node) => {
    const lineNum = node.getStartLineNumber();
    const lineText = sourceFile.getFullText().split('\n')[lineNum - 1] || '';
    if (lineText.includes('@rad-ignore-i18n') || lineText.includes('eslint-disable-next-line')) return;
    const prevLineText = sourceFile.getFullText().split('\n')[lineNum - 2] || '';
    if (prevLineText.includes('@rad-ignore-i18n') || prevLineText.includes('eslint-disable-next-line')) return;

    // Check if node is inside JSX
    const isInsideJsx = node.getFirstAncestorByKind(SyntaxKind.JsxElement) || 
                        node.getFirstAncestorByKind(SyntaxKind.JsxSelfClosingElement) ||
                        node.getFirstAncestorByKind(SyntaxKind.JsxFragment);
    if (!isInsideJsx) return; // ONLY fix inside JSX

    // Find the enclosing function/arrow function
    let enclosingFunction: Node | undefined = node.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
    if (!enclosingFunction) {
      enclosingFunction = node.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
    }
    if (!enclosingFunction) {
      enclosingFunction = node.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
    }
    
    if (!enclosingFunction) return; // Must be inside a function

    if (Node.isJsxText(node)) {
      const text = node.getLiteralText();
      const trimmedText = text.trim();
      if (trimmedText && /[a-zA-Z\u0600-\u06FF]/.test(trimmedText) && ARABIC_REGEX.test(trimmedText)) {
        const key = hashString(trimmedText);
        arMessages.auto[key] = trimmedText;
        enMessages.auto[key] = trimmedText + ' (EN)';
        
        const originalText = node.getText();
        const leadingSpace = originalText.substring(0, originalText.indexOf(trimmedText));
        const trailingSpace = originalText.substring(originalText.indexOf(trimmedText) + trimmedText.length);
        
        node.replaceWithText(`${leadingSpace}{t('${key}')}${trailingSpace}`);
        fileModified = true;
        functionsToInjectHook.add(enclosingFunction);
      }
    } else if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.getLiteralValue();
      if (ARABIC_REGEX.test(text)) {
        const callExpr = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
        if (callExpr) {
          const expr = callExpr.getExpression();
          if (Node.isIdentifier(expr) && (expr.getText() === 't' || expr.getText() === 'translate')) {
            return;
          }
          if (Node.isPropertyAccessExpression(expr) && expr.getText().startsWith('console.')) return;
        }

        const key = hashString(text);
        arMessages.auto[key] = text;
        enMessages.auto[key] = text + ' (EN)';
        
        if (node.getParentIfKind(SyntaxKind.JsxAttribute)) {
          node.replaceWithText(`{t('${key}')}`);
        } else {
          node.replaceWithText(`t('${key}')`);
        }
        fileModified = true;
        functionsToInjectHook.add(enclosingFunction);
      }
    }
  });

  if (fileModified) {
    // Add import if missing
    const importDecls = sourceFile.getImportDeclarations();
    let hasUseTranslations = false;
    for (const imp of importDecls) {
      if (imp.getModuleSpecifierValue() === 'next-intl') {
        if (imp.getNamedImports().some(ni => ni.getName() === 'useTranslations')) {
          hasUseTranslations = true;
          break;
        }
      }
    }

    if (!hasUseTranslations) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'next-intl',
        namedImports: ['useTranslations'],
      });
    }

    // Inject hook in all collected functions
    for (const func of functionsToInjectHook) {
      let body: Node | undefined;
      if (Node.isFunctionDeclaration(func)) body = func.getBody();
      else if (Node.isArrowFunction(func)) body = func.getBody();
      else if (Node.isFunctionExpression(func)) body = func.getBody();

      if (body && Node.isBlock(body)) {
        // Check if `const t = ` already exists
        const blockText = body.getText();
        if (!blockText.includes('useTranslations(') && !blockText.includes('const t =')) {
          body.insertStatements(0, `const t = useTranslations('auto');`);
        }
      }
    }

    sourceFile.saveSync();
    modifiedFilesCount++;
    console.log(`Updated ${fileName}`);
  }
}

fs.writeFileSync(arJsonPath, JSON.stringify(arMessages, null, 2), 'utf8');
fs.writeFileSync(enJsonPath, JSON.stringify(enMessages, null, 2), 'utf8');
console.log(`Done! Modified ${modifiedFilesCount} files.`);
