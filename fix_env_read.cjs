const fs = require('fs');
const path = require('path');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /let apiKey = process\.env\.OPENAI_API_KEY;[\s\S]*?const openai = new OpenAI\(\{ apiKey \}\);/m;

const newLogic = `
    // Read directly from .env file to bypass any cached system environment variables
    let envKey = "";
    let webDesignEnvKey = "";
    try {
      const fs = require('fs');
      const envFileContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
      
      const match = envFileContent.match(/OPENAI_API_KEY=["']?(sk-[a-zA-Z0-9_-]+)["']?/);
      if (match && match[1]) {
        envKey = match[1];
      }
      
      const webMatch = envFileContent.match(/WEB_DESIGN_API_KEY=["']?(sk-[a-zA-Z0-9_-]+)["']?/);
      if (webMatch && webMatch[1]) {
        webDesignEnvKey = webMatch[1];
      }
    } catch (e) {
      console.warn("Could not read .env file directly", e);
    }

    let apiKey = envKey || process.env.OPENAI_API_KEY;
    
    if (workspace === 'web-design') {
       if (webDesignEnvKey) {
         apiKey = webDesignEnvKey;
       } else if (process.env.WEB_DESIGN_API_KEY) {
         apiKey = process.env.WEB_DESIGN_API_KEY;
       }
    }
    
    if (!apiKey) {
      throw new Error("No valid API key found. Please provide one in your .env file.");
    }
    
    const openai = new OpenAI({ apiKey });
`;

if (content.match(regex)) {
   content = content.replace(regex, newLogic);
   fs.writeFileSync('server.ts', content);
   console.log("Successfully updated server.ts to read from .env");
} else {
   console.log("Could not find the regex match in server.ts");
}
