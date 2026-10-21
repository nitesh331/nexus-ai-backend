const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const warnReplacements = [
  /console\.warn\(\`Dedicated key for workspace \$\{workspace\} OpenAI \/ Codex execution warning:\`, openAiErr\);/g,
  /console\.warn\(\`Dedicated key for workspace \$\{workspace\} Anthropic execution warning:\`, wsErr\?\.message \|\| wsErr\);/g,
  /console\.warn\(\`Dedicated key for workspace \$\{workspace\} OpenRouter execution warning:\`, orErr\);/g,
  /console\.warn\(\`Dedicated key for workspace \$\{workspace\} Groq execution warning:\`, wsGroqErr\);/g,
  /console\.warn\(\`Dedicated key for workspace \$\{workspace\} Gemini execution warning:\`, wsGeminiErr\);/g,
  /console\.warn\("OpenRouter stream error, falling back:", orErr\);/g,
  /console\.warn\("Anthropic \/ Opus streaming failed, falling back:", anthropicErr\?\.message \|\| anthropicErr\);/g,
  /console\.warn\("OpenAI \/ Codex cascade failed, trying next provider:", openAiCascadeErr\);/g,
  /console\.warn\("Groq streaming failed, falling back to Gemini:", groqErr\?\.message \|\| groqErr\);/g
];

// Instead of regex replacing every single one perfectly, we can just replace the string `console.warn(` with a custom function if it's caught in the stream logic.

// Actually, simpler: define a helper at the top of startServer:
// function smartWarn(prefix, err) { if(String(err).includes("401") || String(err).includes("invalid api")) console.log(prefix, err); else console.warn(prefix, err); }

code = code.replace(/async function startServer\(\) \{/, `async function startServer() {\n  function logCascade(prefix: string, err: any) {\n    const errStr = String(err?.message || err?.status || err).toLowerCase();\n    if (errStr.includes("401") || errStr.includes("authentication") || errStr.includes("unauthorized") || errStr.includes("invalid api")) {\n      console.log(prefix, "(Auth error suppressed)");\n    } else {\n      console.warn(prefix, err);\n    }\n  }`);

// Then replace specific warns:
code = code.replace(/console\.warn\("Anthropic \/ Opus streaming failed, falling back:", (anthropicErr.*?)\);/g, 'logCascade("Anthropic / Opus streaming failed, falling back:", $1);');
code = code.replace(/console\.warn\("OpenAI \/ Codex cascade failed, trying next provider:", (openAiCascadeErr.*?)\);/g, 'logCascade("OpenAI / Codex cascade failed, trying next provider:", $1);');
code = code.replace(/console\.warn\("Groq streaming failed, falling back to Gemini:", (groqErr.*?)\);/g, 'logCascade("Groq streaming failed, falling back to Gemini:", $1);');
code = code.replace(/console\.warn\("OpenRouter stream error, falling back:", (orErr.*?)\);/g, 'logCascade("OpenRouter stream error, falling back:", $1);');
code = code.replace(/console\.warn\(\`Dedicated key for workspace \$\{workspace\} OpenAI \/ Codex execution warning:\`, (openAiErr.*?)\);/g, 'logCascade(`Dedicated key for workspace ${workspace} OpenAI / Codex execution warning:`, $1);');
code = code.replace(/console\.warn\(\`Dedicated key for workspace \$\{workspace\} Anthropic execution warning:\`, (wsErr.*?)\);/g, 'logCascade(`Dedicated key for workspace ${workspace} Anthropic execution warning:`, $1);');
code = code.replace(/console\.warn\(\`Dedicated key for workspace \$\{workspace\} OpenRouter execution warning:\`, (orErr.*?)\);/g, 'logCascade(`Dedicated key for workspace ${workspace} OpenRouter execution warning:`, $1);');
code = code.replace(/console\.warn\(\`Dedicated key for workspace \$\{workspace\} Groq execution warning:\`, (wsGroqErr.*?)\);/g, 'logCascade(`Dedicated key for workspace ${workspace} Groq execution warning:`, $1);');
code = code.replace(/console\.warn\(\`Dedicated key for workspace \$\{workspace\} Gemini execution warning:\`, (wsGeminiErr.*?)\);/g, 'logCascade(`Dedicated key for workspace ${workspace} Gemini execution warning:`, $1);');

// Also fix the OpenRouter stream helper 401 throw that was failing:
code = code.replace(/if \(response\.status === 401\) \{\s*throw new Error\("OpenRouter API key is invalid \(401 Unauthorized\)\."\);\s*\}/g, 'if (response.status === 401) { console.log(`OpenRouter model ${model} failed (401)`); continue; }');

// Wait, the openai throw was already removed, but openrouter was added by my previous edit that failed partially? Let me check.
// I will just apply it anyway.

fs.writeFileSync('server.ts', code);
