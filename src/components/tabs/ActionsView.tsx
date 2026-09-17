import React from 'react';
import {
  MessageSquare,
  Search,
  Music,
  Clock,
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
      description: 'Instant message compose and direct launch into official WhatsApp.',
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
      description: 'One-touch launcher for playlists, favorites, and music controls.',
      icon: Music,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-[#1DB954]',
      tag: 'Music Player',
      actionKey: 'music' as const,
    },
    {
      id: 'time',
      title: 'Temporal Status',
      category: 'System & Utilities',
      description: 'Natural spoken date, weekday, and real-time clock narration.',
      icon: Clock,
      iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      tag: 'Local Device',
      actionKey: 'time' as const,
    },
  ];

  return (
    <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6 space-y-6 pb-28">
      {/* Premium Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Actions</h1>
        <p className="text-xs text-[#8E8E93] mt-0.5">
          One-tap automation shortcuts and system utilities
        </p>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                triggerHaptic('medium');
                onTriggerAction(card.actionKey);
              }}
              className="group relative flex flex-col justify-between p-4.5 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] hover:border-[#0A84FF]/40 hover:bg-[#242426] active:scale-[0.98] transition-all duration-200 text-left shadow-lg cursor-pointer min-h-[140px]"
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-[#8E8E93] bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  {card.tag}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  {card.category}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-[#64D2FF] transition-colors flex items-center gap-1.5 mt-0.5">
                  <span>{card.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-[#AEAEB2] mt-1 leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
