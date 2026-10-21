const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldKeyLogic = `const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });`;
const newKeyLogic = `    let apiKey = process.env.OPENAI_API_KEY;
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
    }

    const openai = new OpenAI({ apiKey });`;

content = content.replace(oldKeyLogic, newKeyLogic);
fs.writeFileSync('server.ts', content);
