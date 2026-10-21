const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Force use the key from the \.env file if it exists[\s\S]*?const apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ";\s+const openai = new OpenAI\({ apiKey }\);/m;

const replacement = `let apiKey = process.env.OPENAI_API_KEY;
    if (workspace === 'web-design' && process.env.WEB_DESIGN_API_KEY) {
      apiKey = process.env.WEB_DESIGN_API_KEY;
    }
    if (!apiKey) {
      throw new Error("No valid API key found. Please provide one in Settings -> Secrets.");
    }
    const openai = new OpenAI({ apiKey });`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
