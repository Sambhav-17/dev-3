import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { ChatMessage } from '../../types/index.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Cpu,
  Clock,
} from 'lucide-react';

const SUGGESTIONS = [
  'How do I eliminate 2 hours of repetitive email typing every day?',
  'Draft a polite 2-sentence follow up to a pending vendor contract.',
  'What is the best way to run Ollama locally for complete data privacy?',
  'Convert this workflow into a 3-step checklist.',
];

export const AIAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Welcome! I'm your open-weight LazyFlow assistant. I'm here to help you eliminate digital busywork, brainstorm automations, format text, and reclaim your time. What can I take off your shoulders today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { activeModel, ollamaStatus, reportLatency } = useAI();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chat(text, historyPayload);

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'assistant',
        content: res.response,
        timestamp: Date.now(),
        meta: res.meta,
      };

      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      toast(err?.message || 'Failed to receive assistant response', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, content: string) => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopiedId(id);
      toast('Copied response to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared. What else would you like to automate today?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[850px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>AI Productivity Copilot</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time open-weight conversational assistant running on {activeModel}
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 max-w-3xl ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.content}</div>

              {m.role === 'assistant' && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    {m.meta?.latencyMs && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {m.meta.latencyMs}ms
                      </span>
                    )}
                    {m.meta?.model && (
                      <span className="flex items-center gap-1 font-mono">
                        <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                        {m.meta.model}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(m.id, m.content)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title="Copy message"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 mr-auto p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
            <span>Thinking with open-weight intelligence...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {messages.length < 3 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask for an automation, summary, email draft, or everyday productivity advice..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
