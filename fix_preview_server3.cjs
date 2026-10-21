const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

// The previous regex missed it. Let's do it manually.
const lines = serverCode.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const webPreviews = new Map<string, string>();')) continue;
  if (lines[i].includes('// Web Design Previews Store')) continue;
  
  if (lines[i].includes('app.get("/preview/:id", (req, res) => {')) {
    skip = true;
    continue;
  }
  
  if (skip) {
    if (lines[i].includes('});') && lines[i-1].includes('</html>`')) {
      skip = false;
    }
    continue;
  }
  
  // Strip the memory set part
  if (lines[i].includes('if (previewId) {') && lines[i+1].includes('const htmlMatch = fullGeneratedText.match(/```html\\s*([\\s\\S]*?)\\s*```/);')) {
    i += 5; // skip 5 lines
    continue;
  }
  
  newLines.push(lines[i]);
}

fs.writeFileSync('server.ts', newLines.join('\n'));
