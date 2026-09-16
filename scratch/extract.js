const fs = require('fs');
const content = fs.readFileSync('scratch/delegates.txt', 'utf8');

const styleRegex = /const styles = \{([\s\S]*?)\} as const;/;
const styleMatch = content.match(styleRegex);
if (styleMatch) {
  fs.mkdirSync('src/features/admin/components/admin/delegates', { recursive: true });
  fs.writeFileSync('src/features/admin/components/admin/delegates/styles.ts', `export const styles = {${styleMatch[1]}} as const;\n`);
  console.log('Styles extracted');
}

// Also extract types
const typeRegex = /export interface Delegate \{[\s\S]*?\}[\s\S]*?export interface MagicLink \{[\s\S]*?\}[\s\S]*?export interface DelegateTask \{[\s\S]*?\}/;
const typeMatch = content.match(typeRegex);
if (typeMatch) {
  fs.writeFileSync('src/features/admin/components/admin/delegates/types.ts', `${typeMatch[0]}\n`);
  console.log('Types extracted');
}
