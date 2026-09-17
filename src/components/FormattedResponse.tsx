import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Terminal,
  Maximize2,
  Minimize2,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface FormattedResponseProps {
  messages: ChatMessage[];
  lastResponse?: string;
  isListening?: boolean;
  isRecognizing?: boolean;
  transcript?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStartNewChat: () => void;
}

interface CodeBlockPart {
  type: 'code';
  language: string;
  code: string;
}

interface TextPart {
  type: 'text';
  text: string;
}

type ParsedPart = CodeBlockPart | TextPart;

export const FormattedResponse: React.FC<FormattedResponseProps> = ({
  messages,
  lastResponse,
  isListening,
  isRecognizing,
  transcript,
  isExpanded,
  onToggleExpand,
  onStartNewChat,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message in the follow-up chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecognizing, isListening]);

  // Parse markdown code blocks
  const parseContent = (raw: string): ParsedPart[] => {
    if (!raw) return [];

    const parts: ParsedPart[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-+#]*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(raw)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        const textBefore = raw.substring(lastIndex, match.index).trim();
        if (textBefore) {
          parts.push({ type: 'text', text: textBefore });
        }
      }

      const language = match[1] ? match[1].toLowerCase().trim() : 'code';
      const code = match[2].trim();
      parts.push({ type: 'code', language, code });
      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < raw.length) {
      const remainingText = raw.substring(lastIndex).trim();
      if (remainingText) {
        parts.push({ type: 'text', text: remainingText });
      }
    }

    return parts.length > 0 ? parts : [{ type: 'text', text: raw }];
  };

  const handleCopyCode = (codeText: string, key: string) => {
    triggerHaptic('success');
    navigator.clipboard.writeText(codeText);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Render inline formatting (bold, inline code)
  const renderInlineFormatted = (text: string) => {
    // Split by inline code `...`
    const segments = text.split(/(`[^`]+`)/g);

    return segments.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-emerald-400 font-mono text-xs font-semibold border border-white/10"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }

      // Handle bold text **...**
      const boldSegments = seg.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {boldSegments.map((bSeg, j) => {
            if (bSeg.startsWith('**') && bSeg.endsWith('**') && bSeg.length > 4) {
              return (
                <strong key={j} className="font-bold text-white">
                  {bSeg.slice(2, -2)}
                </strong>
              );
            }
            return bSeg;
          })}
        </span>
      );
    });
  };

  const renderMessageContent = (content: string, messageId: string) => {
    const parsedParts = parseContent(content);

    return parsedParts.map((part, pIdx) => {
      if (part.type === 'code') {
        const copyId = `${messageId}-${pIdx}`;
        const isCopied = copiedKey === copyId;
        return (
          <div
            key={pIdx}
            className="rounded-xl overflow-hidden border border-white/15 bg-[#121316] shadow-lg my-2.5"
          >
            {/* Code Block Header with copy button */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#1A1B20] border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {part.language || 'code'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(part.code, copyId)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white border border-white/10'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>

            {/* Preformatted Code with horizontal scroll */}
            <div className="p-3.5 overflow-x-auto bg-[#0E1013]">
              <pre className="font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed tab-4 select-text">
                <code>{part.code}</code>
              </pre>
            </div>
          </div>
        );
      }

      // Text rendering with paragraph and list handling
      return (
        <div key={pIdx} className="space-y-2 text-sm sm:text-[15px] font-normal text-[#F2F2F7] leading-relaxed">
          {part.text.split('\n\n').map((paragraph, pgIdx) => {
            if (paragraph.includes('\n- ') || paragraph.startsWith('- ') || paragraph.includes('\n* ')) {
              const lines = paragraph.split('\n');
              return (
                <ul key={pgIdx} className="space-y-1.5 pl-2 my-1.5">
                  {lines.map((line, lIdx) => {
                    const cleanLine = line.replace(/^[-*]\s+/, '').trim();
                    return (
                      <li key={lIdx} className="flex items-start space-x-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] mt-2 flex-shrink-0" />
                        <span>{renderInlineFormatted(cleanLine)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            return (
              <p key={pgIdx} className="whitespace-pre-line">
                {renderInlineFormatted(paragraph)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Determine display list: prefer active chat messages, fallback to single lastResponse
  const displayMessages =
    messages.length > 0
      ? messages
      : lastResponse
      ? [
          {
            id: 'initial-response',
            sender: 'anshul' as const,
            text: lastResponse,
            displayText: lastResponse,
            timestamp: 'Just now',
          },
        ]
      : [];

  return (
    <div
      className={`w-full rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 ${
        isExpanded ? 'h-[74vh] sm:h-[78vh]' : 'max-h-60 sm:max-h-68'
      }`}
    >
      {/* Clean Header Bar: Conversation Title + Sleek Action Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-[#0A84FF]/15 flex items-center justify-center text-[#0A84FF] flex-shrink-0">
            <MessageSquare className="w-3 h-3" />
          </div>
          <span className="text-[12px] font-semibold text-[#F2F2F7] truncate">
            Conversation
          </span>
        </div>

        {/* Sleek, Pristine Action Toolbar (Icon Only) */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Start New Chat Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onStartNewChat();
            }}
            className="flex items-center justify-center w-7 h-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
            title="Start a new chat conversation"
            aria-label="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Expand / Collapse button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onToggleExpand();
            }}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition active:scale-95 cursor-pointer ${
              isExpanded
                ? 'text-[#0A84FF] bg-[#0A84FF]/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isExpanded ? 'Collapse answer view' : 'Expand full answer'}
            aria-label={isExpanded ? 'Collapse answer view' : 'Expand full answer'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Thread Messages Area with smooth scrolling */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar text-white">
        {displayMessages.length === 0 && !isListening && !isRecognizing && (
          <div className="py-6 text-center text-[#8E8E93] text-sm">
            <p>Every question follows up in this chat session.</p>
            <p className="text-xs text-zinc-500 mt-1">Tap &quot;New Chat&quot; anytime to start fresh.</p>
          </div>
        )}

        {displayMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-1.5`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] text-[#8E8E93] mb-1 px-1 font-medium">
                {isUser ? (
                  <>
                    <span className="text-zinc-400">You</span>
                    {msg.timestamp && (
                      <>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </>
                ) : (
                  msg.timestamp && <span>{msg.timestamp}</span>
                )}
              </div>

              <div
                className={`rounded-2xl transition-all ${
                  isUser
                    ? 'bg-[#0A84FF]/20 border border-[#0A84FF]/35 text-[#F2F2F7] rounded-tr-xs px-4 py-2.5 max-w-[88%] text-sm sm:text-[15px] leading-relaxed select-text shadow-sm'
                    : 'w-full bg-white/[0.04] border border-white/[0.08] rounded-tl-xs px-4 py-3 text-sm sm:text-[15px] leading-relaxed text-[#F2F2F7]'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-line">{msg.text}</p>
                ) : (
                  renderMessageContent(msg.displayText || msg.text, msg.id)
                )}
              </div>
            </div>
          );
        })}

        {/* Live speech transcription */}
        {isListening && (
          <div className="flex flex-col items-end my-1.5">
            <div className="text-[10px] text-rose-400 mb-1 px-1 font-medium">
              Transcribing live...
            </div>
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[88%] text-sm italic">
              {transcript ? `"${transcript}"` : 'Listening for your voice...'}
            </div>
          </div>
        )}

        {/* Quiet typing indicator when processing (NO audio announcing!) */}
        {isRecognizing && (
          <div className="flex items-center space-x-2 py-2 px-1">
            <div className="flex items-center space-x-1.5 bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-[#8E8E93] ml-1 font-medium">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
