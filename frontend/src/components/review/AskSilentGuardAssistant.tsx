import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Bot,
  User,
  Copy,
  Check,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import type { Finding } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AskSilentGuardAssistantProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  onAsk: (question: string, findingId?: string) => Promise<string>;
}

const QUICK_PROMPTS = [
  "Explain like I'm 5: What is wrong here?",
  'Which issue should I prioritize fixing first?',
  'What are the real-world consequences if I ignore this?',
  'Can you explain this CWE in plain English?',
  'How do I fix this without breaking existing features?',
];

const getFormattedTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const createInitialMessage = (): Message => ({
  id: 'init_welcome',
  sender: 'assistant',
  text:
    'Hello! I am your SilentGuard AI Security & Architecture Assistant. Ask me anything about this finding, its underlying cause, severity, or how to implement a safe fix.',
  timestamp: getFormattedTimestamp(),
});

export const AskSilentGuardAssistant: React.FC<AskSilentGuardAssistantProps> = ({
  finding,
  isOpen,
  onClose,
  onAsk,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => [createInitialMessage()]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await onAsk(trimmed, finding?.id);
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an error retrieving an answer. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-zinc-950/95 backdrop-blur-xl border-l border-white/[0.1] shadow-2xl flex flex-col animate-bento-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5722] to-amber-600 text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Ask SilentGuard AI</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-emerald-300">
                Grounded
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Context: {finding ? `${finding.ruleId} (${finding.filePath}:${finding.line})` : 'Repository General'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Close Drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Finding Context Pill */}
      {finding && (
        <div className="border-b border-white/[0.06] bg-black/40 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="truncate text-zinc-300">
            <span className="font-mono text-[#FF5722] font-semibold">{finding.ruleId}: </span>
            <span className="font-medium text-white">{finding.title}</span>
          </div>
          <span className="shrink-0 rounded bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            Line {finding.line}
          </span>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-200 border border-white/[0.1]'
                    : 'bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#FF5722] text-white font-medium rounded-tr-none'
                    : 'bg-black/60 border border-white/[0.08] text-zinc-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-white/70' : 'text-zinc-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-white"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-black/60 border border-white/[0.08] px-4 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF5722]" />
              <span>Analyzing code and finding evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-white/[0.06] bg-black/30 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          <HelpCircle className="h-3 w-3 text-[#FF5722]" />
          <span>Quick Prompts</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isTyping}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300 hover:border-white/20 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50 text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-white/[0.08] p-4 bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about this finding or how to remediate it..."
            className="flex-1 rounded-xl border border-white/[0.1] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5722] text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
