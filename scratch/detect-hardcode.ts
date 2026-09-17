import fs from 'fs';
import path from 'path';

// This script scans all .ts and .tsx files for hardcoded Arabic text or untranslated JSX text.
const ARABIC_REGEX = /[\u0600-\u06FF]/;

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let hasHardcoded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignore comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      continue;
    }
    
    // Ignore console.log
    if (line.includes('console.log(') || line.includes('console.error(')) {
        continue;
    }

    // Ignore import statements
    if (line.trim().startsWith('import ')) {
        continue;
    }

    // Check for Arabic text outside of translation functions
    if (ARABIC_REGEX.test(line)) {
      // Very basic check, we might have false positives if arabic is inside t('') but wait, 
      // Arabic should NOT be inside t('') either, it should be in JSON!
      console.log(`[Arabic text] ${filePath}:${i + 1} -> ${line.trim()}`);
      hasHardcoded = true;
    }

    // Check for emojis that might be used as hardcoded icons (basic check)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    if (emojiRegex.test(line)) {
      console.log(`[Emoji found] ${filePath}:${i + 1} -> ${line.trim()}`);
      hasHardcoded = true;
    }
  }
}

const allFiles = scanDirectory('./src');
console.log(`Scanning ${allFiles.length} files...`);

for (const file of allFiles) {
  checkFile(file);
}

console.log('Scan complete.');
