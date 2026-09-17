import React from 'react';
import { Mic, LayoutGrid, Clock, Settings } from 'lucide-react';
import { AppTab } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface TabBarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isListening: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onSelectTab, isListening }) => {
  const tabs = [
    {
      id: 'assistant' as AppTab,
      label: 'Assistant',
      icon: Mic,
      showPulse: isListening,
    },
    {
      id: 'actions' as AppTab,
      label: 'Actions',
      icon: LayoutGrid,
    },
    {
      id: 'history' as AppTab,
      label: 'History',
      icon: Clock,
    },
    {
      id: 'settings' as AppTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="w-full fixed bottom-0 left-0 right-0 z-40 bg-[#121214]/90 backdrop-blur-2xl border-t border-white/[0.08] px-4 pt-2.5 pb-6 sm:pb-3.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-95 cursor-pointer relative ${
                isActive ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-[#D1D1D6]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.showPulse && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold tracking-tight ${
                  isActive ? 'text-[#0A84FF]' : 'text-[#8E8E93]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
