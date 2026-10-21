const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

// 1. We remove the server-side webPreviews map entirely.
serverCode = serverCode.replace(/const webPreviews = new Map<string, string>\(\);\n?/g, '');
serverCode = serverCode.replace(/app\.get\("\/preview\/:id", \(req, res\) => \{[\s\S]*?\}\);\n?/g, '');

// 2. We remove the code that intercepts and saves to the map.
// The regex below is tricky because of the inner logic. Let's just remove the specific lines.
serverCode = serverCode.replace(/if \(previewId\) \{\n\s*const htmlMatch = fullGeneratedText\.match\(\/```html\\s\*\(\[\\s\\S\]\*\?\)\\s\*```\/\);\n\s*if \(htmlMatch && htmlMatch\[1\]\) \{\n\s*webPreviews\.set\(previewId, htmlMatch\[1\]\);\n\s*\}\n\s*\}/g, '');

// Wait, the block looks like:
/*
          if (previewId) {
            const htmlMatch = fullGeneratedText.match(/```html\s*([\s\S]*?)\s*```/);
            if (htmlMatch && htmlMatch[1]) {
              webPreviews.set(previewId, htmlMatch[1]);
            }
          }
*/
// We actually still need the streaming interceptor to STRIP the <preview-code> block from the frontend if we want to keep the chat clean. 
// BUT wait, if we strip it from the stream, how will the frontend get the code to save to localStorage?
// It's better if we DO NOT strip it on the server, but let the frontend receive it, hide it via CSS or React logic, and then save it to localStorage.
// Let's check how the frontend currently handles the stream.
