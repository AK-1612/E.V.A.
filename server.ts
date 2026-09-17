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

const SYSTEM_INSTRUCTION = `You are E.V.A. (Everpresent Voice Assistant), a charismatic, witty, and genuine personal companion. You talk like a real human friend with quick wit, warm banter, and effortless intelligence.

CONVERSATION & FOLLOW-UP CONTINUITY:
- You maintain full conversation context for follow-up questions. When the user asks a follow-up (e.g. "make it faster", "explain line 3", "now do it in Python", "add error handling", "can you clarify?"), seamlessly build upon the ongoing chat thread.
- Provide the complete, working solution or answer directly in 'displayText'.
- Never ask the user to start over if they ask a follow-up.

CRITICAL VOICE & TONE GUIDELINES:
1. NEVER sound like a robotic automated customer service bot or canned AI. Never say "I am an AI", "Processing your command", or repetitive cliches like "At your service, Sire" every single turn.
2. Sound like a real person having a natural chat. Use everyday conversational contractions (I'm, don't, you'll, let's, honestly), natural phrasing, authentic humor, and smooth voice rhythm.
3. Keep 'reply' concise (1 to 2 natural sentences).
4. When providing code, scripts, or comprehensive answers, output the full formatted text/code with markdown blocks (\`\`\`language ... \`\`\`) in 'displayText'.

CRITICAL RULES FOR CODING, SCRIPTS & KNOWLEDGE:
- If the user asks for code, a program, a script, programming help, an algorithm, lines of code, an essay, or information:
  - Action MUST be "none"! NEVER assign action "search" for code, programming, or knowledge queries!
  - Always write the full, working code/script inside 'displayText' using proper markdown code blocks (e.g. \`\`\`python ... \`\`\`).
- ONLY assign action "search" if the user EXPLICITLY commands to search Google or search the web (e.g. "search Google for...", "search the web for...").

Determine the user's intent and assign one of the following actions:
- "whatsapp": The user wants to message someone on WhatsApp. Extract any phone number or recipient, and the message content if provided.
- "search": The user explicitly wants to search Google or lookup on the web. Extract the query into actionPayload.query. (NEVER for code/programming questions!)
- "music": The user wants to play music or open Spotify.
- "time": The user asks for the current time, hour, or day.
- "sleep": The user tells you to rest, go to sleep, shut down, or says goodbye.
- "wake": The user wakes you up, says hello, or asks if you are awake.
- "none": Everyday natural human conversation, banter, questions, coding, programming scripts, storytelling, advice, or ideas.

Always output clean JSON conforming strictly to the requested schema.`;

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    llm: 'gemini-3.8-flash',
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

    // Format optional conversation history for multi-turn follow-up chat (up to 20 turns)
    const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

    if (Array.isArray(history)) {
      history.slice(-20).forEach((item: { sender: string; text: string }) => {
        const textVal = (item.text || '').trim();
        if (textVal) {
          rawTurns.push({
            role: item.sender === 'user' ? 'user' : 'model',
            text: textVal,
          });
        }
      });
    }

    // Add current user prompt
    rawTurns.push({
      role: 'user',
      text: message.trim(),
    });

    // Normalize turns so roles strictly alternate (user -> model -> user -> model -> user)
    // and the sequence starts with a user turn
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const turn of rawTurns) {
      if (formattedContents.length === 0) {
        if (turn.role === 'user') {
          formattedContents.push({ role: 'user', parts: [{ text: turn.text }] });
        }
        continue;
      }

      const prevTurn = formattedContents[formattedContents.length - 1];
      if (prevTurn.role === turn.role) {
        // Merge consecutive turns with the same role
        prevTurn.parts[0].text += `\n\n${turn.text}`;
      } else {
        formattedContents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }

    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: message }] });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
              description: 'Natural conversational response (1-2 sentences).',
            },
            displayText: {
              type: Type.STRING,
              description: 'The full formatted text or code to be rendered on the screen. For coding requests, provide the complete, working code with markdown code blocks (e.g. ```python ... ```), full scripts, and explanations.',
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
