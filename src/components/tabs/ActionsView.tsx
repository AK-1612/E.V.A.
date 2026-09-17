import React from 'react';
import {
  MessageSquare,
  Search,
  Music,
  ChevronRight,
} from 'lucide-react';
import { AssistantState } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface ActionsViewProps {
  assistantState: AssistantState;
  onTriggerAction: (action: 'whatsapp' | 'search' | 'music' | 'time' | 'sleep' | 'wake') => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  onTriggerAction,
}) => {

  const actionCards = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Dispatch',
      category: 'Messaging & Contacts',
      description: 'Instant message compose, contacts multi-select, and scheduled delivery.',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      tag: 'Native App',
      actionKey: 'whatsapp' as const,
    },
    {
      id: 'search',
      title: 'Google Search',
      category: 'Information & Web',
      description: 'Intelligent intent parsing for instant web knowledge lookup.',
      icon: Search,
      iconBg: 'bg-blue-500/15 border-blue-500/30 text-[#0A84FF]',
      tag: 'Web Engine',
      actionKey: 'search' as const,
    },
    {
      id: 'music',
      title: 'Spotify Audio',
      category: 'Media & Playback',
      description: 'Direct one-touch launcher into the official native Spotify app.',
      icon: Music,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-[#1DB954]',
      tag: 'Direct App',
      actionKey: 'music' as const,
    },
  ];

  return (
    <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6 space-y-6 pb-28">
      {/* Premium Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Actions</h1>
        <p className="text-xs text-[#8E8E93] mt-0.5">
          One-tap automation shortcuts and direct app integrations
        </p>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                triggerHaptic('medium');
                onTriggerAction(card.actionKey);
              }}
              className="group relative flex items-center justify-between p-4.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] hover:border-[#0A84FF]/40 hover:bg-[#242426] active:scale-[0.98] transition-all duration-200 text-left shadow-lg cursor-pointer min-h-[96px]"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1 pr-3">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      {card.category}
                    </span>
                    <span className="text-[9px] font-semibold text-[#8E8E93] bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#64D2FF] transition-colors mt-0.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#AEAEB2] mt-0.5 leading-relaxed truncate">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-[#0A84FF]/15 flex items-center justify-center text-[#8E8E93] group-hover:text-[#0A84FF] transition-colors flex-shrink-0">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

