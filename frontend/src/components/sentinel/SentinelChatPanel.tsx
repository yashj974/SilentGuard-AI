import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  X,
  Minus,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react';
import type { ChatMessage } from './sentinelKnowledge';

interface SentinelChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onResetChat: () => void;
  isTyping: boolean;
  suggestedQuestions: string[];
}

export const SentinelChatPanel: React.FC<SentinelChatPanelProps> = ({
  isOpen,
  onClose,
  onMinimize,
  messages,
  onSendMessage,
  onResetChat,
  isTyping,
  suggestedQuestions,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    onSendMessage(trimmed);
    setInputValue('');
  };

  const handleSuggestedClick = (question: string) => {
    if (isTyping) return;
    onSendMessage(question);
  };

  return (
    <div
      role="dialog"
      aria-label="Sentinel AI Assistant Chat"
      className="fixed bottom-24 right-3 z-50 flex w-[calc(100vw-24px)] sm:w-[420px] max-h-[82vh] sm:max-h-[580px] flex-col overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0a0e1c] text-slate-100 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-900/40 bg-gradient-to-r from-purple-950/60 to-[#0d1326] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-md">
            <ShieldCheck className="h-4 w-4 text-purple-200" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0e1c]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">Sentinel</span>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-mono text-purple-300 border border-purple-500/30">
                PHASE 1
              </span>
            </div>
            <p className="text-[10px] text-slate-400">SilentGuard AI Assistant</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onResetChat}
            title="Start New Conversation"
            aria-label="Start New Conversation"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-purple-900/30 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMinimize}
            title="Minimize"
            aria-label="Minimize Chat Panel"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-purple-900/30 hover:text-white transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close Chat Panel"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-purple-900/30 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[85%]">
                {!isUser && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-tr-xs'
                      : 'bg-[#12182b] text-slate-200 border border-purple-900/30 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs">{msg.text}</p>

                  {/* Optional Action Button */}
                  {msg.actionButton && (
                    <div className="mt-3 pt-2 border-t border-purple-500/20">
                      <Link
                        to={msg.actionButton.url}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/30 px-3 py-1.5 text-[11px] font-semibold text-purple-200 hover:bg-purple-600/50 hover:text-white transition-colors border border-purple-500/30"
                      >
                        <span>{msg.actionButton.label}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/30 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 px-8">
                {msg.timestamp}
              </span>

              {/* Quick Replies Buttons (if any on this message) */}
              {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8 max-w-[90%]">
                  {msg.quickReplies.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedClick(q)}
                      className="rounded-full border border-purple-500/20 bg-purple-950/30 px-2.5 py-1 text-[10px] text-purple-300 hover:bg-purple-900/50 hover:border-purple-500/40 hover:text-white transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-[#12182b] border border-purple-900/30 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Section (if beginning of chat) */}
      {messages.length <= 1 && (
        <div className="border-t border-purple-900/20 bg-[#080c18] px-3.5 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            Suggested Topics
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestedClick(q)}
                className="rounded-lg border border-purple-900/30 bg-[#0e1428] p-2 text-left text-[11px] text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/40 hover:text-white transition-colors truncate"
                title={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-purple-900/40 bg-[#080c18] p-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Sentinel about code risk or scoring..."
          className="flex-1 rounded-xl border border-purple-900/40 bg-[#0e1428] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message to Sentinel"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
