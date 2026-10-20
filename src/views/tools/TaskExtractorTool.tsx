import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { TaskItem } from '../../types/index.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Sparkles,
  BookOpen,
  Trash2,
  Save,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  ArrowRight,
} from 'lucide-react';

const SAMPLE_MEETING = `Product Team Sync Notes:
1. Urgent: Deploy hotfix for OAuth callback bug before 4 PM today.
2. Maya to finalize Hacktoberfest dev post draft by Thursday.
3. Liam: Optimize Docker compose bundle and verify Ollama Qwen2.5 weights.
4. Prepare slide deck for community demo next Monday.
5. Review Drizzle and SQLite migration logs (nice to have, whenever free).`;

export const TaskExtractorTool: React.FC<{ onNavigateToTasks?: () => void }> = ({ onNavigateToTasks }) => {
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handleExtract = async () => {
    if (!inputText.trim()) {
      toast('Please enter notes or a transcript to extract tasks from.', 'error');
      return;
    }
    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.extractTasks(inputText);
      setTasks(res.tasks);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast(`Extracted ${res.tasks.length} actionable tasks!`, 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to extract tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextState = !t.completed;
          if (nextState) {
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const handleUpdateTitle = (taskId: string, newTitle: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast('Task removed.', 'info');
  };

  const handleAddNewTask = () => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: 'New action item',
      priority: 'medium',
      deadline: null,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleSaveToTaskBoard = async () => {
    if (tasks.length === 0) return;
    try {
      // 1. Save to Task Board (persistent tasks table)
      await api.saveTasks(tasks);
      // 2. Also save result snapshot in history
      await api.saveResult({
        toolType: 'extract-tasks',
        title: `Task List (${tasks.length} items) — ${inputText.slice(0, 25)}...`,
        originalInput: inputText,
        outputContent: JSON.stringify(tasks),
        metadata: { taskCount: tasks.length, meta },
      });
      setIsSaved(true);
      toast('Tasks saved to your persistent Task Board & History!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save tasks', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Task Extractor</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Turn messy meeting transcripts, slack threads, and scattered notes into structured, high-priority deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_MEETING);
              toast('Sample notes loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => {
              setInputText('');
              setTasks([]);
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
        {/* Left: Input Text */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-medium text-slate-400">Input Source</span>
            <span className="text-xs text-slate-500">
              {inputText.length} characters
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your meeting notes, project brief, or unstructured thoughts..."
            rows={15}
            className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 font-sans leading-relaxed resize-none"
          />

          <button
            onClick={handleExtract}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Extracting Action Items...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract Tasks</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Extracted Structured Tasks */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Action Items ({tasks.length})
              </span>
              {tasks.length > 0 && (
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {tasks.filter((t) => t.completed).length}/{tasks.length} done
                </span>
              )}
            </div>

            {tasks.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewTask}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                  title="Add custom item"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Add</span>
                </button>
                <button
                  onClick={handleSaveToTaskBoard}
                  disabled={isSaved}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved to Board' : 'Save to Board'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[380px] p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono">Isolating tasks & priority signals...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 group ${
                      task.completed
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTitle(task.id, e.target.value)}
                        className={`w-full bg-transparent text-sm focus:outline-none focus:bg-slate-950/60 rounded px-1.5 py-0.5 ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-100 font-medium'
                        }`}
                      />

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
                        {/* Priority badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                              : task.priority === 'low'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Deadline badge */}
                        {task.deadline && (
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5 text-indigo-400" />
                            {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <CheckSquare className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">No tasks extracted yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Paste notes on the left. LazyFlow will isolate action items with priority tags without hallucinating dates.
                </p>
              </div>
            )}

            {tasks.length > 0 && isSaved && onNavigateToTasks && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved to Persistent Board
                </span>
                <button
                  onClick={onNavigateToTasks}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <span>Open Task Board</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
