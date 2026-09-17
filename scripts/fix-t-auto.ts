import { Project, SyntaxKind, Node } from 'ts-morph';
import fs from 'fs';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const sourceFiles = project.getSourceFiles(['src/**/*.tsx', 'src/**/*.ts']);
let modifiedFilesCount = 0;

for (const sourceFile of sourceFiles) {
  let fileModified = false;
  const functionsToInjectHook = new Set<Node>();

  sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      if (Node.isIdentifier(expr) && expr.getText() === 't') {
        const args = node.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const key = args[0].getLiteralValue();
          if (key.startsWith('key_')) {
            expr.replaceWithText('tAuto');
            fileModified = true;
            
            // Find enclosing function to inject tAuto
            let enclosingFunction: Node | undefined = node.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
            if (!enclosingFunction) {
              enclosingFunction = node.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
            }
            if (!enclosingFunction) {
              enclosingFunction = node.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
            }
            if (enclosingFunction) {
              functionsToInjectHook.add(enclosingFunction);
            }
          }
        }
      }
    }
  });

  if (fileModified) {
    // Ensure import exists
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

    // Inject tAuto in all collected functions
    for (const func of functionsToInjectHook) {
      let body: Node | undefined;
      if (Node.isFunctionDeclaration(func)) body = func.getBody();
      else if (Node.isArrowFunction(func)) body = func.getBody();
      else if (Node.isFunctionExpression(func)) body = func.getBody();

      if (body && Node.isBlock(body)) {
        const blockText = body.getText();
        if (!blockText.includes('const tAuto =')) {
          body.insertStatements(0, `const tAuto = useTranslations('auto');`);
        }
      } else if (body && Node.isArrowFunction(func) && !Node.isBlock(body)) {
         // if it's an implicit return arrow function like `() => <div/>`
         // we need to wrap it in a block. But this is risky, we'll try to just warn about it.
         console.log(`WARNING: Arrow function without block in ${sourceFile.getFilePath()} at line ${func.getStartLineNumber()}`);
      }
    }

    sourceFile.saveSync();
    modifiedFilesCount++;
    console.log(`Fixed ${sourceFile.getFilePath()}`);
  }
}

console.log(`Fixed ${modifiedFilesCount} files.`);
