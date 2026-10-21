const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/Claude 3 Opus \(Opus 4\.8\)/g, 'Nexus Elite');
  fs.writeFileSync(path, content);
}

replaceFile('src/hooks/useWorkspaceChat.ts');
replaceFile('src/App.tsx');
