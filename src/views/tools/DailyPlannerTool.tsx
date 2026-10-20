import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { DailyPlanResult, ScheduleItem } from '../../types/index.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  Calendar,
  Sparkles,
  BookOpen,
  Trash2,
  Save,
  Copy,
  Check,
  Coffee,
  Clock,
  BatteryCharging,
  Sliders,
} from 'lucide-react';

const SAMPLE_TASKS = `Deep focus: Write SQLite database migration scripts
Review PRs for Hacktoberfest submissions
Client follow-up email regarding SLA report
Run local Ollama benchmark for Llama 3.2
Update documentation and setup guide`;

export const DailyPlannerTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [availableHours, setAvailableHours] = useState<number>(8);
  const [plan, setPlan] = useState<DailyPlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handlePlan = async () => {
    const tasks = inputText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 2);

    if (tasks.length === 0) {
      toast('Please enter at least one task or goal.', 'error');
      return;
    }

    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.planDay(tasks, availableHours);
      setPlan(res.result);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast('Realistic workday schedule formulated!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to generate schedule', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!plan) return;
    const text = `📅 LazyFlow AI Daily Schedule (${plan.availableHours}h budget, ~${Math.round(plan.totalEstimatedMinutes / 60)}h planned)\n\n` +
      plan.schedule
        .map((s) => `${s.timeSlot} | ${s.task} (${s.durationMinutes}m) ${s.isBreak ? '☕ [Break]' : `[${s.priority.toUpperCase()}]`}`)
        .join('\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setIsCopied(true);
      toast('Copied daily schedule to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    try {
      await api.saveResult({
        toolType: 'plan-day',
        title: `Daily Schedule (${availableHours}h Plan) — ${new Date().toLocaleDateString()}`,
        originalInput: inputText,
        outputContent: JSON.stringify(plan),
        metadata: { availableHours, plannedMinutes: plan.totalEstimatedMinutes, meta },
      });
      setIsSaved(true);
      toast('Schedule saved to History!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save schedule', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <span>Daily Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build sustainable, burnout-free workday schedules with realistic time blocks, priority ordering, and restorative pauses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_TASKS);
              toast('Sample task list loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => {
              setInputText('');
              setPlan(null);
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
        {/* Left: Tasks Input & Time Budget */}
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Available Work Hours Budget:
              </span>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                {availableHours} Hours
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[4, 6, 8, 10].map((h) => (
                <button
                  key={h}
                  onClick={() => setAvailableHours(h)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    availableHours === h
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {h} Hours
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter tasks (one per line)..."
            rows={14}
            className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 font-sans leading-relaxed resize-none"
          />

          <button
            onClick={handlePlan}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Optimizing Time Blocks & Recovery...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Realistic Schedule</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Schedule Timeline */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Day Schedule</span>
            </span>

            {plan && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg flex items-center gap-1 text-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy</span>
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
                <p className="text-xs font-mono">Sequencing deep work and restorative pauses...</p>
              </div>
            ) : plan ? (
              <div className="space-y-4">
                {/* Stats Bar */}
                <div className="flex items-center justify-between p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    <span>Total Planned Time:</span>
                    <strong className="text-slate-200">
                      {Math.floor(plan.totalEstimatedMinutes / 60)}h {plan.totalEstimatedMinutes % 60}m
                    </strong>
                  </span>
                  <span className="text-slate-500 font-mono">
                    Max Available: {plan.availableHours}h
                  </span>
                </div>

                {/* Timeline Items */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {plan.schedule.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        item.isBreak
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.isBreak ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Coffee className="w-4 h-4 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${item.isBreak ? 'text-emerald-300' : 'text-slate-100'}`}>
                            {item.task}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {item.timeSlot} • {item.durationMinutes} mins
                          </p>
                        </div>
                      </div>

                      {!item.isBreak && (
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            item.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <Calendar className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Schedule awaiting input</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  List your tasks on the left, pick available hours, and we'll calculate realistic, sequential focus blocks with built-in breaks.
                </p>
              </div>
            )}

            {meta && plan && (
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
