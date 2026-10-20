import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { NoteOrganizerResult } from '../../types/index.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  FolderKanban,
  Sparkles,
  BookOpen,
  Trash2,
  Save,
  Copy,
  Check,
  Search,
  CheckCircle2,
  ListFilter,
  Lightbulb,
} from 'lucide-react';

const SAMPLE_NOTES = `random ideas from research session:
need to check ollama v0.5 streaming protocol vs raw generate endpoint
key decision: use standard json schema enforcement to prevent hallucinated keys
don't forget: update env.example with OLLAMA_BASE_URL default
performance note: on mac m-series, qwen2.5 7b does ~45 tokens/second with metal acceleration
follow up with github maintainers regarding hacktoberfest week 3 topic tag #slowandsteady
idea: add export to markdown feature for obsidian users`;

export const NoteOrganizerTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<NoteOrganizerResult | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handleOrganize = async () => {
    if (!inputText.trim()) {
      toast('Please enter notes to organize.', 'error');
      return;
    }
    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.organizeNotes(inputText);
      setResult(res.result);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast('Notes organized into structured hierarchy!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to organize notes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!result) return;
    const md = `# ${result.title}\n\n## Key Takeaways\n${result.keyPoints.map((k) => `- ${k}`).join('\n')}\n\n## Action Items\n${result.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n## Categories\n${result.categories.map((c) => `### ${c.name}\n${c.notes.map((n) => `- ${n}`).join('\n')}`).join('\n\n')}`;
    const ok = await copyToClipboard(md);
    if (ok) {
      setIsCopied(true);
      toast('Copied organized notes as Markdown!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await api.saveResult({
        toolType: 'organize-notes',
        title: result.title || `Organized Notes — ${new Date().toLocaleDateString()}`,
        originalInput: inputText,
        outputContent: JSON.stringify(result),
        metadata: { categoryCount: result.categories.length, meta },
      });
      setIsSaved(true);
      toast('Organized notes saved to History!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save notes', 'error');
    }
  };

  // Filter items based on user search term
  const filteredKeyPoints = result?.keyPoints.filter((k) =>
    k.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredActionItems = result?.actionItems.filter((a) =>
    a.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-emerald-400" />
            <span>Note Organizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cluster scattered thoughts, brainstorming fragments, and messy drafts into structured categories, key takeaways, and action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_NOTES);
              toast('Sample brain-dump loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => {
              setInputText('');
              setResult(null);
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
        {/* Left: Input */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-medium text-slate-400">Raw Brain Dump</span>
            <span className="text-xs text-slate-500">{inputText.length} characters</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Jot down or paste your raw stream-of-consciousness, scratchpad notes, meeting takeaways..."
            rows={15}
            className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 font-sans leading-relaxed resize-none"
          />

          <button
            onClick={handleOrganize}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Synthesizing Categories...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Organize Notes</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Structured Output */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
              <span>Structured Architecture</span>
            </span>

            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg flex items-center gap-1 text-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Markdown</span>
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
                <p className="text-xs font-mono">Clustering concepts & actionables...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Search in organized notes */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter points or actions..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-100 pb-1 border-b border-slate-800">
                    {result.title}
                  </h3>

                  {/* Key Takeaways */}
                  {filteredKeyPoints && filteredKeyPoints.length > 0 && (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" /> Key Takeaways
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {filteredKeyPoints.map((k, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{k}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {filteredActionItems && filteredActionItems.length > 0 && (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Action Items
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {filteredActionItems.map((a, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Categories */}
                  {result.categories.map((cat, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                      <div className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                        <ListFilter className="w-3.5 h-3.5" /> {cat.name}
                      </div>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {cat.notes.map((note, nIdx) => (
                          <li key={nIdx} className="flex items-start gap-2">
                            <span className="text-slate-600">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <FolderKanban className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">No organized notes yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Paste unstructured brainstorms or research fragments to generate categorical headings, key points, and next steps.
                </p>
              </div>
            )}

            {meta && result && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Model: {meta.model}</span>
                <span>Latency: {meta.latencyMs}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
