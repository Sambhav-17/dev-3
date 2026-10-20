import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  Mail,
  Sparkles,
  BookOpen,
  Trash2,
  Save,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  Edit3,
} from 'lucide-react';

const SAMPLE_EMAIL = `hey, we gotta talk about the server crashes. you guys said it was fixed on monday but it broke again today during client demo. really frustrated with this back and forth. need an explanation and when this will actually be resolved.`;

export const EmailAssistantTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<'professional' | 'concise' | 'friendly' | 'formal' | 'direct'>('professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [originalIntent, setOriginalIntent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handleRewrite = async () => {
    if (!inputText.trim()) {
      toast('Please enter a draft message to refine.', 'error');
      return;
    }
    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.rewriteEmail(inputText, tone);
      setSubject(res.result.subject);
      setBody(res.result.body);
      setOriginalIntent(res.result.originalIntent);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast('Draft polished successfully!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to rewrite email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setIsCopied(true);
      toast('Email subject & body copied!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!body.trim()) return;
    try {
      await api.saveResult({
        toolType: 'rewrite-email',
        title: subject || `Email (${tone}) — ${inputText.slice(0, 20)}`,
        originalInput: inputText,
        outputContent: `Subject: ${subject}\n\n${body}`,
        metadata: { tone, originalIntent, meta },
      });
      setIsSaved(true);
      toast('Email draft saved to History!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save email', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-emerald-400" />
            <span>Email Assistant</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Transform emotional or rushed drafts into clear, calibrated communications while preserving your exact intent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_EMAIL);
              toast('Sample frustrated draft loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => {
              setInputText('');
              setSubject('');
              setBody('');
              setOriginalIntent('');
              setMeta(null);
              setIsSaved(false);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input and Tone Controls */}
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-medium text-slate-400 block">Select Desired Tone:</span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'professional', label: 'Professional' },
                  { id: 'concise', label: 'Ultra Concise' },
                  { id: 'friendly', label: 'Warm & Friendly' },
                  { id: 'direct', label: 'Direct & Action-Oriented' },
                  { id: 'formal', label: 'Formal Executive' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tone === t.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your rough thoughts, bullet points, or rushed draft..."
            rows={13}
            className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 font-sans leading-relaxed resize-none"
          />

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Intent Safeguard: LazyFlow AI will never automatically send emails or alter your underlying commitments.
            </span>
          </div>

          <button
            onClick={handleRewrite}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Calibrating Tone & Polish...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Polish Email</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Polished Output</span>
            </span>

            {body && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    isEditing ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEditing ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg flex items-center gap-1 text-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy Email</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[380px] p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono">Generating diplomatic phrasing and subject line...</p>
              </div>
            ) : body ? (
              <div className="space-y-4">
                {/* Subject Line */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-indigo-400" /> Suggested Subject
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-sm text-slate-100 font-medium"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-100 select-all">{subject}</div>
                  )}
                </div>

                {/* Email Body */}
                <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Body
                  </div>
                  {isEditing ? (
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={9}
                      className="w-full p-2.5 bg-slate-950 border border-indigo-500/50 rounded-lg text-sm text-slate-100 focus:outline-none font-sans leading-relaxed"
                    />
                  ) : (
                    <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans select-all">
                      {body}
                    </div>
                  )}
                </div>

                {/* Intent verification note */}
                {originalIntent && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                    <span className="font-semibold text-emerald-400">Intent Analysis: </span>
                    {originalIntent}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <Mail className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Draft awaiting refinement</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Input rough bullets or an emotional draft on the left. We'll adjust the tone, fix grammar, and craft a subject line.
                </p>
              </div>
            )}

            {meta && body && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Model: {meta.model}</span>
                <span>Inference: {meta.latencyMs}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
