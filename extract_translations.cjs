const fs = require('fs');

const fileContent = fs.readFileSync('src/features/account/components/profile-tab.tsx', 'utf-8');
const match = fileContent.match(/const profileLanguageCopy = ({[\s\S]*?}) as const;/);

if (match) {
  const code = match[1];
  const profileLanguageCopy = eval('(' + code + ')');
  
  const arPath = 'src/messages/ar.json';
  const enPath = 'src/messages/en.json';
  
  const arJson = JSON.parse(fs.readFileSync(arPath, 'utf-8'));
  const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  
  arJson.profileTab = profileLanguageCopy.ar;
  enJson.profileTab = profileLanguageCopy.en;
  
  fs.writeFileSync(arPath, JSON.stringify(arJson, null, 2), 'utf-8');
  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf-8');
  console.log('Successfully added profileTab to ar.json and en.json');
} else {
  console.error('Could not match profileLanguageCopy');
}
