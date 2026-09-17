import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sliders,
  RotateCcw,
  Smartphone,
  Cpu,
  Cloud,
  ChevronRight,
  Mic,
  ShieldCheck,
  Zap,
  Radio,
  HelpCircle,
  Play,
  Check,
  Globe2,
  Activity,
} from 'lucide-react';
import { StoredSettings, AssistantState, VoiceAccent } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { speakPreview, getActiveMaleVoiceInfo, stopSpeaking } from '../../utils/speech';
import { AppLogo } from '../AppLogo';

interface SettingsViewProps {
  settings: StoredSettings;
  assistantState: AssistantState;
  onTriggerAction: (action: 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake') => void;
  onUpdateSettings: (newSettings: StoredSettings) => void;
  onResetDefaults: () => void;
  onInstallPWA: () => void;
  canInstallPWA: boolean;
  onOpenGuide: () => void;
}

const ACCENT_OPTIONS: { id: VoiceAccent; label: string; flag: string; region: string }[] = [
  { id: 'us', label: 'American', flag: '🇺🇸', region: 'United States' },
  { id: 'uk', label: 'British', flag: '🇬🇧', region: 'United Kingdom' },
  { id: 'in', label: 'Indian', flag: '🇮🇳', region: 'India' },
  { id: 'au', label: 'Australian', flag: '🇦🇺', region: 'Australia' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  assistantState,
  onTriggerAction,
  onUpdateSettings,
  onResetDefaults,
  onInstallPWA,
  canInstallPWA,
  onOpenGuide,
}) => {
  const isSleeping = assistantState === 'sleeping';
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [activeVoiceInfo, setActiveVoiceInfo] = useState<{ voiceName: string; accentName: string }>({
    voiceName: 'Detecting voice...',
    accentName: 'American',
  });

  const selectedAccent = settings.voiceAccent || 'us';

  useEffect(() => {
    const updateVoiceInfo = () => {
      setActiveVoiceInfo(getActiveMaleVoiceInfo(selectedAccent));
    };

    updateVoiceInfo();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceInfo;
    }
  }, [selectedAccent]);

  const handleTestVoice = async () => {
    triggerHaptic('medium');
    if (isPreviewPlaying) {
      stopSpeaking();
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewPlaying(true);
    await speakPreview(selectedAccent, settings.speechPitch, settings.speechRate);
    setIsPreviewPlaying(false);
  };
  return (
    <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6 space-y-6 pb-28">
      {/* iOS Large Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings</h1>
      </div>

      {/* Section 1: Intelligence Engine */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider px-2">
          Intelligence Engine
        </span>

        <div className="rounded-2xl bg-[#1C1C1E] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-lg">
          {/* Segmented Controller */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-[#0A84FF] flex items-center justify-center border border-blue-500/25">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Active LLM Model</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#2C2C2E] text-xs font-semibold">
              <button
                onClick={() => onUpdateSettings({ ...settings, llmProvider: 'gemini' })}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg transition cursor-pointer ${
                  settings.llmProvider === 'gemini'
                    ? 'bg-[#0A84FF] text-white shadow-sm font-bold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Intelligence</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ ...settings, llmProvider: 'ollama' })}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg transition cursor-pointer ${
                  settings.llmProvider === 'ollama'
                    ? 'bg-[#0A84FF] text-white shadow-sm font-bold'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Local Ollama</span>
              </button>
            </div>
          </div>

          {/* Conditional Ollama config or Cloud info */}
          {settings.llmProvider === 'ollama' ? (
            <div className="p-4 space-y-3 bg-[#171719]">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E8E93] block uppercase tracking-wider">
                  Ollama Host URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaHost}
                  onChange={(e) => onUpdateSettings({ ...settings, ollamaHost: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#0A84FF] transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E8E93] block uppercase tracking-wider">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => onUpdateSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3.2"
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#0A84FF] transition"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs text-white font-bold">Cloud Fallback Protection</p>
                  <p className="text-[10px] text-[#8E8E93]">
                    Automatically failover to cloud intelligence if local host is unreachable
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      autoFallbackToCloud: !settings.autoFallbackToCloud,
                    })
                  }
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    settings.autoFallbackToCloud ? 'bg-[#34C759]' : 'bg-[#39393D]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      settings.autoFallbackToCloud ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex items-start space-x-2.5 bg-[#171719] text-xs text-[#AEAEB2]">
              <ShieldCheck className="w-4 h-4 text-[#0A84FF] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Cloud Neural Processing:</strong> High-speed reasoning with contextual dialogue memory, instant response streaming, and zero device configuration.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Voice & Speech Engine */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
            Voice & Speech
          </span>
        </div>

        <div className="rounded-2xl bg-[#1C1C1E] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-lg">
          {/* Accent Selection */}
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Accent</p>
                <p className="text-[10px] text-[#8E8E93]">Choose speech accent for Anshul</p>
              </div>
            </div>

            {/* 4 Accent Cards */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {ACCENT_OPTIONS.map((acc) => {
                const isSelected = selectedAccent === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      triggerHaptic('light');
                      onUpdateSettings({
                        ...settings,
                        voiceGender: 'male',
                        voiceAccent: acc.id,
                      });
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A84FF]/15 border-[#0A84FF] shadow-sm'
                        : 'bg-[#2C2C2E]/60 border-white/[0.06] hover:border-white/[0.15] hover:bg-[#2C2C2E]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-lg leading-none">{acc.flag}</span>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-[#D1D1D6]'
                          }`}
                        >
                          {acc.label}
                        </p>
                        <p className="text-[10px] text-[#8E8E93] truncate">{acc.region}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#0A84FF] text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Voice Info & Live Preview Button */}
            <div className="mt-2 p-3 rounded-xl bg-black/30 border border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center flex-shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">
                    {activeVoiceInfo.voiceName}
                  </p>
                  <p className="text-[10px] text-[#8E8E93]">
                    {activeVoiceInfo.accentName} Profile Active
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestVoice}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer flex-shrink-0 ${
                  isPreviewPlaying
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-sm'
                }`}
              >
                {isPreviewPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Vocal Depth / Pitch Slider */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/25">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Vocal Depth & Tone</span>
                  <p className="text-[10px] text-[#8E8E93]">Adjust pitch and resonance</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-white bg-[#2C2C2E] px-2 py-0.5 rounded-md border border-white/[0.06]">
                {(settings.speechPitch ?? 1.0).toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.15"
              step="0.05"
              value={settings.speechPitch ?? 1.0}
              onChange={(e) =>
                onUpdateSettings({ ...settings, speechPitch: parseFloat(e.target.value) })
              }
              className="w-full accent-[#0A84FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8E8E93] px-1 font-medium">
              <span>Deep (0.75x)</span>
              <span>Natural (1.0x)</span>
              <span>Crisp (1.15x)</span>
            </div>
          </div>

          {/* Speech Rate Slider */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/25">
                  <Sliders className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Speech Pace</span>
              </div>
              <span className="text-[11px] font-mono text-white bg-[#2C2C2E] px-2 py-0.5 rounded-md border border-white/[0.06]">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.25"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) =>
                onUpdateSettings({ ...settings, speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-[#0A84FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8E8E93] px-1 font-medium">
              <span>Relaxed (0.8x)</span>
              <span>Natural (1.0x)</span>
              <span>Brisk (1.25x)</span>
            </div>
          </div>

          {/* Audio Output Switch */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Speech Synthesis Audio</p>
                <p className="text-[10px] text-[#8E8E93]">Play vocal responses through speaker</p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                settings.soundEnabled ? 'bg-[#34C759]' : 'bg-[#39393D]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic Vibration Switch */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/25">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Haptic Feedback</p>
                <p className="text-[10px] text-[#8E8E93]">Tactile vibration on tap and voice events</p>
              </div>
            </div>

            <button
              onClick={() => {
                const next = !(settings.hapticEnabled ?? true);
                triggerHaptic('light', next);
                onUpdateSettings({ ...settings, hapticEnabled: next });
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                settings.hapticEnabled ?? true ? 'bg-[#34C759]' : 'bg-[#39393D]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  settings.hapticEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: System Power & Voice State */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider px-2">
          Power & Standby
        </span>

        <div className="rounded-2xl bg-[#1C1C1E] border border-white/[0.08] p-4 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3.5 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isSleeping
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isSleeping ? <Radio className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {isSleeping ? 'Standby Mode' : 'Assistant Online'}
              </h4>
              <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-tight">
                {isSleeping
                  ? 'Listening paused. Tap to reactivate voice services.'
                  : 'Background voice trigger ready for speech.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(isSleeping ? 'heavy' : 'light');
              onTriggerAction(isSleeping ? 'wake' : 'sleep');
            }}
            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold tracking-normal transition active:scale-95 cursor-pointer ${
              isSleeping
                ? 'bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-md'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-[#AEAEB2] hover:text-white border border-white/[0.08]'
            }`}
          >
            {isSleeping ? 'Wake Up' : 'Standby'}
          </button>
        </div>
      </div>

      {/* Section 4: System & Support */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider px-2">
          System & Support
        </span>

        <div className="rounded-2xl bg-[#1C1C1E] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-lg">
          {/* Feature Guide */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenGuide();
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-[#0A84FF] flex items-center justify-center border border-blue-500/25">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Feature Guide</p>
                <p className="text-[10px] text-[#8E8E93]">View key capabilities, voice commands, and utilities</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition" />
          </button>

          {/* Add to Home Screen */}
          {canInstallPWA && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onInstallPWA();
              }}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Add to Home Screen</p>
                  <p className="text-[10px] text-[#8E8E93]">Install as standalone native iOS or Android app</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
            </button>
          )}

          {/* Reset Settings */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onResetDefaults();
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-500/5 transition cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/25">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400">Restore Default Settings</p>
                <p className="text-[10px] text-[#8E8E93]">Reset vocal pace and model configurations</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-rose-400 transition" />
          </button>
        </div>
      </div>

      {/* App Identity & Version */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6 space-y-2">
        <AppLogo size="lg" />
        <div className="text-center">
          <p className="text-sm font-extrabold text-white tracking-wider">A.N.S.H.U.L.</p>
          <p className="text-[11px] text-[#8E8E93]">Voice Intelligence Platform &bull; v3.2</p>
        </div>
      </div>
    </div>
  );
};
