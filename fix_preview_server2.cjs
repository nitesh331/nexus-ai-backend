const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

// I'll just remove the whole preview endpoint and the map.
serverCode = serverCode.replace(/const webPreviews = new Map<string, string>\(\);\n?/g, '');
serverCode = serverCode.replace(/app\.get\("\/preview\/:id", \(req, res\) => \{[\s\S]*?<\/[hH][tT][mM][lL]>`\);\n\s*\}\n\s*\}\);\n/g, '');

// And remove the stream interceptor logic
serverCode = serverCode.replace(/if \(previewId\) \{\n\s*const htmlMatch = fullGeneratedText\.match\(\/```html\\s\*\(\[\\s\\S\]\*\?\)\\s\*```\/\);\n\s*if \(htmlMatch && htmlMatch\[1\]\) \{\n\s*webPreviews\.set\(previewId, htmlMatch\[1\]\);\n\s*\}\n\s*\}/g, '');

fs.writeFileSync('server.ts', serverCode);
