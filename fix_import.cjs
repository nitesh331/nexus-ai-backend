const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Ensure import dotenv is at the top
if (content.includes("import dotenv from 'dotenv'; dotenv.config({ override: true });")) {
  content = content.replace("import dotenv from 'dotenv'; dotenv.config({ override: true });", "");
  content = "import dotenv from 'dotenv';\\ndotenv.config({ override: true });\\n" + content;
}

fs.writeFileSync('server.ts', content);
