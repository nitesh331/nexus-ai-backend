const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
content = content.replace("'Settings & API Keys'", "'Settings'");
fs.writeFileSync('src/components/Sidebar.tsx', content);
