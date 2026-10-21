const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `    let apiKey = process.env.OPENAI_API_KEY;
    if (workspace === 'web-design' && process.env.WEB_DESIGN_API_KEY) {
      apiKey = process.env.WEB_DESIGN_API_KEY;
    } else if (workspace === 'chat' && process.env.CHAT_API_KEY) {
      apiKey = process.env.CHAT_API_KEY;
    } else if (workspace === 'deep-search' && process.env.DEEP_SEARCH_API_KEY) {
      apiKey = process.env.DEEP_SEARCH_API_KEY;
    } else if (workspace === 'notes' && process.env.NOTES_API_KEY) {
      apiKey = process.env.NOTES_API_KEY;
    }`;

const newLogic = `    // Force use the key from the .env file if it exists, bypassing the system environment variables which might have the old key
    require('dotenv').config({ override: true });
    
    let apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ"; // Force fallback to the key you provided
    if (process.env.WEB_DESIGN_API_KEY) {
      apiKey = process.env.WEB_DESIGN_API_KEY;
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', content);
