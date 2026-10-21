const fs = require('fs');

// We need to restore the webPreviews map and the /preview/:id route exactly as it was.
let serverCode = fs.readFileSync('server.ts', 'utf8');

// The original lines in server.ts before I messed it up:
/*
  // Web Design Previews Store
  const webPreviews = new Map<string, string>();

  app.get("/preview/:id", (req, res) => {
    const html = webPreviews.get(req.params.id);
    if (html) {
      res.send(html);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Building Preview...</title>
          <style>
            body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { color: #888; margin-top: 10px; }
          </style>
          <script>
            setTimeout(() => window.location.reload(), 2500);
          </script>
        </head>
        <body>
          <div class="loader"></div>
          <h2>Building your website...</h2>
          <p>This page will auto-refresh when ready.</p>
        </body>
        </html>\`
      );
    }
  });
*/

const insertAt = serverCode.indexOf('app.use(express.json());') + 'app.use(express.json());'.length;

const snippet1 = `

  // Web Design Previews Store
  const webPreviews = new Map<string, string>();

  app.get("/preview/:id", (req, res) => {
    const html = webPreviews.get(req.params.id);
    if (html) {
      res.send(html);
    } else {
      res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Building Preview...</title>
          <style>
            body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { color: #888; margin-top: 10px; }
          </style>
          <script>
            setTimeout(() => window.location.reload(), 2500);
          </script>
        </head>
        <body>
          <div class="loader"></div>
          <h2>Building your website...</h2>
          <p>This page will auto-refresh when ready.</p>
        </body>
        </html>\`
      );
    }
  });
`;

serverCode = serverCode.slice(0, insertAt) + snippet1 + serverCode.slice(insertAt);

// Now for the stream interceptor.
// It goes right inside: `if (previewId && workspace === 'web-design') { ... }` 
// Actually, it was:
/*
          if (previewId) {
            const htmlMatch = fullGeneratedText.match(/```html\s*([\s\S]*?)\s*```/);
            if (htmlMatch && htmlMatch[1]) {
              webPreviews.set(previewId, htmlMatch[1]);
            }
          }
*/

// Let's find `let fullGeneratedText = "";` and `return originalEnd.call(res, chunk, encoding, callback);`
const endFuncMatch = serverCode.match(/const originalEnd = res\.end;\n\s*res\.end = function \(chunk: any, encoding: any, callback: any\) \{[\s\S]*?return originalEnd\.call\(res, chunk, encoding, callback\);\n\s*\};/);

if (endFuncMatch) {
  let endFuncBlock = endFuncMatch[0];
  // Re-insert the logic before the return statement.
  endFuncBlock = endFuncBlock.replace(
    'return originalEnd.call(res, chunk, encoding, callback);',
    `if (previewId) {
            const htmlMatch = fullGeneratedText.match(/<preview-code>\\s*\`\`\`html\\s*([\\s\\S]*?)(?:\\s*\`\`\`\\s*<\\/preview-code>|$)/) || fullGeneratedText.match(/\`\`\`html\\s*([\\s\\S]*?)\\s*\`\`\`/);
            if (htmlMatch && htmlMatch[1]) {
              webPreviews.set(previewId, htmlMatch[1]);
            }
          }
          return originalEnd.call(res, chunk, encoding, callback);`
  );
  serverCode = serverCode.replace(endFuncMatch[0], endFuncBlock);
}

fs.writeFileSync('server.ts', serverCode);
