import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { UserSettings } from '../types/index.js';
import { useAI } from '../context/AIContext.js';
import { useToast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import {
  Settings,
  Cpu,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Download,
  Trash2,
  HardDrive,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const COMMON_MODELS = [
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', desc: 'Balanced open-weight leader for reasoning & structured JSON' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', desc: 'Ultra fast, low memory footprint (~2GB VRAM)' },
  { id: 'llama3.1:8b', name: 'Llama 3.1 (8B)', desc: 'General-purpose instruction following' },
  { id: 'mistral:7b', name: 'Mistral (7B)', desc: 'Solid European open-source foundation' },
  { id: 'phi3:mini', name: 'Phi-3 Mini (3.8B)', desc: 'Compact high-density math and reasoning' },
];

export const SettingsView: React.FC = () => {
  const { ollamaStatus, activeModel, ollamaUrl, refreshHealth, updateSettings } = useAI();
  const [urlInput, setUrlInput] = useState(ollamaUrl);
  const [modelInput, setModelInput] = useState(activeModel);
  const [defaultLength, setDefaultLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [testResult, setTestResult] = useState<{ available: boolean; models: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setUrlInput(ollamaUrl);
    setModelInput(activeModel);
  }, [ollamaUrl, activeModel]);

  const handleTestConnection = async () => {
    setIsTestingOllama(true);
    setTestResult(null);
    try {
      const res = await api.testOllama(urlInput);
      setTestResult(res);
      if (res.available) {
        toast(`Connected! Found ${res.models.length} downloaded model(s).`, 'success');
      } else {
        toast(`Could not connect to Ollama at ${urlInput}. Verify service is running.`, 'error');
      }
    } catch {
      toast('Failed to test connection', 'error');
    } finally {
      setIsTestingOllama(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(urlInput.trim(), modelInput.trim());
      toast('Settings saved successfully!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const history = await api.getHistory({ search: '' });
      const tasks = await api.getTasks();
      const stats = await api.getStats();

      const fullBackup = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        stats,
        tasks: tasks.tasks,
        history: history.results,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', `lazyflow-full-backup-${new Date().toISOString().slice(0, 10)}.json`);
      dlAnchorElem.click();
      toast('Full SQLite workspace exported as JSON!', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const handleClearAllData = async () => {
    try {
      await api.clearAllData();
      setIsClearModalOpen(false);
      toast('All saved results and tasks have been cleared.', 'info');
      await refreshHealth();
    } catch {
      toast('Failed to clear data', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Settings & Open-Weight Configuration</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure local Ollama inference, select open-weight models, inspect privacy parameters, and manage database persistence.
        </p>
      </div>

      {/* Ollama Connection & Model Card */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Ollama Engine Endpoint</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set the host address where your local or remote Ollama server is running.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                ollamaStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {ollamaStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{ollamaStatus === 'connected' ? 'Connected' : 'Offline / Fallback'}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ollama Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingOllama}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingOllama ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standard default is <code>http://127.0.0.1:11434</code>. For Docker environments, use <code>http://ollama:11434</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Open-Weight Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {COMMON_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setModelInput(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    modelInput === m.id
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono">{m.name}</span>
                    {modelInput === m.id && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Custom model tag:</span>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="e.g. qwen2.5:14b or deepseek-r1:8b"
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Privacy and Local Inference Information */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Privacy & Inference Architecture Disclosure</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>When Running Local Ollama:</span>
            </span>
            <p className="text-slate-400">
              Your prompt content, uploaded text, meeting transcripts, and emails stay 100% on your machine. Weights execute in your local GPU/RAM. No telemetry, no logs sent to third-party proprietary API vendors.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline & Fallback Mode:</span>
            </span>
            <p className="text-slate-400">
              When Ollama is offline or uninstalled, LazyFlow switches to deterministic local semantic parsing. It operates without internet connection once downloaded.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & SQLite Persistence */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Database & Backup</span>
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          All your saved results, task board items, and configurations are stored in an embedded SQLite database (<code>./data/lazyflow.db</code>) with Write-Ahead Logging (WAL) enabled.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Complete Backup (JSON)</span>
          </button>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Workspace History</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsClearModalOpen(false)}
          title="Clear All Workspace Data"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Are you sure you want to delete all saved items and tasks?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This will wipe all records in your SQLite database for this user. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
