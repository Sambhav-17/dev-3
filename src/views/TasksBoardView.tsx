import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { TaskItem } from '../types/index.js';
import { useToast } from '../components/Toast.js';
import confetti from 'canvas-confetti';
import {
  ListTodo,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Filter,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const TasksBoardView: React.FC<{ onNavigateToExtractor?: () => void }> = ({ onNavigateToExtractor }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks);
    } catch {
      toast('Failed to load tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextStatus } : t)));

    if (nextStatus) {
      confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
    }

    try {
      await api.toggleTask(id, nextStatus);
    } catch {
      toast('Failed to update task status', 'error');
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
      toast('Task deleted.', 'info');
    } catch {
      toast('Failed to delete task', 'error');
      fetchTasks();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.saveTasks([
        {
          title: newTitle.trim(),
          priority: newPriority,
          deadline: newDeadline.trim() || null,
          completed: false,
        },
      ]);
      setNewTitle('');
      setNewDeadline('');
      toast('Task added to your board!', 'success');
      fetchTasks();
    } catch {
      toast('Failed to create task', 'error');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-emerald-400" />
            <span>Task Board</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track and complete deliverables extracted by open-weight AI or added manually.
          </p>
        </div>

        {onNavigateToExtractor && (
          <button
            onClick={onNavigateToExtractor}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-950/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extract from Notes</span>
          </button>
        )}
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleCreate} className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new action item..."
          className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <input
            type="text"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            placeholder="Deadline (optional)"
            className="w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab} {tab === 'all' ? `(${tasks.length})` : tab === 'completed' ? `(${completedCount})` : `(${tasks.length - completedCount})`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Completion rate:</span>
          <span className="font-bold text-emerald-400 font-mono">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-mono">
            Loading tasks from persistent database...
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                t.completed
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => handleToggle(t.id, t.completed)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    t.priority === 'high'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                      : t.priority === 'low'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                  }`}
                >
                  {t.priority}
                </span>

                {t.deadline && (
                  <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    {t.deadline}
                  </span>
                )}

                <button
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1.5"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm font-medium text-slate-400">No tasks in this view</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add a new task above or paste meeting notes into the Task Extractor to automate action items.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
