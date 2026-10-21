const fs = require('fs');

const code = `import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import path from "path";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { tavily } from "@tavily/core";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const webPreviews = new Map<string, string>();

app.get("/preview/:id", (req, res) => {
  const html = webPreviews.get(req.params.id);
  if (html) {
    res.send(html);
  } else {
    res.send(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Building Preview...</title>
        <style>
          body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          p { color: #888; margin-top: 10px; }
        </style>
        <script>
          setTimeout(() => window.location.reload(), 2500);
        </script>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Building your website...</h2>
        <p>This page will auto-refresh when ready.</p>
      </body>
      </html>\`
    );
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, workspace, customInstructions, temperature = 0.7, previewId } = req.body;
    
    let systemInstruction = "You are Nexus AI, a sophisticated, helpful, and highly versatile AI assistant.";
    
    if (previewId && workspace === 'web-design') {
      systemInstruction += \`\\n\\nCRITICAL INSTRUCTION: You MUST start your very first response with exactly this clickable markdown link so the user can preview the website: \\n\\n**[🚀 Open Live Website Preview in New Tab](/preview/\${previewId})**\\n\\nAfter printing this link, generate the complete, production-ready website code inside a \\\`\\\`\\\`html code block. \\n\\nHOWEVER, to keep the chat clean, you MUST wrap your code block inside \\\`<preview-code>\\\` tags like this:\\n<preview-code>\\n\\\`\\\`\\\`html\\n(your code here)\\n\\\`\\\`\\\`\\n</preview-code>\\n\\nOur system will intercept this to update the live preview, and the user will only see the link. IF AND ONLY IF the user explicitly asks to "show the code", "give me the code", or outputs code for you to fix, you should output the code normally WITHOUT the \\\`<preview-code>\\\` tags so they can see it. ALWAYS combine ALL HTML, CSS (in <style>), and JS (in <script>) into a SINGLE \\\`\\\`\\\`html code block. Do NOT split the code into separate blocks.\`;
    }

    if (customInstructions) {
      systemInstruction += "\\n\\nUser Custom Instructions:\\n" + customInstructions;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let fullGeneratedText = "";

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      fullGeneratedText += text;
      res.write(\`data: \${JSON.stringify({ text })}\\n\\n\`);
    }

    if (previewId) {
      const htmlMatch = fullGeneratedText.match(/<preview-code>\\s*\\\`\\\`\\\`html\\s*([\\s\\S]*?)(?:\\s*\\\`\\\`\\\`\\s*<\\/preview-code>|$)/) || fullGeneratedText.match(/\\\`\\\`\\\`html\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\`/);
      if (htmlMatch && htmlMatch[1]) {
        webPreviews.set(previewId, htmlMatch[1]);
      }
    }

    res.write('data: [DONE]\\n\\n');
    res.end();

  } catch (error: any) {
    if (String(error?.message || error?.status || error).includes("401") || String(error?.message || error).toLowerCase().includes("invalid api") || String(error?.message || error).toLowerCase().includes("unauthorized")) throw error;
    console.warn(error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(\`data: \${JSON.stringify({ text: "\\n\\n**Connection Error:** " + error.message })}\\n\\n\`);
      res.write('data: [DONE]\\n\\n');
      res.end();
    }
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

start();
`;
fs.writeFileSync('server.ts', code);
