import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  FileText,
  Copy,
  Check,
  Save,
  RotateCw,
  Trash2,
  Edit3,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react';

const SAMPLE_TEXT = `Team Sync & Sprint Planning Transcript - Project Orbit
Date: October 2026. Attendees: Maya, Sam, Jordan, Liam.
Maya reviewed the core deliverables for our open-source release. We noticed that user onboarding has too much friction because people are asked to configure complex API credentials before seeing any value. Sam suggested providing a local fallback mode so developers can test the tools immediately without needing an external subscription.
Jordan noted that the database operations need to be strictly isolated between registered users, while still supporting a guest sandbox mode for Hacktoberfest reviewers. Liam finished the benchmark on local open-weight inference with Qwen 2.5 and Llama 3.2. Response times averaged under 250 milliseconds with high synthesis fidelity.
Next steps: Liam will package the Docker compose file by Thursday. Jordan is finishing the SQLite schema migrations by tonight. Maya will write the DEV submission draft focusing on the "Slow and Steady" automation theme.`;

export const SummarizerTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [style, setStyle] = useState<'bullets' | 'paragraph' | 'executive'>('bullets');
  const [summary, setSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast('Please enter or paste text to summarize.', 'error');
      return;
    }
    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.summarize(inputText, length, style);
      setSummary(res.summary);
      setEditedSummary(res.summary);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast('Summary generated successfully!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to generate summary', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const contentToSave = isEditing ? editedSummary : summary;
    if (!contentToSave.trim()) return;

    try {
      await api.saveResult({
        toolType: 'summarize',
        title: `Summary (${style}) — ${inputText.slice(0, 30)}...`,
        originalInput: inputText,
        outputContent: contentToSave,
        metadata: { length, style, meta },
      });
      setIsSaved(true);
      toast('Summary saved to your history!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save summary', 'error');
    }
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedSummary : summary;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setIsCopied(true);
      toast('Copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSummary('');
    setEditedSummary('');
    setMeta(null);
    setIsEditing(false);
    setIsSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Smart Summarizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Condense lengthy articles, meeting transcripts, and messy notes into sharp, actionable summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_TEXT);
              toast('Sample transcript loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            {/* Length selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Length:</span>
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                {(['short', 'medium', 'detailed'] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                      length === len ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Format:</span>
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                {(['bullets', 'paragraph', 'executive'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStyle(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                      style === st ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'bullets' ? 'Bullets' : st === 'paragraph' ? 'Paragraph' : 'Executive'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste meeting notes, document text, articles, or transcripts here..."
              rows={14}
              className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all font-sans leading-relaxed resize-none"
            />
            <div className="absolute bottom-3 right-4 text-[11px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {inputText.length} chars • ~{Math.round(inputText.split(/\s+/).filter(Boolean).length)} words
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Synthesizing Summary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Result Preview</span>
            </span>

            {summary && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    isEditing ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Edit Mode"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEditing ? 'Done Editing' : 'Edit'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg flex items-center gap-1 text-xs"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved' : 'Save Result'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[350px] p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono">Running open-weight model inference...</p>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                {isEditing ? (
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={12}
                    className="w-full p-3 bg-slate-900 border border-indigo-500/50 rounded-xl text-sm text-slate-100 focus:outline-none font-sans leading-relaxed"
                  />
                ) : (
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {summary}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <FileText className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Ready to summarize</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Paste your text on the left, pick length & style, and let LazyFlow synthesize the core takeaways.
                </p>
              </div>
            )}

            {/* Inference metadata badge */}
            {meta && summary && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Model: {meta.model}
                </span>
                <span>Latency: {meta.latencyMs}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
