export type AssistantState = 'idle' | 'listening' | 'recognizing' | 'speaking' | 'sleeping';

export type AppTab = 'assistant' | 'actions' | 'history' | 'settings';

export interface CommandHistoryItem {
  id: string;
  timestamp: string;
  date?: string; // YYYY-MM-DD
  isoDateTime?: string;
  sender: 'user' | 'anshul';
  text: string;
  actionType?: 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake' | 'general';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'anshul';
  text: string;
  displayText?: string;
  timestamp: string;
}

export type VoiceAccent = 'us' | 'uk' | 'in' | 'au';

export interface StoredSettings {
  welcomeText: string;
  goodbyeText: string;
  voiceGender: 'male';
  voiceAccent: VoiceAccent;
  speechPitch: number;
  speechRate: number;
  speechVolume: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  llmProvider: 'gemini' | 'ollama';
  ollamaHost: string;
  ollamaModel: string;
  autoFallbackToCloud: boolean;
}

export interface AssistantChatResponse {
  reply: string;
  displayText?: string;
  action: 'none' | 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake';
  actionPayload?: {
    phone?: string;
    message?: string;
    query?: string;
  };
  providerUsed?: 'gemini' | 'ollama' | 'fallback_gemini';
  error?: string;
}

export interface WhatsAppFormState {
  phoneNumber: string;
  message: string;
  scheduledTime?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  color?: string;
}

export interface ScheduledWhatsAppMessage {
  id: string;
  recipients: Array<{ name: string; phone: string }>;
  message: string;
  scheduledAt: string; // ISO string
  createdAt: string;
  status: 'pending' | 'sent' | 'cancelled';
}
