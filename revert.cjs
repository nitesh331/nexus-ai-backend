const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the throw statements added by fix.js
code = code.replace(/if \(String\([a-zA-Z0-9_\?\.]* \?\? [a-zA-Z0-9_\?\.]* \|\| [a-zA-Z0-9_\?\.]*\)\.includes\("401"\).*?throw [a-zA-Z0-9_]+;/g, '');
// Wait, the regex needs to be more precise
code = code.replace(/if \(String\([^\)]+\)\.includes\("401"\)[^;]+throw [a-zA-Z0-9_]+;\n?/g, '');

// Also change the global chat handler back to the original
code = code.replace(
    /if \(!res\.headersSent\) \{\s*res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\} else \{\s*res\.write\(`data: \$\{JSON\.stringify\(\{ text: "\\\\n\\\\n\*\*Connection Error:\*\* " \+ error\.message \}\)\}\\n\\n`\);\s*res\.write\('data: \[DONE\]\\n\\n'\);\s*res\.end\(\);\s*\}/g,
    `if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }`
);

fs.writeFileSync('server.ts', code);
