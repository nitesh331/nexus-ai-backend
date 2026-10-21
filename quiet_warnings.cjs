const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Suppress OpenAI 401 warnings
code = code.replace(
    /console\.warn\(\`OpenAI model \$\{model\} failed \(status \$\{response\.status\}\):\`, errBody\);/g,
    `if (response.status === 401) {
            console.log(\`OpenAI model \${model} failed (401)\`);
            continue;
          }
          console.warn(\`OpenAI model \${model} failed (status \${response.status}):\`, errBody);`
);

// Remove the throw I added for OpenAI
code = code.replace(/if \(response\.status === 401\) \{\s*throw new Error\("OpenAI API key is invalid \(401 Unauthorized\)\."\);\s*\}/g, '');


fs.writeFileSync('server.ts', code);
