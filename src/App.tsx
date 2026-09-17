import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';
import {
  AssistantState,
  AppTab,
  CommandHistoryItem,
  StoredSettings,
} from './types';
import { TabBar } from './components/TabBar';
import { AssistantView } from './components/tabs/AssistantView';
import { ActionsView } from './components/tabs/ActionsView';
import { HistoryView } from './components/tabs/HistoryView';
import { SettingsView } from './components/tabs/SettingsView';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SearchModal } from './components/SearchModal';
import { FeatureGuideModal } from './components/FeatureGuideModal';
import { speakText, stopSpeaking, isSpeechRecognitionSupported } from './utils/speech';
import { sendAssistantMessage } from './utils/llm';
import { triggerHaptic, setHapticsEnabled } from './utils/haptics';

const DEFAULT_SETTINGS: StoredSettings = {
  welcomeText: 'I am awake and listening. What can I do for you today?',
  goodbyeText: 'Entering standby mode. Call me whenever you need assistance.',
  voiceGender: 'male',
  voiceAccent: 'us',
  speechPitch: 1.0,
  speechRate: 1.0,
  speechVolume: 1.0,
  soundEnabled: true,
  hapticEnabled: true,
  llmProvider: 'gemini',
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  autoFallbackToCloud: true,
};

const getInitialHistory = (): CommandHistoryItem[] => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return [
    {
      id: 'init-1',
      date: yesterdayStr,
      timestamp: '18:30',
      sender: 'user',
      text: 'Play some music on Spotify',
      actionType: 'music',
    },
    {
      id: 'init-2',
      date: yesterdayStr,
      timestamp: '18:30',
      sender: 'anshul',
      text: 'Launching Spotify. Enjoy your listening session.',
      actionType: 'music',
    },
    {
      id: 'init-3',
      date: todayStr,
      timestamp: '09:15',
      sender: 'user',
      text: 'What is our agenda today?',
      actionType: 'general',
    },
    {
      id: 'init-4',
      date: todayStr,
      timestamp: '09:15',
      sender: 'anshul',
      text: 'You have a clear schedule. Let me know what you would like to accomplish.',
      actionType: 'general',
    },
  ];
};

export default function App() {
  // Navigation Tab
  const [currentTab, setCurrentTab] = useState<AppTab>('assistant');

  // Stored Settings
  const [settings, setSettings] = useState<StoredSettings>(() => {
    try {
      const saved = localStorage.getItem('anshul_settings_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          voiceGender: 'male',
          voiceAccent: parsed.voiceAccent || 'us',
        };
      }
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Assistant State
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [history, setHistory] = useState<CommandHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('anshul_history_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load history from storage', e);
    }
    return getInitialHistory();
  });
  const [lastResponse, setLastResponse] = useState<string>(
    '"I am awake and listening. What can I assist you with today?"'
  );
  const [hasInitialized, setHasInitialized] = useState(false);

  // Feature Guide Modal (in Settings only)
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Action Modals State
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [initialWhatsAppPhone, setInitialWhatsAppPhone] = useState('');
  const [initialWhatsAppMessage, setInitialWhatsAppMessage] = useState('');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState('');

  // Clock State
  const [timeText, setTimeText] = useState('');
  const [dateText, setDateText] = useState('');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Speaking tracker ref to avoid loop collisions
  const isSpeakingRef = useRef(false);

  // Save Settings & Update Haptic State
  useEffect(() => {
    try {
      localStorage.setItem('anshul_settings_v3', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
    setHapticsEnabled(settings.hapticEnabled ?? true);
  }, [settings]);

  // Save History
  useEffect(() => {
    try {
      localStorage.setItem('anshul_history_v3', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to persist history', e);
    }
  }, [history]);

  // Real-Time Clock Loop
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeText(`${hours}:${minutes}`);

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };
      setDateText(now.toLocaleDateString(undefined, options));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for PWA BeforeInstallPromptEvent
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert('To install A.N.S.H.U.L. on iOS, tap the Share button in Safari and select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Append history record
  const logInteraction = useCallback(
    (
      sender: 'user' | 'anshul',
      text: string,
      actionType: 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake' | 'general' = 'general'
    ) => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timestamp = `${hours}:${minutes}`;
      const date = now.toISOString().split('T')[0];

      const newItem: CommandHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        timestamp,
        sender,
        text,
        actionType,
      };

      setHistory((prev) => [...prev, newItem]);
    },
    []
  );

  // High Fidelity Speech Output with Humanization
  const speakAnshul = useCallback(
    async (text: string) => {
      if (!settings.soundEnabled || !text) {
        setLastResponse(text);
        return;
      }

      setLastResponse(text);
      logInteraction('anshul', text);
      isSpeakingRef.current = true;
      setAssistantState('speaking');

      await speakText(text, {
        accent: settings.voiceAccent || 'us',
        pitch: settings.speechPitch,
        rate: settings.speechRate,
        volume: settings.speechVolume,
        onStart: () => {
          setAssistantState('speaking');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setAssistantState('idle');
        },
      });

      isSpeakingRef.current = false;
      setAssistantState('idle');
    },
    [logInteraction, settings]
  );

  // Initial Boot Greeting
  const initializeAssistant = useCallback(async () => {
    setHasInitialized(true);
    setAssistantState('speaking');

    const welcomeMsg = settings.welcomeText || 'I am awake and listening. What can I do for you today?';
    await speakAnshul(welcomeMsg);

    // Spoken Temporal Status
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const hour = now.getHours();
    const minute = now.getMinutes();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMin = minute < 10 ? '0' + minute : minute;

    await speakAnshul(`Today is ${dayName}, ${displayHour}:${displayMin} ${period}. Ready for your instructions.`);
    setAssistantState('idle');
  }, [settings.welcomeText, speakAnshul]);

  // Execute Command Logic via Standalone LLM Backend
  const processCommand = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.toLowerCase().trim();
      logInteraction('user', rawQuery);
      setAssistantState('recognizing');

      // Immediate wake command
      if (query.includes('wake up') || query.includes('wake')) {
        setAssistantState('idle');
        await speakAnshul('I am awake. How can I assist you?');
        return;
      }

      // Query Standalone LLM
      const llmResult = await sendAssistantMessage(rawQuery, history, settings);
      const reply = llmResult.reply || 'I am here and ready to help.';

      // Handle Recognized Action Triggers
      if (llmResult.action === 'whatsapp') {
        if (llmResult.actionPayload?.phone) {
          setInitialWhatsAppPhone(llmResult.actionPayload.phone);
        }
        if (llmResult.actionPayload?.message) {
          setInitialWhatsAppMessage(llmResult.actionPayload.message);
        }
        await speakAnshul(reply);
        setIsWhatsAppOpen(true);
        return;
      }

      if (llmResult.action === 'search') {
        const searchQuery = llmResult.actionPayload?.query || rawQuery;
        setInitialSearchQuery(searchQuery);
        await speakAnshul(reply);
        setIsSearchOpen(true);
        return;
      }

      if (llmResult.action === 'music') {
        await speakAnshul(reply);
        window.open('https://open.spotify.com', '_blank', 'noopener,noreferrer');
        return;
      }

      if (llmResult.action === 'time') {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[now.getDay()];
        const hour = now.getHours();
        const minute = now.getMinutes();
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMin = minute < 10 ? '0' + minute : minute;
        await speakAnshul(`${reply} It is ${dayName}, ${displayHour}:${displayMin} ${period}.`);
        return;
      }

      if (llmResult.action === 'sleep') {
        await speakAnshul(reply);
        setAssistantState('sleeping');
        return;
      }

      if (llmResult.action === 'wake') {
        setAssistantState('idle');
        await speakAnshul(reply);
        return;
      }

      // Conversational Intelligent Dialogue
      await speakAnshul(reply);
    },
    [history, logInteraction, settings, speakAnshul]
  );

  // Setup Web Speech Recognition
  const toggleListening = useCallback(() => {
    if (assistantState === 'sleeping') {
      triggerHaptic('heavy');
      setAssistantState('idle');
      speakAnshul('Assistant active. How can I help?');
      return;
    }

    if (assistantState === 'speaking') {
      triggerHaptic('light');
      stopSpeaking();
      setAssistantState('idle');
      return;
    }

    if (assistantState === 'listening') {
      triggerHaptic('stopListening');
      setAssistantState('idle');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      triggerHaptic('error');
      alert('Speech recognition is not natively supported in this browser. You can use the Actions tab for one-tap dispatch.');
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      const accentLocales: Record<string, string> = {
        us: 'en-US',
        uk: 'en-GB',
        in: 'en-IN',
        au: 'en-AU',
      };
      recognition.lang = accentLocales[settings.voiceAccent || 'us'] || 'en-US';

      recognition.onstart = () => {
        triggerHaptic('startListening');
        setAssistantState('listening');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0]?.isFinal) {
          const finalText = currentTranscript.trim();
          triggerHaptic('stopListening');
          setAssistantState('idle');
          if (finalText) {
            processCommand(finalText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        triggerHaptic('error');
        setAssistantState('idle');
      };

      recognition.onend = () => {
        if (assistantState === 'listening') {
          triggerHaptic('stopListening');
          setAssistantState('idle');
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start', e);
      triggerHaptic('error');
      setAssistantState('idle');
    }
  }, [assistantState, processCommand, speakAnshul]);

  // Handle WhatsApp Submission
  const handleSendWhatsApp = (phone: string, msg: string) => {
    triggerHaptic('success');
    setIsWhatsAppOpen(false);
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const encodedText = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    logInteraction('anshul', `Dispatched WhatsApp message to ${phone}`, 'whatsapp');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle Google Search Submission
  const handlePerformSearch = (queryText: string) => {
    triggerHaptic('success');
    setIsSearchOpen(false);
    const encoded = encodeURIComponent(queryText);
    const searchUrl = `https://www.google.com/search?q=${encoded}`;
    logInteraction('anshul', `Searched Google for: ${queryText}`, 'search');
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // Action Dispatcher for Actions tab
  const handleTriggerAction = (action: 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake') => {
    triggerHaptic('medium');
    switch (action) {
      case 'whatsapp':
        processCommand('message on whatsapp');
        break;
      case 'search':
        processCommand('search the web');
        break;
      case 'music':
        processCommand('play spotify');
        break;
      case 'time':
        processCommand('what time is it');
        break;
      case 'sleep':
        processCommand('enter standby mode');
        break;
      case 'wake':
        processCommand('wake up');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F2F2F7] flex flex-col font-sans relative selection:bg-[#0A84FF]/30 pb-16">
      {/* iOS Translucent Navigation Bar */}
      <header className="w-full bg-[#121214]/85 backdrop-blur-2xl border-b border-white/[0.08] sticky top-0 z-30 px-5 py-3 transition-all">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AppLogo size="sm" />

            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">
                A.N.S.H.U.L.
              </span>
              <span className="text-[10px] font-medium text-[#8E8E93] leading-none">
                Voice Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => {
                triggerHaptic('light');
                setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer border border-white/[0.04] ${
                settings.soundEnabled
                  ? 'bg-white/[0.06] text-white hover:bg-white/[0.12]'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
              title={settings.soundEnabled ? 'Audio Output Enabled' : 'Audio Output Muted'}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'assistant' && (
          <AssistantView
            assistantState={assistantState}
            transcript={transcript}
            lastResponse={lastResponse}
            dateText={dateText}
            timeText={timeText}
            onToggleListening={toggleListening}
            onQuickWake={() => {
              setAssistantState('idle');
              speakAnshul('Assistant active. How may I help you?');
            }}
            onSendMessage={processCommand}
          />
        )}

        {currentTab === 'actions' && (
          <ActionsView
            assistantState={assistantState}
            onTriggerAction={handleTriggerAction}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            history={history}
            onClearHistory={() => setHistory([])}
            onReplayVoice={(text) => speakAnshul(text)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            assistantState={assistantState}
            onTriggerAction={handleTriggerAction}
            onUpdateSettings={(newSettings) => {
              const updated: StoredSettings = { ...newSettings, voiceGender: 'male' };
              setSettings(updated);
              try {
                localStorage.setItem('anshul_settings_v3', JSON.stringify(updated));
              } catch (e) {
                console.warn('Failed to save settings', e);
              }
            }}
            onResetDefaults={() => {
              setSettings(DEFAULT_SETTINGS);
              try {
                localStorage.setItem('anshul_settings_v3', JSON.stringify(DEFAULT_SETTINGS));
              } catch (e) {
                console.warn('Failed to reset settings', e);
              }
            }}
            onInstallPWA={handleInstallPWA}
            canInstallPWA={!!deferredPrompt}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      {/* Modal: WhatsApp Dispatch */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        onSend={handleSendWhatsApp}
        initialPhone={initialWhatsAppPhone}
        initialMessage={initialWhatsAppMessage}
      />

      {/* Modal: Google Search */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handlePerformSearch}
        initialQuery={initialSearchQuery}
      />

      {/* Modal: Feature Guide (in Settings only) */}
      <FeatureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Bottom iOS Tab Bar */}
      <TabBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          triggerHaptic('light');
          setCurrentTab(tab);
        }}
        isListening={assistantState === 'listening'}
      />
    </div>
  );
}
