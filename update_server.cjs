const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('import { GoogleGenAI } from "@google/genai";', 'import OpenAI from "openai";');

const oldAiCode = `    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    }`;

const newAiCode = `    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let fullGeneratedText = "";
    
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content || m.parts?.[0]?.text || ''
    }));

    const responseStream = await openai.chat.completions.create({
      model: "gpt-4o", // You can use gpt-4o or gpt-4o-mini
      messages: [
        { role: 'system', content: systemInstruction },
        ...formattedMessages
      ],
      temperature: temperature,
      stream: true,
    });

    for await (const chunk of responseStream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullGeneratedText += text;
        res.write(\`data: \${JSON.stringify({ text })}\\n\\n\`);
      }
    }`;

content = content.replace(oldAiCode, newAiCode);

fs.writeFileSync('server.ts', content);
