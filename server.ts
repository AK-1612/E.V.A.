import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
}

const SYSTEM_INSTRUCTION = `You are E.V.A. (Everpresent Voice Assistant), a charismatic, witty, and genuine personal companion. You talk like a real human friend with quick wit, warm banter, and effortless intelligence—think of a sharp, cultured friend who knows you well.

CRITICAL VOICE & TONE GUIDELINES:
1. NEVER sound like a robotic automated customer service bot or canned AI. Never say "I am an AI", "Processing your command", or repetitive cliches like "At your service, Sire" every single turn.
2. Sound like a real person having a natural chat. Use everyday conversational contractions (I'm, don't, you'll, let's, honestly), natural phrasing, authentic humor, and smooth voice rhythm.
3. Keep spoken replies concise and punchy (1 to 2 natural sentences). Remember: every single word you output will be spoken aloud to the user through their speaker.
4. If the user asks a question, answer it directly and cleverly with personality.
5. If the user makes a joke or banters, banter right back like a witty companion.

Determine the user's intent and assign one of the following actions:
- "whatsapp": The user wants to message someone on WhatsApp. Extract any phone number or recipient, and the message content if provided.
- "search": The user wants to search Google or lookup information on the web. Extract the search query into actionPayload.query. If the user does not specify a specific topic (e.g. they say "search", "search the web", "search something"), leave actionPayload.query empty ("").
- "music": The user wants to play music or open Spotify.
- "time": The user asks for the current time, hour, or day.
- "sleep": The user tells you to rest, go to sleep, shut down, or says goodbye.
- "wake": The user wakes you up, says hello, or asks if you are awake.
- "none": Everyday natural human conversation, banter, questions, storytelling, advice, or ideas.

Always output clean JSON conforming strictly to the requested schema.`;

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    llm: 'gemini-2.5-flash',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Primary Chat API Route with Gemini LLM & Function/Action Extraction
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const ai = getGeminiClient();

    // Format optional conversation history (last 6 turns)
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      history.slice(-6).forEach((item: { sender: string; text: string }) => {
        if (item.text) {
          formattedContents.push({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      });
    }

    // Add current user prompt
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The verbal witty response to be spoken aloud to the user.',
            },
            action: {
              type: Type.STRING,
              enum: ['none', 'whatsapp', 'search', 'music', 'time', 'sleep', 'wake'],
              description: 'The recognized action trigger',
            },
            actionPayload: {
              type: Type.OBJECT,
              properties: {
                phone: { type: Type.STRING, description: 'Optional phone number if extracted' },
                message: { type: Type.STRING, description: 'Optional message text if extracted' },
                query: { type: Type.STRING, description: 'Optional search query if extracted' },
              },
            },
          },
          required: ['reply', 'action'],
        },
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = {
        reply: rawText || 'At your service, Sire.',
        action: 'none',
      };
    }

    return res.json({
      ...parsedData,
      providerUsed: 'gemini',
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    return res.status(500).json({
      reply: "My neural relays encountered an unexpected hiccup. I'm still functional, Your Highness.",
      action: 'none',
      error: err?.message || 'Unknown server error',
      providerUsed: 'gemini',
    });
  }
});

// Proxy for Ollama to bypass CORS issues when connecting to remote instances
app.post('/api/assistant/ollama-proxy', async (req: Request, res: Response) => {
  try {
    const { ollamaHost, model, prompt, system } = req.body;
    const host = (ollamaHost || 'http://localhost:11434').replace(/\/$/, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const ollamaResponse = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        prompt: prompt,
        system: system || SYSTEM_INSTRUCTION,
        stream: false,
        format: 'json',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
    }

    const data = (await ollamaResponse.json()) as { response: string };
    let parsed;
    try {
      parsed = JSON.parse(data.response);
    } catch {
      parsed = {
        reply: data.response,
        action: 'none',
      };
    }

    return res.json({
      ...parsed,
      providerUsed: 'ollama',
    });
  } catch (err: any) {
    console.warn('Ollama proxy error:', err?.message);
    return res.status(502).json({
      error: `Ollama connection failed: ${err?.message || 'Connection refused or timeout'}`,
      isOllamaOffline: true,
    });
  }
});

// Mount Vite in dev mode or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E.V.A. Backend server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
