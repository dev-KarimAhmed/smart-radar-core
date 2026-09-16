import { Project, SyntaxKind, Node } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');

let totalIssues = 0;
const ARABIC_REGEX = /[\u0600-\u06FF]/;
const IGNORE_TEXT_REGEX = /^\s*$/; // Just whitespace

const USER_FACING_ATTRIBUTES = new Set([
  'placeholder',
  'title',
  'alt',
  'aria-label',
  'label',
]);

function isInsideTranslationCall(node: Node): boolean {
  const callExpr = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
  if (callExpr) {
    const expr = callExpr.getExpression();
    if (Node.isIdentifier(expr) && (expr.getText() === 't' || expr.getText() === 'translate')) {
      return true;
    }
    // Also ignore console.log / Error throwing for Arabic, though ideally even errors are translated
    if (Node.isPropertyAccessExpression(expr)) {
      if (expr.getText().startsWith('console.')) return true;
    }
  }
  
  const newExpr = node.getFirstAncestorByKind(SyntaxKind.NewExpression);
  if (newExpr) {
     const expr = newExpr.getExpression();
     if (Node.isIdentifier(expr) && expr.getText() === 'Error') {
       return true; // Ignore new Error('arabic text')
     }
  }
  return false;
}

console.log(`Scanning ${sourceFiles.length} files for hardcoded text...`);

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  const fileName = path.relative(process.cwd(), filePath);
  
  // Skip JSON files or translation config itself if necessary
  if (fileName.includes('i18n') || fileName.includes('messages')) continue;

  // Skip backend and non-UI core files that hold Arabic intentionally
  if (
    fileName.replace(/\\/g, '/').startsWith('src/core/') ||
    fileName.replace(/\\/g, '/').startsWith('src/server/') ||
    fileName.replace(/\\/g, '/').startsWith('src/lib/') ||
    fileName.replace(/\\/g, '/').startsWith('src/shared/services/')
  ) {
    continue;
  }

  const fileIssues: { line: number; text: string; reason: string }[] = [];

  sourceFile.forEachDescendant((node) => {
    // Skip if line has an ignore comment
    const lineNum = node.getStartLineNumber();
    const lineText = sourceFile.getFullText().split('\n')[lineNum - 1] || '';
    if (lineText.includes('@rad-ignore-i18n') || lineText.includes('eslint-disable-next-line')) {
      return;
    }
    
    // Check previous line for ignore comment
    const prevLineText = sourceFile.getFullText().split('\n')[lineNum - 2] || '';
    if (prevLineText.includes('@rad-ignore-i18n') || prevLineText.includes('eslint-disable-next-line')) {
      return;
    }
    // 1. Check JSX Text (Text directly inside JSX tags)
    if (Node.isJsxText(node)) {
      const text = node.getLiteralText();
      const trimmedText = text.trim();
      // Ignore if it's just whitespace, numbers, or symbols like %, -, /, etc.
      // Must contain at least one letter (English or Arabic) to be considered hardcoded text.
      if (trimmedText && /[a-zA-Z\u0600-\u06FF]/.test(trimmedText) && !text.includes('&nbsp;')) {
        fileIssues.push({
          line: node.getStartLineNumber(),
          text: trimmedText,
          reason: 'Hardcoded JSX Text',
        });
      }
    }

    // 2. Check String Literals and Template Literals for Arabic characters
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node) || Node.isTemplateHead(node) || Node.isTemplateMiddle(node) || Node.isTemplateTail(node)) {
      const text = node.getText();
      
      if (ARABIC_REGEX.test(text)) {
        if (!isInsideTranslationCall(node)) {
          fileIssues.push({
            line: node.getStartLineNumber(),
            text,
            reason: 'Arabic text found outside translation function',
          });
        }
      }
    }

    // 3. Check JSX Attributes (e.g. placeholder="Something")
    if (node.getKind() === SyntaxKind.JsxAttribute) {
      const attr = node as import('ts-morph').JsxAttribute;
      const name = attr.getNameNode().getText();
      if (USER_FACING_ATTRIBUTES.has(name)) {
        const initializer = attr.getInitializer();
        if (initializer && Node.isStringLiteral(initializer)) {
          const text = initializer.getLiteralValue();
          if (!IGNORE_TEXT_REGEX.test(text) && text.match(/[a-zA-Z\u0600-\u06FF]/)) {
            fileIssues.push({
              line: node.getStartLineNumber(),
              text,
              reason: `Hardcoded JSX Attribute (${name})`,
            });
          }
        }
      }
    }
  });

  if (fileIssues.length > 0) {
    console.log(`\n❌ ${fileName}`);
    fileIssues.forEach((issue) => {
      console.log(`   Line ${issue.line}: [${issue.reason}] -> ${issue.text}`);
      totalIssues++;
    });
  }
}

console.log(`\nScan complete. Found ${totalIssues} instances of hardcoded text.`);
if (totalIssues > 0) {
  process.exit(1);
}
