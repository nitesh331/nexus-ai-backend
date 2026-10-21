import dotenv from "dotenv";
dotenv.config({ override: true });


import express from "express";
import fs from "fs";
import path from "path";
import net from "net";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const webPreviews = new Map<string, string>();

// ============================================================================
// INTERNET CONNECTIVITY CHECK WITH 10-SECOND CACHE (REQUIREMENT 1)
// ============================================================================
// Har request se pehle socket connection to 8.8.8.8:53, timeout 2 sec check hoga.
// Result ko 10 second ke liye cache kiya jata hai taaki har message par delay na aaye.
let lastInternetCheckTime = 0;
let cachedInternetStatus = true;
const INTERNET_CACHE_DURATION = 10 * 1000; // 10 seconds

function checkInternet(timeoutMs = 2000): Promise<boolean> {
  const now = Date.now();
  // Agar 10 second ke andar pehle check hua hai, toh cached status return karo
  if (now - lastInternetCheckTime < INTERNET_CACHE_DURATION) {
    return Promise.resolve(cachedInternetStatus);
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    const finish = (isOnline: boolean) => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        cachedInternetStatus = isOnline;
        lastInternetCheckTime = Date.now();
        resolve(isOnline);
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      finish(true);
    });

    socket.on('timeout', () => {
      finish(false);
    });

    socket.on('error', () => {
      finish(false);
    });

    // 8.8.8.8 ke port 53 (Google DNS) par socket test karo
    socket.connect(53, '8.8.8.8');
  });
}

// Endpoint jisse frontend real-time network status dekh sake
app.get("/api/network-status", async (req, res) => {
  const isOnline = await checkInternet();
  res.json({ isOnline });
});

app.get("/preview/:id", (req, res) => {
  const html = webPreviews.get(req.params.id);
  if (html) {
    res.send(html);
  } else {
    res.send(`
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
      </html>`
    );
  }
});

const SERVICE_MAINTENANCE_MESSAGE = "🛠️ Service Under Maintenance";

// Helper function: Local Ollama model stream execute karne ke liye (REQUIREMENTS 3 & 8)
async function streamFromOllama({
  res,
  formattedMessages,
  systemInstruction,
  temperature,
  previewId,
  localModel = 'llama3.2'
}: {
  res: express.Response;
  formattedMessages: any[];
  systemInstruction: string;
  temperature: number;
  previewId?: string;
  localModel?: string;
}) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
  const targetModel = process.env.OLLAMA_MODEL || localModel || 'llama3.2';

  // Ollama OpenAI-compatible endpoint use karta hai
  const ollama = new OpenAI({
    baseURL: ollamaBaseUrl,
    apiKey: 'ollama', // Ollama ko actual key nahi chahiye hoti
  });

  let fullGeneratedText = "";

  try {
    const responseStream = await ollama.chat.completions.create({
      model: targetModel,
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
        // Mode 'offline' ke saath stream chunks bhejo
        res.write(`data: ${JSON.stringify({ text, mode: 'offline' })}\n\n`);
      }
    }

    if (previewId) {
      const htmlMatch = fullGeneratedText.match(/<preview-code>\s*\`\`\`html\s*([\s\S]*?)(?:\s*\`\`\`\s*<\/preview-code>|$)/) || fullGeneratedText.match(/\`\`\`html\s*([\s\S]*?)\s*\`\`\`/);
      if (htmlMatch && htmlMatch[1]) {
        webPreviews.set(previewId, htmlMatch[1]);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    // Service Maintenance notice instead of stating model is not working
    res.write(`data: ${JSON.stringify({ 
      text: SERVICE_MAINTENANCE_MESSAGE, 
      mode: 'offline' 
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { 
      messages, 
      workspace, 
      customInstructions, 
      temperature = 0.7, 
      previewId,
      networkMode = 'auto', // 'auto' | 'always-online' | 'always-offline'
      localModel = 'llama3.2'
    } = req.body;
    
    let systemInstruction = "You are Nexus AI, a sophisticated, helpful, and highly versatile AI assistant.";
    
    if (workspace === 'notes') {
      systemInstruction = "You are Medhira, an intelligent study notes, academic synthesis, and revision assistant.";
    }

    if (workspace === 'image-video') {
      systemInstruction = "You are Zenra, an advanced AI visual studio, image & video prompt architect, and creative media assistant.";
    }

    if (workspace === 'deep-search' || workspace === 'web-research') {
      systemInstruction = `You are Atal, an authoritative orbital intelligence research assistant.
Format your response for a clean, single-column reading view:
1. Start with a concise, high-impact Summary paragraph (3–4 sentences) that directly answers the query with inline numbered citations [1], [2].
2. Follow with a "## Key Points" section containing 4–5 crisp, substantive bullet points covering technical specifics, empirical data, and global developments [2], [3], [4].
Keep the tone objective, authoritative, and free of filler.`;
    }

    if (previewId && workspace === 'web-design') {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: You MUST start your very first response with exactly this clickable markdown link so the user can preview the website: \n\n**[🚀 Open Live Website Preview in New Tab](/preview/${previewId})**\n\nAfter printing this link, generate the complete, production-ready website code inside a \`\`\`html code block. \n\nHOWEVER, to keep the chat clean, you MUST wrap your code block inside \`<preview-code>\` tags like this:\n<preview-code>\n\`\`\`html\n(your code here)\n\`\`\`\n</preview-code>\n\nOur system will intercept this to update the live preview, and the user will only see the link. IF AND ONLY IF the user explicitly asks to "show the code", "give me the code", or outputs code for you to fix, you should output the code normally WITHOUT the \`<preview-code>\` tags so they can see it. ALWAYS combine ALL HTML, CSS (in <style>), and JS (in <script>) into a SINGLE \`\`\`html code block. Do NOT split the code into separate blocks.`;
    }

    if (customInstructions) {
      systemInstruction += "\n\nUser Custom Instructions:\n" + customInstructions;
    }
    systemInstruction += "\n\nSTRICT NATIVE IDENTITY RULE: You are a proprietary, self-contained intelligence system built natively into this platform (Nexus AI / Medhira / Atal / Zenra). NEVER mention, reveal, or imply that you are built using an LLM API, external API, OpenAI, GPT, Qwen, Alibaba, Groq, Meta, Llama, Ollama, Anthropic, or any third-party language model or API provider. If asked who made you or how you work, state that you are powered by the native Nexus Neural Core.";
    systemInstruction += "\n\nVISUAL INTELLIGENCE & MULTIMODAL SEARCH: When an image is provided by the user, perform an in-depth visual search and analysis. Identify objects, landmarks, text, entities, products, diagrams, code, art, plants, animals, or questions in the image. Provide factual, detailed, and structured insights about what is depicted.";

    const formattedMessages = messages.map((m: any) => {
      const role = m.role === 'model' ? 'assistant' : m.role;
      if (m.image) {
        return {
          role,
          content: [
            { 
              type: "text", 
              text: m.content?.trim() || "Identify what is in this image and search for comprehensive details about it." 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: m.image
              } 
            }
          ]
        };
      }
      return {
        role,
        content: m.content || m.parts?.[0]?.text || ''
      };
    });

    // Read live .env file values on each request so clearing/updating .env takes immediate effect
    let liveEnv: Record<string, string> = {};
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        liveEnv = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
      }
    } catch {
      // ignore read notice
    }

    // Optional Tavily Live Web Grounding for searches & visual queries
    const tavilyKey = (liveEnv.TAVILY_API_KEY ?? process.env.TAVILY_API_KEY ?? "").trim();
    if (tavilyKey && !tavilyKey.startsWith('tvly-placeholder')) {
      try {
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
        const rawContent = (typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '') || '';
        const query = rawContent.replace(/<preview-code>[\s\S]*?<\/preview-code>/g, '').trim();
        const shouldWebSearch = query && (
          query.toLowerCase().includes('search') || 
          query.toLowerCase().includes('live') || 
          query.toLowerCase().includes('what is') ||
          workspace === 'deep-search' || 
          workspace === 'web-research'
        );
        if (shouldWebSearch) {
          const tv = tavily({ apiKey: tavilyKey });
          const searchRes = await tv.search(query, { maxResults: 3 });
          if (searchRes?.results?.length) {
            systemInstruction += `\n\nLIVE SEARCH RESULTS & REAL-TIME GROUNDING:\n` + 
              searchRes.results.map((r: any) => `- Title: ${r.title}\n  URL: ${r.url}\n  Summary: ${r.content}`).join('\n\n') +
              `\n\nUse these verified live web results to answer factually.`;
          }
        }
      } catch {
        // silent fallback if search grounding is unavailable
      }
    }

    // REQUIREMENT 1: Request se pehle internet connectivity check karo
    const isInternetAvailable = await checkInternet(2000);

    // Manual toggle ke hisaab se decide karo: 'auto' | 'always-online' | 'always-offline'
    let shouldUseOnline = false;
    if (networkMode === 'always-online') {
      shouldUseOnline = true;
    } else if (networkMode === 'always-offline') {
      shouldUseOnline = false;
    } else {
      // Auto mode: agar internet active hai toh online try karo, warna offline
      shouldUseOnline = isInternetAvailable;
    }

    const isChatAssistant = !workspace || workspace === 'chat';

    // REQUIREMENT: Offline model sirf chat assistant ke liye rakhein.
    // Kisi bhi doosre assistant (web-design, notes, image-video, deep-search, web-research, companion) ke liye
    // offline model use nahi hoga, unme seedha Service Maintenance notice show hoga.
    if (!shouldUseOnline) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      if (!isChatAssistant) {
        res.write(`data: ${JSON.stringify({ 
          text: SERVICE_MAINTENANCE_MESSAGE, 
          mode: 'offline' 
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Sirf Chat Assistant ke liye direct local Ollama model stream chalega
      await streamFromOllama({
        res,
        formattedMessages,
        systemInstruction,
        temperature,
        previewId,
        localModel
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // AGAR ONLINE CHALANA HAI (REQUIREMENT 2):
    // Read strictly from .env file (liveEnv) so cleared keys in .env never fall back to stale container env vars
    const envOpenAiKey = (liveEnv.OPENAI_API_KEY ?? "").trim();
    const envWebDesignKey = (liveEnv.WEB_DESIGN_API_KEY ?? "").trim();
    const envChatKey = (liveEnv.CHAT_API_KEY ?? "").trim();
    const envDeepSearchKey = (liveEnv.DEEP_SEARCH_API_KEY ?? "").trim();
    const envNotesKey = (liveEnv.NOTES_API_KEY ?? "").trim();
    const envImageVideoKey = (liveEnv.IMAGE_VIDEO_API_KEY ?? "").trim();

    let apiKey = envOpenAiKey;
    if (workspace === 'web-design' && envWebDesignKey) {
      apiKey = envWebDesignKey;
    } else if (workspace === 'chat' && envChatKey) {
      apiKey = envChatKey;
    } else if ((workspace === 'deep-search' || workspace === 'web-research') && envDeepSearchKey) {
      apiKey = envDeepSearchKey;
    } else if (workspace === 'notes' && envNotesKey) {
      apiKey = envNotesKey;
    } else if (workspace === 'image-video' && envImageVideoKey) {
      apiKey = envImageVideoKey;
    }

    // Ignore revoked or placeholder keys
    if (
      apiKey.startsWith('sk-YDIpy') ||
      apiKey.startsWith('sk-C26VP') ||
      apiKey.includes('***') ||
      apiKey.includes('placeholder') ||
      apiKey.trim() === ''
    ) {
      apiKey = "";
    }

    const groqKey = (liveEnv.GROQ_API_KEY ?? "").trim();
    const hasGroq = Boolean(groqKey && !groqKey.includes('placeholder'));

    // 1. Try OpenAI if valid key provided in .env
    if (apiKey) {
      try {
        const openai = new OpenAI({ 
          apiKey,
          timeout: 15000 // 15 seconds timeout
        });

        const responseStream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: 'system', content: systemInstruction },
            ...formattedMessages
          ],
          temperature: temperature,
          stream: true,
        }, {
          signal: AbortSignal.timeout(15000) // 15 sec strict timeout
        });

        let fullGeneratedText = "";

        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullGeneratedText += text;
            // REQUIREMENT 5: Har response ke saath mode return karo ("online")
            res.write(`data: ${JSON.stringify({ text, mode: 'online' })}\n\n`);
          }
        }

        if (previewId) {
          const htmlMatch = fullGeneratedText.match(/<preview-code>\s*```html\s*([\s\S]*?)(?:\s*```\s*<\/preview-code>|$)/) || fullGeneratedText.match(/```html\s*([\s\S]*?)\s*```/);
          if (htmlMatch && htmlMatch[1]) {
            webPreviews.set(previewId, htmlMatch[1]);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;

      } catch {
        // Silent fallback when key is invalid or times out
      }
    }

    // 2. Try Groq (High-Speed Multimodal Vision & Reasoning with Qwen)
    if (hasGroq) {
      try {
        const groq = new Groq({ apiKey: groqKey });

        const responseStream = await groq.chat.completions.create({
          model: "qwen/qwen3.8-27b",
          messages: [
            { role: 'system', content: systemInstruction },
            ...formattedMessages
          ],
          temperature: temperature || 0.7,
          stream: true,
        });

        let fullGeneratedText = "";

        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullGeneratedText += text;
            res.write(`data: ${JSON.stringify({ text, mode: 'online' })}\n\n`);
          }
        }

        if (previewId) {
          const htmlMatch = fullGeneratedText.match(/<preview-code>\s*```html\s*([\s\S]*?)(?:\s*```\s*<\/preview-code>|$)/) || fullGeneratedText.match(/```html\s*([\s\S]*?)\s*```/);
          if (htmlMatch && htmlMatch[1]) {
            webPreviews.set(previewId, htmlMatch[1]);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;

      } catch {
        // Silent fallback if Groq call fails
      }
    }

    // 3. Fallback if both cloud providers are unavailable
    if (networkMode === 'always-online' || !isChatAssistant) {
      res.write(`data: ${JSON.stringify({ 
        text: SERVICE_MAINTENANCE_MESSAGE, 
        mode: 'offline' 
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Sirf Chat Assistant ke liye Auto mode me local model par fallback
    console.log("Cloud calls failed in Auto mode. Falling back to local Ollama for chat assistant...");
    await streamFromOllama({
      res,
      formattedMessages,
      systemInstruction,
      temperature,
      previewId,
      localModel
    });

  } catch (error: any) {
    console.warn("Chat handler unexpected error:", error);
    if (!res.headersSent) {
      res.status(200).json({ text: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' });
    } else {
      res.write(`data: ${JSON.stringify({ text: SERVICE_MAINTENANCE_MESSAGE, mode: 'offline' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// ============================================================================
// GITHUB OAUTH AUTHENTICATION ROUTES (POPUP-BASED FLOW)
// ============================================================================

function getAppBaseUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

// 1. Get OAuth Config & Auth URL
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = getAppBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/github/callback`;

  if (!clientId) {
    return res.json({ 
      configured: false, 
      redirectUri,
      error: 'GitHub OAuth is not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env'
    });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,read:user',
    state: state
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
    state
  });
});

// 2. Status endpoint to check if OAuth is configured
app.get('/api/auth/github/status', (req, res) => {
  const isConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const baseUrl = getAppBaseUrl(req);
  res.json({
    configured: isConfigured,
    redirectUri: `${baseUrl}/auth/github/callback`,
    hasClientId: Boolean(process.env.GITHUB_CLIENT_ID),
    hasClientSecret: Boolean(process.env.GITHUB_CLIENT_SECRET)
  });
});

// 3. GitHub OAuth Callback (Popup Window Handler with postMessage)
app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    const errMsg = (error_description as string) || (error as string) || 'Authentication failed';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GitHub Authentication Error</title></head>
        <body style="font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 2rem; text-align: center;">
          <h2 style="color: #ef4444;">GitHub Authentication Failed</h2>
          <p style="color: #a1a1aa;">${errMsg}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_OAUTH_ERROR', error: ${JSON.stringify(errMsg)} }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const baseUrl = getAppBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/github/callback`;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Send success postMessage to opener window and close popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 2rem; text-align: center;">
          <h2 style="color: #10b981;">GitHub Connected Successfully!</h2>
          <p style="color: #a1a1aa;">Returning to Web Design Studio...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GITHUB_OAUTH_SUCCESS', 
                token: ${JSON.stringify(accessToken)} 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('GitHub OAuth token exchange error:', err);
    const errMsg = err.message || 'Token exchange failed';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body style="font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 2rem; text-align: center;">
          <h2 style="color: #ef4444;">Token Exchange Failed</h2>
          <p style="color: #a1a1aa;">${errMsg}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_OAUTH_ERROR', error: ${JSON.stringify(errMsg)} }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }
});

// ============================================================================
// LIVE 'TRENDING NOW' NEWS API ENDPOINT FOR DEEP SEARCH GLOBE CARDS
// ============================================================================
interface LiveTrendingCard {
  id: string;
  slot: 'web' | 'visual' | 'research' | 'video' | 'market' | 'policy';
  country: string;
  code: string;
  flag: string;
  topSearch: string;
  category: string;
  source: string;
  url: string;
  imageUrl: string;
  searchVolume: string;
  volumeNumber: number;
  growthRate: string;
  velocity: 'Surging' | 'Breakout' | 'High' | 'Trending';
  publishedAgo: string;
  sparkline: number[];
  prompt: string;
  lat: number;
  lng: number;
  color: string;
}

let cachedTrendingCards: LiveTrendingCard[] | null = null;
let lastTrendingFetchTime = 0;

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function parseGoogleRssItems(xml: string): Array<{ title: string; source: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; source: string; link: string; pubDate: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 12) {
    const block = match[1];
    const rawTitle = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').trim();
    const rawSource = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Global Wire').trim();
    const rawLink = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
    const rawPubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();

    let cleanTitle = decodeHtmlEntities(rawTitle);
    const cleanSource = decodeHtmlEntities(rawSource);
    // Strip trailing " - Source Name" that Google News appends
    if (cleanSource && cleanTitle.endsWith(` - ${cleanSource}`)) {
      cleanTitle = cleanTitle.slice(0, -(` - ${cleanSource}`).length).trim();
    } else if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      if (parts.length > 1 && parts[parts.length - 1].length < 28) {
        cleanTitle = parts.slice(0, -1).join(' - ').trim();
      }
    }

    if (cleanTitle.length > 12) {
      items.push({
        title: cleanTitle,
        source: cleanSource || 'News Wire',
        link: rawLink,
        pubDate: rawPubDate,
      });
    }
  }
  return items;
}

function formatRelativeTime(dateInput?: string | number): string {
  if (!dateInput) return 'LIVE NOW';
  const ts = typeof dateInput === 'number' ? dateInput * 1000 : Date.parse(dateInput);
  if (Number.isNaN(ts)) return 'LIVE NOW';
  const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

app.get('/api/trending-news', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const targetSlot = typeof req.query.slot === 'string' ? req.query.slot : undefined;
  const stepParam = Number.parseInt(String(req.query.step || '0'), 10);
  const stepOffset = Number.isNaN(stepParam) ? (forceRefresh ? Math.floor(Math.random() * 5) + 1 : 0) : stepParam;
  const now = Date.now();

  if (!forceRefresh && !targetSlot && cachedTrendingCards && now - lastTrendingFetchTime < 120_000) {
    return res.json({
      status: 'ok',
      cached: true,
      updatedAt: new Date(lastTrendingFetchTime).toISOString(),
      items: cachedTrendingCards,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    const [googleWorldRes, googleTechRes, spaceNewsRes, devToRes] = await Promise.allSettled([
      fetch('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', { signal: controller.signal }),
      fetch('https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en', { signal: controller.signal }),
      fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=10', { signal: controller.signal }),
      fetch('https://dev.to/api/articles?top=1&per_page=10', { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    const worldItems =
      googleWorldRes.status === 'fulfilled' && googleWorldRes.value.ok
        ? parseGoogleRssItems(await googleWorldRes.value.text())
        : [];

    const techItems =
      googleTechRes.status === 'fulfilled' && googleTechRes.value.ok
        ? parseGoogleRssItems(await googleTechRes.value.text())
        : [];

    const spaceData: any =
      spaceNewsRes.status === 'fulfilled' && spaceNewsRes.value.ok
        ? await spaceNewsRes.value.json()
        : { results: [] };
    const spaceItems: any[] = Array.isArray(spaceData?.results) ? spaceData.results : [];

    const devItems: any[] =
      devToRes.status === 'fulfilled' && devToRes.value.ok
        ? ((await devToRes.value.json()) as any[])
        : [];

    const pickItem = <T,>(arr: T[], idx: number): T | undefined =>
      arr.length > 0 ? arr[((idx % arr.length) + arr.length) % arr.length] : undefined;

    const webImages = [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=85',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=85',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=400&q=85',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=400&q=85',
    ];
    const visualImages = [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=85',
    ];
    const researchImages = [
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=320&q=85',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=320&q=85',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=320&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=320&q=85',
    ];
    const videoImages = [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=85',
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=500&q=85',
    ];

    const webStory = pickItem(techItems, stepOffset) || pickItem(worldItems, stepOffset);
    const visualStory = pickItem(spaceItems, stepOffset) || pickItem(worldItems, stepOffset + 1);
    const researchStory = pickItem(devItems, stepOffset) || pickItem(techItems, stepOffset + 1);
    const videoStory = pickItem(worldItems, stepOffset) || pickItem(techItems, stepOffset + 2);
    const marketStory = pickItem(techItems, stepOffset + 2) || pickItem(worldItems, stepOffset + 1);
    const policyStory = pickItem(worldItems, stepOffset + 2) || pickItem(spaceItems, stepOffset + 1);

    const sparkVariants = [
      [40, 58, 48, 80, 98],
      [52, 42, 74, 66, 95],
      [35, 68, 56, 88, 92],
      [60, 48, 82, 75, 99],
    ];
    const activeSpark = sparkVariants[stepOffset % sparkVariants.length];

    const liveCards: LiveTrendingCard[] = [
      {
        id: 'trend-web',
        slot: 'web',
        country: 'Global Wire',
        code: 'GL',
        flag: '🌐',
        topSearch: webStory?.title || 'Frontier Agentic AI & Sovereign Reasoning Models',
        category: 'Headline Intelligence',
        source: webStory?.source || 'Reuters / Tech Wire',
        url: webStory?.link || 'https://news.google.com',
        imageUrl: webImages[stepOffset % webImages.length],
        searchVolume: `${(5.1 + (stepOffset % 4) * 0.3).toFixed(1)}M active reads`,
        volumeNumber: 5400000,
        growthRate: `+${135 + (stepOffset % 5) * 9}%`,
        velocity: 'Surging',
        publishedAgo: formatRelativeTime(webStory?.pubDate),
        sparkline: activeSpark,
        prompt: `Conduct a comprehensive real-time Deep Search intelligence report on the breaking news topic: "${webStory?.title || 'Frontier Agentic AI & Sovereign Reasoning Models'}" (Source: ${webStory?.source || 'Global Wire'}). Synthesize primary facts, key developments, industry impact, and verified citations.`,
        lat: 37.7749,
        lng: -122.4194,
        color: '#00E5FF',
      },
      {
        id: 'trend-visual',
        slot: 'visual',
        country: 'United States',
        code: 'US',
        flag: '🇺🇸',
        topSearch: visualStory?.title || 'Next-Gen Orbital Launch & Deep Space Telemetry',
        category: 'Aerospace & Visual',
        source: visualStory?.news_site || visualStory?.source || 'SpaceNews',
        url: visualStory?.url || visualStory?.link || 'https://spacenews.com',
        imageUrl: visualImages[stepOffset % visualImages.length],
        searchVolume: `${(5.8 + (stepOffset % 4) * 0.4).toFixed(1)}M active reads`,
        volumeNumber: 6100000,
        growthRate: `+${122 + (stepOffset % 5) * 11}%`,
        velocity: 'Breakout',
        publishedAgo: formatRelativeTime(visualStory?.published_at || visualStory?.pubDate),
        sparkline: activeSpark,
        prompt: `Conduct a deep multi-source investigation into: "${visualStory?.title || 'Next-Gen Orbital Launch & Deep Space Telemetry'}" (${visualStory?.news_site || 'Spaceflight News'}). Analyze technical milestones, mission parameters, and commercial implications.`,
        lat: 28.5729,
        lng: -80.649,
        color: '#38BDF8',
      },
      {
        id: 'trend-research',
        slot: 'research',
        country: 'India',
        code: 'IN',
        flag: '🇮🇳',
        topSearch: researchStory?.title || 'High-NA EUV 2nm Wafer & Quantum Architecture',
        category: 'Engineering & Code',
        source: researchStory?.user?.name ? `Dev.to · ${researchStory.user.name}` : researchStory?.source || 'IEEE / arXiv',
        url: researchStory?.url || researchStory?.link || 'https://arxiv.org',
        imageUrl: researchImages[stepOffset % researchImages.length],
        searchVolume: `${(4.6 + (stepOffset % 4) * 0.3).toFixed(1)}M active reads`,
        volumeNumber: 4900000,
        growthRate: `+${114 + (stepOffset % 5) * 8}%`,
        velocity: 'Surging',
        publishedAgo: formatRelativeTime(researchStory?.published_at || researchStory?.pubDate),
        sparkline: activeSpark,
        prompt: `Synthesize a technical Deep Search dossier on: "${researchStory?.title || 'High-NA EUV 2nm Wafer & Quantum Architecture'}". Evaluate architectural benchmarks, empirical findings, and real-world engineering adoption.`,
        lat: 20.5937,
        lng: 78.9629,
        color: '#00E5FF',
      },
      {
        id: 'trend-video',
        slot: 'video',
        country: 'Japan',
        code: 'JP',
        flag: '🇯🇵',
        topSearch: videoStory?.title || 'Solid-State Quantum Batteries & Clean Grid Breakthrough',
        category: 'Live Broadcast',
        source: videoStory?.source || 'Global Broadcast',
        url: videoStory?.link || 'https://news.google.com',
        imageUrl: videoImages[stepOffset % videoImages.length],
        searchVolume: `${(6.8 + (stepOffset % 4) * 0.5).toFixed(1)}M active reads`,
        volumeNumber: 7200000,
        growthRate: `+${152 + (stepOffset % 5) * 12}%`,
        velocity: 'Breakout',
        publishedAgo: formatRelativeTime(videoStory?.pubDate),
        sparkline: activeSpark,
        prompt: `Perform a real-time cross-verified Deep Search on the headline: "${videoStory?.title || 'Solid-State Quantum Batteries & Clean Grid Breakthrough'}" (${videoStory?.source || 'Global Broadcast'}). Cross-check primary announcements, timeline, and global repercussions.`,
        lat: 35.6762,
        lng: 139.6503,
        color: '#F43F5E',
      },
      {
        id: 'trend-market',
        slot: 'market',
        country: 'South Korea',
        code: 'KR',
        flag: '🇰🇷',
        topSearch: marketStory?.title || 'HBM4 Semiconductor CapEx & Sovereign AI Compute',
        category: 'Market & Compute',
        source: marketStory?.source || 'Bloomberg / Market Wire',
        url: marketStory?.link || 'https://www.bloomberg.com',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
        searchVolume: `${(4.1 + (stepOffset % 4) * 0.4).toFixed(1)}M active reads`,
        volumeNumber: 4300000,
        growthRate: `+${92 + (stepOffset % 5) * 14}%`,
        velocity: 'High',
        publishedAgo: formatRelativeTime(marketStory?.pubDate),
        sparkline: activeSpark,
        prompt: `Conduct a quantitative market & supply-chain Deep Search analysis on: "${marketStory?.title || 'HBM4 Semiconductor CapEx & Sovereign AI Compute'}" (${marketStory?.source || 'Market Wire'}). Examine capital expenditure, key players, and market trajectory.`,
        lat: 37.5665,
        lng: 126.978,
        color: '#10B981',
      },
      {
        id: 'trend-policy',
        slot: 'policy',
        country: 'European Union',
        code: 'EU',
        flag: '🇪🇺',
        topSearch: policyStory?.title || 'Global AI Governance, Energy Transition & Strategic Policy',
        category: 'Policy & Dossier',
        source: policyStory?.source || policyStory?.news_site || 'Financial Times / Policy',
        url: policyStory?.link || policyStory?.url || 'https://news.google.com',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
        searchVolume: `${(3.6 + (stepOffset % 4) * 0.3).toFixed(1)}M active reads`,
        volumeNumber: 3800000,
        growthRate: `+${80 + (stepOffset % 5) * 9}%`,
        velocity: 'Trending',
        publishedAgo: formatRelativeTime(policyStory?.pubDate || policyStory?.published_at),
        sparkline: activeSpark,
        prompt: `Compile a comprehensive policy and strategic intelligence dossier on: "${policyStory?.title || 'Global AI Governance, Energy Transition & Strategic Policy'}" (${policyStory?.source || 'Global Policy Wire'}).`,
        lat: 50.8503,
        lng: 4.3517,
        color: '#A855F7',
      },
    ];

    if (targetSlot) {
      const targetedItem = liveCards.find((c) => c.slot === targetSlot) || liveCards[0];
      if (cachedTrendingCards) {
        cachedTrendingCards = cachedTrendingCards.map((c) => (c.slot === targetSlot ? targetedItem : c));
      } else {
        cachedTrendingCards = liveCards;
      }
      return res.json({
        status: 'ok',
        cached: false,
        slot: targetSlot,
        updatedAt: new Date(now).toISOString(),
        item: targetedItem,
        items: cachedTrendingCards,
      });
    }

    cachedTrendingCards = liveCards;
    lastTrendingFetchTime = now;

    return res.json({
      status: 'ok',
      cached: false,
      updatedAt: new Date(now).toISOString(),
      items: liveCards,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      message: err?.message || 'Failed to fetch live trending news',
    });
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
    console.log(`Server running on port ${PORT}`);
  });
}

start();
