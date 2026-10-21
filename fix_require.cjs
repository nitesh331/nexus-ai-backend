const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("require('dotenv').config({ override: true });", "import dotenv from 'dotenv'; dotenv.config({ override: true });");

fs.writeFileSync('server.ts', content);
