import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Sparkles,
  Command,
  Radio,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { AssistantState, ChatMessage } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { FormattedResponse } from '../FormattedResponse';

interface AssistantViewProps {
  assistantState: AssistantState;
  transcript: string;
  lastResponse: string;
  messages: ChatMessage[];
  dateText: string;
  timeText: string;
  onToggleListening: () => void;
  onQuickWake: () => void;
  onSendMessage: (query: string) => void;
  onStartNewChat: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  assistantState,
  transcript,
  lastResponse,
  messages,
  dateText,
  timeText,
  onToggleListening,
  onQuickWake,
  onSendMessage,
  onStartNewChat,
}) => {
  const isListening = assistantState === 'listening';
  const isSpeaking = assistantState === 'speaking';
  const isSleeping = assistantState === 'sleeping';
  const isRecognizing = assistantState === 'recognizing';

  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-expand when code or long script is delivered so user sees the code right away
  useEffect(() => {
    if (lastResponse && (lastResponse.includes('```') || lastResponse.length > 220)) {
      setIsExpanded(true);
    }
  }, [lastResponse]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;
    triggerHaptic('medium');
    onSendMessage(query);
    setInputText('');
  };

  const handleMicTap = () => {
    if (isSleeping) {
      triggerHaptic('heavy');
      onQuickWake();
    } else if (isSpeaking) {
      triggerHaptic('light');
      onToggleListening();
    } else if (isListening) {
      triggerHaptic('stopListening');
      onToggleListening();
    } else {
      triggerHaptic('startListening');
      onToggleListening();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto px-4 sm:px-5 py-4 min-h-[calc(100vh-140px)]">
      {/* Top Device Status Bar Header */}
      <div className="w-full flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,199,89,0.8)]" />
          <span className="text-xs font-semibold text-[#F2F2F7] tracking-tight">
            {dateText || 'Today'}
          </span>
          <span className="text-xs text-[#8E8E93]">&bull;</span>
          <span className="text-xs text-[#8E8E93] font-medium font-mono">
            {timeText || '00:00'}
          </span>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-xl border transition-all ${
            isListening
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              : isSpeaking
              ? 'bg-[#0A84FF]/15 border-[#0A84FF]/30 text-[#64D2FF] shadow-[0_0_12px_rgba(10,132,255,0.25)]'
              : isRecognizing
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : isSleeping
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
              : 'bg-white/[0.04] border-white/[0.08] text-[#AEAEB2]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isListening
                ? 'bg-rose-400 animate-ping'
                : isSpeaking
                ? 'bg-[#64D2FF] animate-pulse'
                : isRecognizing
                ? 'bg-amber-400 animate-spin'
                : isSleeping
                ? 'bg-purple-400'
                : 'bg-emerald-400'
            }`}
          />
          <span className="font-semibold tracking-wide uppercase text-[10px]">
            {isListening
              ? 'Listening'
              : isSpeaking
              ? 'Speaking'
              : isRecognizing
              ? 'Processing'
              : isSleeping
              ? 'Standby'
              : 'Online'}
          </span>
        </div>
      </div>

      {/* Main Centerpiece Voice Core - hidden when expanded so answer gets full screen */}
      {!isExpanded && (
        <div
          className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
            messages.length > 0 ? 'py-1 my-0.5 scale-75 sm:scale-80' : 'my-auto py-5 scale-100'
          }`}
        >
          {/* Multilayer Soft Ambient Glow */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isListening
                ? 'bg-rose-500/25 scale-110'
                : isSpeaking
                ? 'bg-[#0A84FF]/25 scale-110'
                : isSleeping
                ? 'bg-purple-900/20 scale-90'
                : 'bg-[#0A84FF]/15 scale-100'
            }`}
          />

          {/* Concentric Audio Rings */}
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              messages.length > 0 ? 'w-36 h-36' : 'w-56 h-56'
            }`}
          >
            {/* Subtle Outer Boundary Ring */}
            <div
              className={`absolute inset-0 rounded-full border border-white/[0.08] transition-all duration-700 ${
                isListening || isSpeaking ? 'scale-105 border-[#0A84FF]/30' : ''
              }`}
            />

            {/* Dynamic Frequency Ring */}
            <div
              className={`absolute inset-2.5 rounded-full border border-dashed border-[#0A84FF]/20 transition-all ${
                isListening ? 'animate-spin border-rose-400/40' : isSpeaking ? 'animate-spin border-[#64D2FF]/40' : ''
              }`}
              style={{ animationDuration: '24s' }}
            />

            {/* Central Interactive Voice Orb */}
            <button
              onClick={handleMicTap}
              className={`relative z-10 rounded-full flex flex-col items-center justify-center backdrop-blur-2xl transition-all duration-300 active:scale-95 cursor-pointer border shadow-2xl ${
                messages.length > 0 ? 'w-28 h-28' : 'w-40 h-40'
              } ${
                isListening
                  ? 'bg-gradient-to-b from-rose-950/80 to-[#1C1C1E] border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.35)] ring-4 ring-rose-500/20'
                  : isSpeaking
                  ? 'bg-gradient-to-b from-blue-950/80 to-[#1C1C1E] border-[#0A84FF]/60 shadow-[0_0_35px_rgba(10,132,255,0.35)] ring-4 ring-[#0A84FF]/20'
                  : isSleeping
                  ? 'bg-[#1C1C1E] border-purple-500/30 shadow-black/80 hover:border-purple-400/50'
                  : 'bg-gradient-to-b from-[#2C2C2E]/60 to-[#1C1C1E] border-white/15 hover:border-[#0A84FF]/50 shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className={`${messages.length > 0 ? 'w-6 h-6' : 'w-9 h-9'} text-rose-400 animate-pulse`} />
                  <span className="text-[9px] font-bold text-white mt-1.5 tracking-wider uppercase">
                    Listening
                  </span>
                  <span className="text-[8px] text-rose-300/80">Tap to cancel</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className={`${messages.length > 0 ? 'w-6 h-6' : 'w-9 h-9'} text-[#64D2FF] animate-pulse`} />
                  <span className="text-[9px] font-bold text-white mt-1.5 tracking-wider uppercase">
                    Speaking
                  </span>
                  <span className="text-[8px] text-cyan-300/80">Tap to pause</span>
                </>
              ) : isSleeping ? (
                <>
                  <Radio className={`${messages.length > 0 ? 'w-6 h-6' : 'w-9 h-9'} text-purple-400 opacity-80`} />
                  <span className="text-[9px] font-bold text-[#E5E5EA] mt-1.5 tracking-wider uppercase">
                    Standby
                  </span>
                  <span className="text-[8px] text-purple-300/80">Tap to activate</span>
                </>
              ) : (
                <>
                  <div className={`${messages.length > 0 ? 'w-8 h-8' : 'w-11 h-11'} rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] shadow-inner mb-0.5`}>
                    <Mic className={messages.length > 0 ? 'w-4 h-4' : 'w-5 h-5'} />
                  </div>
                  <span className="text-[9px] font-bold text-white tracking-wider uppercase">
                    Ready
                  </span>
                  <span className="text-[8px] text-[#8E8E93]">Tap to speak</span>
                </>
              )}
            </button>
          </div>

          {/* Live Equalizer Visualizer Strip */}
          <div className={`flex items-center justify-center space-x-1.5 ${messages.length > 0 ? 'h-4 mt-2' : 'h-6 mt-4'}`}>
            {[16, 26, 12, 32, 42, 22, 36, 14, 28, 18].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-rose-400'
                    : isSpeaking
                    ? 'bg-[#64D2FF]'
                    : isRecognizing
                    ? 'bg-amber-400'
                    : 'bg-white/[0.08]'
                }`}
                style={{
                  height:
                    isListening || isSpeaking
                      ? `${Math.max(4, (h * Math.sin((i + 1) * 0.95)) % 22 + 4)}px`
                      : '4px',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modern Interaction Transcript & Action Panel */}
      <div className="w-full space-y-2 pt-1">
        {/* Quick Starter Pills when conversation is fresh (0 messages) */}
        {messages.length === 0 && !isListening && (
          <div className="flex items-center justify-center flex-wrap gap-1.5 pb-1">
            {[
              'Write a Python script',
              'Explain how Docker works',
              'Create an API function',
              'What time is it in Tokyo?',
            ].map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSendMessage(promptText);
                }}
                className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
              >
                {promptText}
              </button>
            ))}
          </div>
        )}

        {/* Output Card with Follow-up Chat & Pull-up Expand */}
        <FormattedResponse
          messages={messages}
          lastResponse={lastResponse || '"I am awake and listening. What can I assist you with today?"'}
          isListening={isListening}
          isRecognizing={isRecognizing}
          transcript={transcript}
          isExpanded={isExpanded}
          onToggleExpand={() => {
            triggerHaptic('light');
            setIsExpanded(!isExpanded);
          }}
          onStartNewChat={onStartNewChat}
        />

        {/* WhatsApp-Style Input Pill */}
        <form
          onSubmit={handleTextSubmit}
          className="w-full flex items-center gap-2 pt-0.5"
        >
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex-1 flex items-center bg-[#1C1C1E] border border-white/[0.12] rounded-full px-4 py-2.5 shadow-lg focus-within:border-[#0A84FF] focus-within:ring-2 focus-within:ring-[#0A84FF]/20 transition-all cursor-text"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or type a prompt..."
              className="flex-1 bg-transparent text-sm text-white placeholder-[#8E8E93] focus:outline-none"
            />
            {inputText && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setInputText('');
                }}
                className="text-[11px] text-[#8E8E93] hover:text-white px-1.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {inputText.trim() ? (
            <button
              type="submit"
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-blue-950/50 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMicTap}
              className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-900/50'
                  : isSpeaking
                  ? 'bg-[#0A84FF] text-white animate-pulse'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/10'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              title={isListening ? 'Tap to cancel' : 'Tap to speak'}
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-white" />
              ) : isSpeaking ? (
                <Volume2 className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
