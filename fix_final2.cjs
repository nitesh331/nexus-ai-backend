const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /let apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ";[\s\S]*?const openai = new OpenAI\({ apiKey }\);/m;
content = content.replace(regex, `const apiKey = "sk-YDIpyr7QpYKZTPA3DQr299yqa1ItDXD2kqSlYObsPudK29aZ";\n    const openai = new OpenAI({ apiKey });`);

fs.writeFileSync('server.ts', content);
