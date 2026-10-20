import React from 'react';
import { useAI } from '../context/AIContext.js';
import { Cpu, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OllamaStatusBadge: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { ollamaStatus, activeModel, refreshHealth, lastLatency } = useAI();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await refreshHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div
      onClick={onOpenSettings}
      className="group cursor-pointer inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-slate-500/80 transition-all shadow-sm text-xs"
      title="Click to view AI Provider & Model Configuration"
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {ollamaStatus === 'connected' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          )}
        </span>

        {ollamaStatus === 'connected' ? (
          <span className="font-medium text-emerald-400 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Ollama Online
          </span>
        ) : (
          <span className="font-medium text-amber-300/90 flex items-center gap-1">
            <WifiOff className="w-3 h-3" /> Offline Fallback
          </span>
        )}
      </div>

      <span className="text-slate-600 dark:text-slate-500">•</span>

      <span className="text-slate-300 font-mono flex items-center gap-1 truncate max-w-[120px]">
        <Cpu className="w-3 h-3 text-indigo-400" />
        {activeModel}
      </span>

      {lastLatency !== null && (
        <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
          {lastLatency}ms
        </span>
      )}

      <button
        onClick={handleRefresh}
        className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
        title="Check Ollama connection"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
      </button>
    </div>
  );
};
