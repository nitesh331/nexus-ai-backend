const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
content = content.replace(
  "Har assistant alag background pipeline aur dedicated API keys ke saath chalta hai.",
  "Har assistant alag background pipeline ke saath chalta hai."
);
fs.writeFileSync('src/components/SettingsModal.tsx', content);
