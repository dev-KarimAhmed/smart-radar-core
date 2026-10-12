const fs = require('fs');
const path = require('path');

function getLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDir(dir, list) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath, list);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      list.push({ path: fullPath, lines: getLines(fullPath) });
    }
  }
}

const list = [];
scanDir(path.join(__dirname, 'src', 'features'), list);
list.sort((a, b) => b.lines - a.lines);
console.log(list.slice(0, 15).map(i => `${i.lines} lines - ${i.path.replace(__dirname, '')}`).join('\n'));
