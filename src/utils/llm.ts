import { AssistantChatResponse, CommandHistoryItem, StoredSettings } from '../types';

export async function sendAssistantMessage(
  message: string,
  history: CommandHistoryItem[],
  settings: StoredSettings
): Promise<AssistantChatResponse> {
  // If Ollama is selected:
  if (settings.llmProvider === 'ollama') {
    try {
      // 1. Try direct browser fetch to Ollama (ideal when running on laptop where Ollama is local)
      const host = (settings.ollamaHost || 'http://localhost:11434').replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const systemPrompt = `You are E.V.A. (Everpresent Voice Assistant), a charismatic, natural, witty friend and confidant. Never sound like a robot, bot, or automated system. Speak with genuine voice, contractions (I'm, don't, that's), natural humor, and real warmth.
Respond strictly in JSON: {"reply": "1-2 natural sentences to be spoken aloud", "action": "none"|"whatsapp"|"search"|"music"|"time"|"sleep"|"wake", "actionPayload": {"phone": "", "message": "", "query": ""}}`;

      try {
        const directRes = await fetch(`${host}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.ollamaModel || 'llama3.2',
            prompt: `User: ${message}`,
            system: systemPrompt,
            stream: false,
            format: 'json',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (directRes.ok) {
          const data = await directRes.json();
          const parsed = JSON.parse(data.response);
          return {
            reply: parsed.reply || data.response,
            action: parsed.action || 'none',
            actionPayload: parsed.actionPayload,
            providerUsed: 'ollama',
          };
        }
      } catch {
        // Direct browser connection failed (e.g. CORS or localhost from remote device), try server proxy
      }

      // 2. Try server-side proxy
      const proxyRes = await fetch('/api/assistant/ollama-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollamaHost: settings.ollamaHost,
          model: settings.ollamaModel,
          prompt: message,
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        return {
          ...proxyData,
          providerUsed: 'ollama',
        };
      }
    } catch (ollamaErr) {
      console.warn('Ollama attempt failed:', ollamaErr);
    }

    // If Ollama failed and fallback is disabled
    if (!settings.autoFallbackToCloud) {
      return {
        reply: "I couldn't reach your local Ollama instance. Ensure your laptop is awake and Ollama is active, or enable Cloud Fallback in Settings.",
        action: 'none',
        providerUsed: 'ollama',
        error: 'Ollama unreachable',
      };
    }

    // Auto fallback to Gemini
    console.log('Failing over from Ollama to Gemini Cloud...');
  }

  // Gemini Cloud LLM (default or fallback)
  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-6).map((h) => ({ sender: h.sender, text: h.text })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data: AssistantChatResponse = await res.json();
    return {
      ...data,
      providerUsed: settings.llmProvider === 'ollama' ? 'fallback_gemini' : 'gemini',
    };
  } catch (err: any) {
    console.error('LLM API error:', err);
    return {
      reply: 'My cognitive circuits are momentarily disconnected, but I am still listening, Sire.',
      action: 'none',
      error: err?.message,
    };
  }
}
