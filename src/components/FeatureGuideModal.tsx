import React from 'react';
import { X, Mic, Send, Search, Music, Cpu } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { AppLogo } from './AppLogo';

interface FeatureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureGuideModal: React.FC<FeatureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: Mic,
      iconColor: 'text-[#0A84FF]',
      bgColor: 'bg-[#0A84FF]/15 border-[#0A84FF]/30',
      title: 'Voice Assistant',
      description: 'Tap the microphone or say "wake up" to interact naturally. Speaks replies in real time.',
    },
    {
      icon: Send,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15 border-emerald-500/30',
      title: 'WhatsApp Dispatch',
      description: 'Say "message on WhatsApp" or use the quick action to compose and send messages directly.',
    },
    {
      icon: Search,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15 border-cyan-500/30',
      title: 'Google Web Search',
      description: 'Say "search for..." to quickly search the web for facts, questions, or live information.',
    },
    {
      icon: Music,
      iconColor: 'text-[#1DB954]',
      bgColor: 'bg-emerald-500/15 border-emerald-500/30',
      title: 'Spotify Audio',
      description: 'Say "play music" or "open Spotify" to launch your favorite tracks and playlists.',
    },
    {
      icon: Cpu,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/15 border-purple-500/30',
      title: 'Dual Intelligence Engine',
      description: 'Switch seamlessly between Google Gemini Cloud and Local Ollama with automatic failover.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#1C1C1E] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 text-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Title and Cross Dismiss Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-3">
            <AppLogo size="sm" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Feature Guide</h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">Key capabilities of A.N.S.H.U.L.</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#8E8E93] hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Feature List */}
        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start space-x-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${item.bgColor} ${item.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-tight">{item.title}</h4>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Dismiss Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
