import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { SavedResult } from '../types/index.js';
import { formatDate, copyToClipboard } from '../lib/utils.js';
import { useToast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import {
  Bookmark,
  Search,
  Star,
  Trash2,
  Edit3,
  Copy,
  Download,
  ExternalLink,
  Filter,
  FileText,
  CheckSquare,
  Mail,
  FolderKanban,
  Calendar,
  ShoppingCart,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface HistoryViewProps {
  onOpenInTool?: (toolType: string, input: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenInTool }) => {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal inspection / editing state
  const [activeItem, setActiveItem] = useState<SavedResult | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<SavedResult | null>(null);

  const { toast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getHistory({
        tool: selectedTool,
        search,
        favoriteOnly,
      });
      setResults(res.results);
    } catch {
      toast('Failed to load history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchHistory, 150);
    return () => clearTimeout(timer);
  }, [selectedTool, search, favoriteOnly]);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleFavorite(id);
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: res.isFavorite } : r)));
      if (activeItem && activeItem.id === id) {
        setActiveItem({ ...activeItem, isFavorite: res.isFavorite });
      }
      toast(res.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'info');
    } catch {
      toast('Failed to update favorite', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteResult(itemToDelete.id);
      setResults((prev) => prev.filter((r) => r.id !== itemToDelete.id));
      if (activeItem?.id === itemToDelete.id) setActiveItem(null);
      setItemToDelete(null);
      toast('Result deleted permanently.', 'info');
    } catch {
      toast('Failed to delete result', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!activeItem) return;
    try {
      await api.updateResult(activeItem.id, {
        title: editTitle,
        outputContent: editContent,
      });
      setResults((prev) =>
        prev.map((r) => (r.id === activeItem.id ? { ...r, title: editTitle, outputContent: editContent } : r))
      );
      setActiveItem({ ...activeItem, title: editTitle, outputContent: editContent });
      setIsEditMode(false);
      toast('Changes saved successfully!', 'success');
    } catch {
      toast('Failed to save updates', 'error');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `lazyflow-history-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    toast('History exported as JSON!', 'success');
  };

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'summarize':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'extract-tasks':
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'rewrite-email':
        return <Mail className="w-4 h-4 text-purple-400" />;
      case 'organize-notes':
        return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case 'plan-day':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'grocery-list':
        return <ShoppingCart className="w-4 h-4 text-pink-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-teal-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-emerald-400" />
            <span>Saved Results & History</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, edit, and reopen past AI outputs saved in your local SQLite store.
          </p>
        </div>

        {results.length > 0 && (
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Data (JSON)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved summaries, tasks, emails..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Tools</option>
            <option value="summarize">Summaries</option>
            <option value="extract-tasks">Task Lists</option>
            <option value="rewrite-email">Emails</option>
            <option value="organize-notes">Notes</option>
            <option value="plan-day">Daily Plans</option>
            <option value="grocery-list">Grocery Lists</option>
          </select>

          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              favoriteOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Results Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs font-mono">
            Searching history database...
          </div>
        ) : results.length > 0 ? (
          results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveItem(item);
                setEditTitle(item.title);
                setEditContent(item.outputContent);
                setIsEditMode(false);
              }}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {getToolIcon(item.toolType)}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {item.toolType.replace('-', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(item.id, e)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                    />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mt-2 font-sans leading-relaxed">
                  {item.outputContent}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>{formatDate(item.createdAt)}</span>
                <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  View & Edit →
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 space-y-2">
            <Bookmark className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm font-medium text-slate-400">No saved results found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any outputs you save from the Summarizer, Task Extractor, Email Assistant, or other tools will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {activeItem && (
        <Modal
          isOpen={true}
          onClose={() => setActiveItem(null)}
          title={isEditMode ? 'Edit Saved Result' : activeItem.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-mono">
                {getToolIcon(activeItem.toolType)}
                {activeItem.toolType} • Created {formatDate(activeItem.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-indigo-400" />
                  <span>{isEditMode ? 'Cancel Edit' : 'Edit'}</span>
                </button>

                <button
                  onClick={async () => {
                    await copyToClipboard(activeItem.outputContent);
                    toast('Content copied to clipboard!', 'success');
                  }}
                  className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1"
                >
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => setItemToDelete(activeItem)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete result"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl max-h-[380px] overflow-y-auto">
                  <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed select-all">
                    {activeItem.outputContent}
                  </pre>
                </div>

                {activeItem.originalInput && (
                  <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs">
                    <span className="font-semibold text-slate-400 block mb-1">Original Input Source:</span>
                    <p className="text-slate-500 line-clamp-3 font-mono text-[11px]">
                      {activeItem.originalInput}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          title="Confirm Permanent Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Are you sure you want to delete this result?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                "{itemToDelete.title}" will be permanently removed from your SQLite database.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
