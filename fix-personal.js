const fs = require('fs');

const file = 'src/features/auth/components/steps/personal-step.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/t\('key_/g, "tAuto('key_");
content = content.replace('export function PersonalStep() {', "export function PersonalStep() {\n  const tAuto = useTranslations('auto');");

fs.writeFileSync(file, content);
console.log('done');
