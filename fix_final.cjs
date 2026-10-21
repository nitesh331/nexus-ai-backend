const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `    // Force use the key from the .env file if it exists, bypassing the system environment variables which might have the old key
            let apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ"; // Force fallback to the key you provided
    if (process.env.WEB_DESIGN_API_KEY) {
      apiKey = process.env.WEB_DESIGN_API_KEY;
    }
        if (!apiKey) {
      throw new Error("No valid API key found for this workspace. Please provide one in the Settings.");
    }
    const openai = new OpenAI({ apiKey });`;

const newLogic = `    // Force the correct key
    const apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ";
    const openai = new OpenAI({ apiKey });`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', content);
