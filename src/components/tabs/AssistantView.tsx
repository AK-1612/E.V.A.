import React, { useState, useRef } from 'react';
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
import { AssistantState } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface AssistantViewProps {
  assistantState: AssistantState;
  transcript: string;
  lastResponse: string;
  dateText: string;
  timeText: string;
  onToggleListening: () => void;
  onQuickWake: () => void;
  onSendMessage: (query: string) => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  assistantState,
  transcript,
  lastResponse,
  dateText,
  timeText,
  onToggleListening,
  onQuickWake,
  onSendMessage,
}) => {
  const isListening = assistantState === 'listening';
  const isSpeaking = assistantState === 'speaking';
  const isSleeping = assistantState === 'sleeping';
  const isRecognizing = assistantState === 'recognizing';

  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto px-5 py-5 min-h-[calc(100vh-140px)]">
      {/* Top Device Status Bar Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/[0.06]">
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

      {/* Main Centerpiece Voice Core */}
      <div className="relative my-auto flex flex-col items-center justify-center py-8">
        {/* Multilayer Soft Ambient Glow */}
        <div
          className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
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
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Subtle Outer Boundary Ring */}
          <div
            className={`absolute inset-0 rounded-full border border-white/[0.08] transition-all duration-700 ${
              isListening || isSpeaking ? 'scale-105 border-[#0A84FF]/30' : ''
            }`}
          />

          {/* Dynamic Frequency Ring */}
          <div
            className={`absolute inset-3 rounded-full border border-dashed border-[#0A84FF]/20 transition-all ${
              isListening ? 'animate-spin border-rose-400/40' : isSpeaking ? 'animate-spin border-[#64D2FF]/40' : ''
            }`}
            style={{ animationDuration: '24s' }}
          />

          {/* Central Interactive Voice Orb */}
          <button
            onClick={handleMicTap}
            className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center backdrop-blur-2xl transition-all duration-300 active:scale-95 cursor-pointer border shadow-2xl ${
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
                <Mic className="w-10 h-10 text-rose-400 animate-pulse" />
                <span className="text-[11px] font-bold text-white mt-2.5 tracking-wider uppercase">
                  Listening
                </span>
                <span className="text-[10px] text-rose-300/80 mt-0.5">Tap to cancel</span>
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="w-10 h-10 text-[#64D2FF] animate-pulse" />
                <span className="text-[11px] font-bold text-white mt-2.5 tracking-wider uppercase">
                  Speaking
                </span>
                <span className="text-[10px] text-cyan-300/80 mt-0.5">Tap to pause</span>
              </>
            ) : isSleeping ? (
              <>
                <Radio className="w-10 h-10 text-purple-400 opacity-80" />
                <span className="text-[11px] font-bold text-[#E5E5EA] mt-2.5 tracking-wider uppercase">
                  Standby
                </span>
                <span className="text-[10px] text-purple-300/80 mt-0.5">Tap to activate</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] shadow-inner mb-1">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                  Ready
                </span>
                <span className="text-[10px] text-[#8E8E93] mt-0.5">Tap to speak</span>
              </>
            )}
          </button>
        </div>

        {/* Live Equalizer Visualizer Strip */}
        <div className="flex items-center justify-center space-x-1.5 h-7 mt-6">
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

      {/* Modern Interaction Transcript & Action Panel */}
      <div className="w-full space-y-3 pt-2">
        {/* Output Card */}
        <div className="w-full p-4.5 rounded-2xl bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-bold tracking-wider text-[#0A84FF] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#0A84FF]" />
              <span>Voice Intelligence</span>
            </span>
            <span className="text-[10px] font-medium text-[#8E8E93]">
              {isListening ? 'Real-time capture' : 'Response'}
            </span>
          </div>

          <p className="text-sm sm:text-base font-medium text-[#F2F2F7] leading-relaxed">
            {isListening ? (
              <span className="text-rose-300 italic">
                {transcript ? `"${transcript}"` : 'Listening for your voice...'}
              </span>
            ) : isRecognizing ? (
              <span className="text-amber-300/90 italic">
                Synthesizing response...
              </span>
            ) : (
              lastResponse || '"I am awake and listening. What can I assist you with today?"'
            )}
          </p>
        </div>

        {/* WhatsApp-Style Input Pill */}
        <form
          onSubmit={handleTextSubmit}
          className="w-full flex items-center gap-2 pt-1"
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

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md ${
              inputText.trim()
                ? 'bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-blue-950/50 cursor-pointer'
                : 'bg-white/[0.08] text-[#8E8E93] cursor-not-allowed opacity-50'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
