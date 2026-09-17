import { Project, SyntaxKind, Node } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const sourceFiles = project.getSourceFiles('src/**/*.tsx');
const arJson = JSON.parse(fs.readFileSync('./src/messages/ar.json', 'utf8'));

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

let missingCount = 0;

for (const sourceFile of sourceFiles) {
  sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      if (Node.isIdentifier(expr) && (expr.getText() === 't' || expr.getText() === 'tAuto')) {
        const args = node.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const key = args[0].getLiteralValue();
          // if it's tAuto, the key is in 'auto.'
          const fullKey = expr.getText() === 'tAuto' ? `auto.${key}` : key;
          
          const hasKey = getNestedValue(arJson, fullKey) !== undefined;
          
          if (!hasKey) {
            // Also check if the key exists without 'auto.' just in case
            const hasKeyWithoutAuto = getNestedValue(arJson, key) !== undefined;
            if (!hasKeyWithoutAuto) {
                console.log(`Missing key: ${fullKey} in ${sourceFile.getFilePath()}`);
                missingCount++;
            }
          }
        }
      }
    }
  });
}

console.log(`Total missing keys: ${missingCount}`);
