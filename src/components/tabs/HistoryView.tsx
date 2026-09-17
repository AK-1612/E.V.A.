import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Calendar,
  Search,
  Volume2,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { CommandHistoryItem } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface HistoryViewProps {
  history: CommandHistoryItem[];
  onClearHistory: () => void;
  onReplayVoice?: (text: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onReplayVoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Format date helper
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Group items into pairs of User Query + A.N.S.H.U.L. Response sessions
  interface ChatSession {
    id: string;
    date: string;
    timestamp: string;
    userQuery: string;
    anshulReply: string;
    actionType?: string;
  }

  const sessions = useMemo(() => {
    const list: ChatSession[] = [];
    let currentUserQuery: CommandHistoryItem | null = null;
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      const itemDate = item.date || todayStr;

      if (item.sender === 'user') {
        if (currentUserQuery) {
          list.push({
            id: currentUserQuery.id,
            date: currentUserQuery.date || todayStr,
            timestamp: currentUserQuery.timestamp,
            userQuery: currentUserQuery.text,
            anshulReply: '',
            actionType: currentUserQuery.actionType,
          });
        }
        currentUserQuery = item;
      } else if (item.sender === 'anshul') {
        if (currentUserQuery) {
          list.push({
            id: `${currentUserQuery.id}-${item.id}`,
            date: item.date || currentUserQuery.date || todayStr,
            timestamp: item.timestamp || currentUserQuery.timestamp,
            userQuery: currentUserQuery.text,
            anshulReply: item.text,
            actionType: currentUserQuery.actionType || item.actionType,
          });
          currentUserQuery = null;
        } else {
          list.push({
            id: item.id,
            date: item.date || todayStr,
            timestamp: item.timestamp,
            userQuery: '',
            anshulReply: item.text,
            actionType: item.actionType,
          });
        }
      }
    }

    if (currentUserQuery) {
      list.push({
        id: currentUserQuery.id,
        date: currentUserQuery.date || todayStr,
        timestamp: currentUserQuery.timestamp,
        userQuery: currentUserQuery.text,
        anshulReply: '',
        actionType: currentUserQuery.actionType,
      });
    }

    return list.reverse();
  }, [history]);

  // Extract unique dates for horizontal date selector
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    const today = new Date().toISOString().split('T')[0];
    dates.add(today);

    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.add(d.toISOString().split('T')[0]);
    }

    sessions.forEach((s) => dates.add(s.date));
    return Array.from(dates).sort().reverse();
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesDate = selectedDateFilter === 'all' || session.date === selectedDateFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        session.userQuery.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.anshulReply.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [sessions, selectedDateFilter, searchQuery]);

  // Group by Date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: ChatSession[] } = {};
    filteredSessions.forEach((s) => {
      if (!groups[s.date]) {
        groups[s.date] = [];
      }
      groups[s.date].push(s);
    });
    return groups;
  }, [filteredSessions]);

  return (
    <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6 space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">History</h1>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Verified timeline of voice prompts and intelligence responses
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onClearHistory();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-rose-500/10 text-xs font-semibold text-[#8E8E93] hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts or answers..."
          className="w-full pl-10 pr-12 py-2.5 bg-[#1C1C1E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition"
        />
        {searchQuery && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setSearchQuery('');
            }}
            className="text-[11px] font-semibold text-[#8E8E93] hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Date Filter Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Timeline Filter</span>
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedDateFilter('all');
            }}
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition cursor-pointer ${
              selectedDateFilter === 'all'
                ? 'text-[#0A84FF] bg-[#0A84FF]/15 border border-[#0A84FF]/30'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            All Activity ({sessions.length})
          </button>
        </div>

        {/* Day Pills */}
        <div className="flex space-x-2 overflow-x-auto py-1 scrollbar-none">
          {uniqueDates.map((dateStr) => {
            const parts = dateStr.split('-');
            const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const dayNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
            const isSelected = selectedDateFilter === dateStr;
            const countForDate = sessions.filter((s) => s.date === dateStr).length;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDateFilter(isSelected ? 'all' : dateStr);
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-md shadow-blue-950/50 scale-105'
                    : 'bg-[#1C1C1E] border-white/[0.06] hover:border-white/[0.15] text-[#8E8E93]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{dayName}</span>
                <span
                  className={`text-base font-extrabold my-0.5 ${
                    isSelected ? 'text-white' : 'text-[#F2F2F7]'
                  }`}
                >
                  {dayNum}
                </span>
                <div className="flex items-center space-x-0.5 h-2">
                  {countForDate > 0 ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#0A84FF]'
                      }`}
                    />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-transparent" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* History Items List */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-[#1C1C1E] rounded-3xl border border-white/[0.06] p-6 shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] mx-auto flex items-center justify-center text-[#8E8E93] border border-white/[0.08]">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">No interactions recorded</p>
          <p className="text-xs text-[#8E8E93] max-w-xs mx-auto leading-relaxed">
            {searchQuery
              ? 'No conversations match your search query.'
              : 'Tap the microphone on the Assistant tab to record your first interaction.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedByDate) as [string, ChatSession[]][]).map(([dateStr, daySessions]) => (
            <div key={dateStr} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white tracking-wide">
                    {formatDateLabel(dateStr)}
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-mono">
                    {dateStr}
                  </span>
                </div>
                <span className="text-[10px] text-[#AEAEB2] font-semibold bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                  {daySessions.length} {daySessions.length === 1 ? 'interaction' : 'interactions'}
                </span>
              </div>

              {/* Chat Cards */}
              <div className="space-y-2.5">
                {daySessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-md space-y-3"
                  >
                    {/* User Prompt */}
                    {session.userQuery && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                            U
                          </div>
                          <p className="text-xs font-semibold text-white break-words leading-relaxed">
                            {session.userQuery}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#8E8E93] font-mono flex-shrink-0">
                          {session.timestamp}
                        </span>
                      </div>
                    )}

                    {/* Assistant Response */}
                    {session.anshulReply && (
                      <div className="flex items-start justify-between gap-3 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/40 text-[#64D2FF] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3" />
                          </div>
                          <p className="text-xs text-[#D1D1D6] leading-relaxed break-words font-medium">
                            {session.anshulReply}
                          </p>
                        </div>

                        {/* Audio Replay Button */}
                        {onReplayVoice && (
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              onReplayVoice(session.anshulReply);
                            }}
                            title="Replay speech"
                            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#8E8E93] hover:text-[#64D2FF] transition flex-shrink-0 cursor-pointer border border-white/[0.04]"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action pill if dispatched */}
                    {session.actionType && session.actionType !== 'none' && (
                      <div className="flex items-center space-x-2 pt-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#0A84FF] bg-[#0A84FF]/10 px-2.5 py-0.5 rounded-full border border-[#0A84FF]/20">
                          {session.actionType} dispatched
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
