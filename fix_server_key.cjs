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
    }
    
    if (!apiKey) {
      throw new Error("No valid API key found for this workspace. Please provide one in the Settings.");
    }`;

const newLogic = `    let apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ";
    
    if (workspace === 'web-design' && process.env.WEB_DESIGN_API_KEY) {
      apiKey = process.env.WEB_DESIGN_API_KEY;
    } else if (workspace === 'chat' && process.env.CHAT_API_KEY) {
      apiKey = process.env.CHAT_API_KEY;
    } else if (workspace === 'deep-search' && process.env.DEEP_SEARCH_API_KEY) {
      apiKey = process.env.DEEP_SEARCH_API_KEY;
    } else if (workspace === 'notes' && process.env.NOTES_API_KEY) {
      apiKey = process.env.NOTES_API_KEY;
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', content);
