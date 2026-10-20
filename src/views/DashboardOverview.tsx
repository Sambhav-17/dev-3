import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { StatsData, SavedResult } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useAI } from '../context/AIContext.js';
import { formatDate } from '../lib/utils.js';
import { Modal } from '../components/Modal.js';
import {
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  CheckSquare,
  Mail,
  Calendar,
  ShoppingCart,
  FolderKanban,
  HelpCircle,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user, isGuest } = useAuth();
  const { activeModel, ollamaStatus } = useAI();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentResults, setRecentResults] = useState<SavedResult[]>([]);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getStats(),
          api.getHistory({ search: '' }),
        ]);
        setStats(statsData);
        setRecentResults(historyData.results.slice(0, 5));
      } catch {
        // Fallback or silent fail
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickAutomate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;

    const lower = quickPrompt.toLowerCase();
    if (lower.includes('email') || lower.includes('mail') || lower.includes('write')) {
      onNavigate('tool-email');
    } else if (lower.includes('task') || lower.includes('todo') || lower.includes('action')) {
      onNavigate('tool-tasks');
    } else if (lower.includes('plan') || lower.includes('schedule') || lower.includes('calendar')) {
      onNavigate('tool-planner');
    } else if (lower.includes('grocery') || lower.includes('shop') || lower.includes('food') || lower.includes('recipe')) {
      onNavigate('tool-grocery');
    } else if (lower.includes('note') || lower.includes('organize')) {
      onNavigate('tool-notes');
    } else {
      onNavigate('tool-summarize');
    }
  };

  const quickTools = [
    {
      id: 'tool-summarize',
      title: 'Smart Summaries',
      desc: 'Condense long articles & notes in 1 click',
      icon: FileText,
      color: 'emerald',
      bg: 'hover:border-emerald-500/40',
    },
    {
      id: 'tool-tasks',
      title: 'Extract Action Items',
      desc: 'Pull deliverables & priorities from transcripts',
      icon: CheckSquare,
      color: 'indigo',
      bg: 'hover:border-indigo-500/40',
    },
    {
      id: 'tool-email',
      title: 'Email Polisher',
      desc: 'Turn hasty drafts into diplomatic messages',
      icon: Mail,
      color: 'purple',
      bg: 'hover:border-purple-500/40',
    },
    {
      id: 'tool-planner',
      title: 'Daily Planner',
      desc: 'Formulate realistic schedule with focus blocks',
      icon: Calendar,
      color: 'amber',
      bg: 'hover:border-amber-500/40',
    },
  ];

  const currentDateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-emerald-950/20 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentDateStr}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.name || 'Explorer'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Your open-weight automation workspace is active. Let AI tackle the repetitive busywork today so you can protect your energy for high-leverage creative thinking.
          </p>

          {/* Prominent Quick-Action Bar */}
          <form onSubmit={handleQuickAutomate} className="pt-2 flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="What would you like to automate right now? (e.g. summarize notes, rewrite email...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!quickPrompt.trim()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 shrink-0 disabled:opacity-40"
            >
              Go →
            </button>
          </form>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Time Saved */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>Time Saved</span>
              <button
                onClick={() => setIsFormulaModalOpen(true)}
                className="text-slate-500 hover:text-slate-300"
                title="View transparent calculation model"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {stats ? `${stats.estimatedTimeSavedHours}h` : '0.0h'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Based on transparent workflow benchmarks</span>
          </div>
        </div>

        {/* AI Operations Performed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Operations</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono">
            {stats?.totalOperations ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 6 automation tools
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Done</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">
            {stats ? `${stats.tasksCompleted} / ${stats.totalTasks}` : '0 / 0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Persisted on SQLite Task Board
          </div>
        </div>

        {/* Active AI Engine */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Inference Model</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-200 font-mono truncate">
            {activeModel}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span>{ollamaStatus === 'connected' ? 'Ollama Online' : 'Semantic Fallback'}</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Frequent Automation Tools</span>
          </h2>
          <span className="text-xs text-slate-500">Pick a task to delegate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickTools.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer transition-all ${t.bg} group flex flex-col justify-between`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-300">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Results Widget */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-200">Recent Saved Automations</h2>
            <p className="text-xs text-slate-400">Past outputs stored in your private SQLite database</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentResults.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {recentResults.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('history')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-950/40 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.toolType}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate font-sans">
                    {item.outputContent}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  {formatDate(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No saved automations yet. Try out the Summarizer or Task Extractor above!
          </div>
        )}
      </div>

      {/* Transparent Calculation Model Modal */}
      <Modal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        title="Time Saved Calculation Methodology"
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            In accordance with the Hacktoberfest Open-Source AI guidelines, LazyFlow AI does not use fabricated marketing metrics. Our time-saved estimates are grounded in standard knowledge worker task benchmarks:
          </p>

          <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px]">
            <div className="flex justify-between">
              <span>• Smart Summary:</span>
              <span className="text-emerald-400">~12 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Task Extraction:</span>
              <span className="text-emerald-400">~15 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Email Rewriting:</span>
              <span className="text-emerald-400">~10 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Note Organizing:</span>
              <span className="text-emerald-400">~18 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Daily Schedule Planning:</span>
              <span className="text-emerald-400">~20 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Grocery List Categorization:</span>
              <span className="text-emerald-400">~8 minutes saved</span>
            </div>
            <div className="flex justify-between">
              <span>• Completed Task Execution:</span>
              <span className="text-emerald-400">~4 minutes credited</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Formula: Total Minutes = Sum(Operation Count × Task Weight) + (Completed Tasks × 4m). All counts originate directly from your local SQLite database rows.
          </p>
        </div>
      </Modal>
    </div>
  );
};
