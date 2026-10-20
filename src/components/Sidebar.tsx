import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Mail,
  FolderKanban,
  Calendar,
  ShoppingCart,
  MessageSquare,
  Bookmark,
  ListTodo,
  Settings,
  Sparkles,
  Award,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  tasksCount?: number;
  savedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, tasksCount = 0, savedCount = 0 }) => {
  const mainNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Board', icon: ListTodo, badge: tasksCount > 0 ? tasksCount : undefined },
    { id: 'history', label: 'Saved Results', icon: Bookmark, badge: savedCount > 0 ? savedCount : undefined },
  ];

  const toolsNav = [
    { id: 'tool-summarize', label: 'Smart Summaries', icon: FileText, tag: 'Text & Notes' },
    { id: 'tool-tasks', label: 'Task Extractor', icon: CheckSquare, tag: 'Action Items' },
    { id: 'tool-email', label: 'Email Assistant', icon: Mail, tag: 'Tone & Polish' },
    { id: 'tool-notes', label: 'Note Organizer', icon: FolderKanban, tag: 'Structure' },
    { id: 'tool-planner', label: 'Daily Planner', icon: Calendar, tag: 'Schedules' },
    { id: 'tool-grocery', label: 'Grocery List', icon: ShoppingCart, tag: 'Meals to Items' },
    { id: 'tool-chat', label: 'AI Copilot Chat', icon: MessageSquare, tag: 'General' },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* Main Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Workspace
          </div>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Tools Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase flex items-center justify-between">
            <span>Automation Tools</span>
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="space-y-1">
            {toolsNav.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 hidden xl:inline shrink-0">
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="pt-4 border-t border-slate-800/80 space-y-1">
        <button
          onClick={() => onNavigate('hacktoberfest')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'hacktoberfest'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Hacktoberfest W3</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-slate-800 text-slate-100 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ollama & Settings</span>
        </button>
      </div>
    </aside>
  );
};
