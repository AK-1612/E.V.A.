import React, { useState } from 'react';
import { Send, X, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (phoneNumber: string, message: string) => void;
  initialPhone?: string;
  initialMessage?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSend,
  initialPhone = '',
  initialMessage = '',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [message, setMessage] = useState(initialMessage);

  React.useEffect(() => {
    setPhoneNumber(initialPhone);
  }, [initialPhone]);

  React.useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    triggerHaptic('success');
    onSend(phoneNumber.trim(), message.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-[#1C1C1E] border border-white/[0.08] shadow-2xl text-white">
        {/* iOS Grabber */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">WhatsApp Dispatch</h3>
              <p className="text-[11px] text-[#8E8E93]">Direct message launch</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 px-1">
              Recipient Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555 123 4567"
                required
                className="w-full pl-10 pr-3.5 py-3 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 px-1">
              Message Content
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message text..."
              required
              className="w-full p-3.5 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            >
              <span>Open WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
