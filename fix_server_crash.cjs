const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldCatch = `  } catch (error: any) {
    if (String(error?.message || error?.status || error).includes("401") || String(error?.message || error).toLowerCase().includes("invalid api") || String(error?.message || error).toLowerCase().includes("unauthorized")) throw error;
    console.warn(error);`;

const newCatch = `  } catch (error: any) {
    console.warn(error);
    const errorMsg = error?.message || "Unknown error occurred";
    if (!res.headersSent) {
      res.status(500).json({ error: errorMsg });
    } else {
      res.write(\`data: \${JSON.stringify({ text: "\\n\\n**Error:** " + errorMsg })}\\n\\n\`);
      res.write('data: [DONE]\\n\\n');
      res.end();
    }
    return;`;

content = content.replace(oldCatch, newCatch);
fs.writeFileSync('server.ts', content);
