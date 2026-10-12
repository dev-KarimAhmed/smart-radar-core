import fs from 'fs';
import path from 'path';
import glob from 'glob';

// Configuration
const SRC_DIR = path.resolve(process.cwd(), 'src');
const AR_JSON_PATH = path.resolve(SRC_DIR, 'messages/ar.json');
const EN_JSON_PATH = path.resolve(SRC_DIR, 'messages/en.json');

// Regex patterns to find t('key') and tAuto('key')
const T_REGEX = /\b(t|tAuto)\s*\(\s*['"]([^'"]+)['"]/g;
// Nested keys could be requested, like `t('nested.key')`
// `next-intl` uses nested objects. So we flatten the JSON to compare keys.

function flattenObj(obj: any, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenObj(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

function verifyTranslations() {
  console.log('Verifying translation integrity...');
  
  if (!fs.existsSync(AR_JSON_PATH) || !fs.existsSync(EN_JSON_PATH)) {
    console.error('Translation files not found.');
    process.exit(1);
  }

  const arRaw = JSON.parse(fs.readFileSync(AR_JSON_PATH, 'utf-8'));
  const enRaw = JSON.parse(fs.readFileSync(EN_JSON_PATH, 'utf-8'));

  const arFlat = flattenObj(arRaw);
  const enFlat = flattenObj(enRaw);

  const arKeys = new Set(Object.keys(arFlat));
  const enKeys = new Set(Object.keys(enFlat));

  let hasError = false;

  console.log('\n--- Checking for missing keys between AR and EN ---');
  for (const key of arKeys) {
    if (!enKeys.has(key)) {
      console.warn(`[WARNING] Key '${key}' exists in ar.json but missing in en.json`);
    }
  }
  for (const key of enKeys) {
    if (!arKeys.has(key)) {
      console.warn(`[WARNING] Key '${key}' exists in en.json but missing in ar.json`);
    }
  }

  console.log('\n--- Scanning source code for used keys ---');
  const files = glob.sync('**/*.{ts,tsx}', { cwd: SRC_DIR, absolute: true });
  const missingKeys = new Set<string>();
  
  let totalKeysChecked = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    // We only capture simple string literal calls for 't' and 'tAuto'.
    while ((match = T_REGEX.exec(content)) !== null) {
      const key = match[2];
      totalKeysChecked++;
      
      // Sometimes people use variables: t(`some.${variable}`)
      // We skip interpolation
      if (key.includes('${') || key.includes('}')) continue;
      
      // If the hook is namespace specific e.g. `useTranslations('someNamespace')`, 
      // the key is `someNamespace.key`. Our regex won't catch the namespace.
      // So this check is rudimentary: if the exact string exists anywhere in our flat keys,
      // or as a suffix (e.g. `namespace.key`), we consider it found.
      const foundInAr = arKeys.has(key) || Array.from(arKeys).some(k => k.endsWith(`.${key}`));
      const foundInEn = enKeys.has(key) || Array.from(enKeys).some(k => k.endsWith(`.${key}`));
      
      if (!foundInAr && !foundInEn) {
        missingKeys.add(key);
      }
    }
  }

  if (missingKeys.size > 0) {
    console.error('\n[ERROR] Found translation keys in code that do not exist in JSON:');
    for (const key of missingKeys) {
      console.error(`- ${key}`);
    }
    hasError = true;
  } else {
    console.log(`\nAll ${totalKeysChecked} static translation calls match existing keys!`);
  }

  if (hasError) {
    console.log('\nVerification FAILED with some missing keys (or dynamic keys were parsed).');
  } else {
    console.log('\nVerification PASSED: Translation integrity is looking good.');
  }
}

verifyTranslations();
