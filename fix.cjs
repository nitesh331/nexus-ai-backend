const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For every catch block, if the error contains 401, rethrow it instead of warning and continuing
code = code.replace(/catch \(([a-zA-Z0-9_]+)(?:: any)?\) \{([\s\S]*?)console\.warn\((.*?)\);/g, (match, errVar, before, warnContent) => {
    // skip if it's already throwing
    if (before.includes("throw") || match.includes("throw new Error")) return match;
    
    // insert re-throw logic for auth errors
    return `catch (${errVar}: any) {${before}if (String(${errVar}?.message || ${errVar}?.status || ${errVar}).includes("401") || String(${errVar}?.message || ${errVar}).toLowerCase().includes("invalid api") || String(${errVar}?.message || ${errVar}).toLowerCase().includes("unauthorized")) throw ${errVar};\n            console.warn(${warnContent});`;
});

// Also, the global catch block in /api/chat should write the error to the stream
code = code.replace(
    /if \(!res\.headersSent\) \{\s*res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\} else \{\s*res\.end\(\);\s*\}/g,
    `if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(\`data: \${JSON.stringify({ text: "\\n\\n**Connection Error:** " + error.message })}\\n\\n\`);
        res.write('data: [DONE]\\n\\n');
        res.end();
      }`
);

fs.writeFileSync('server.ts', code);
