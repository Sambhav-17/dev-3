import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { GroceryCategory, GroceryItem } from '../../types/index.js';
import { copyToClipboard } from '../../lib/utils.js';
import { useToast } from '../../components/Toast.js';
import { useAI } from '../../context/AIContext.js';
import {
  ShoppingCart,
  Sparkles,
  BookOpen,
  Trash2,
  Save,
  Copy,
  Check,
  Plus,
  ShoppingBag,
  Layers,
} from 'lucide-react';

const SAMPLE_RECIPES = `Mediterranean Lemon Garlic Chicken:
- 2 lbs chicken breasts
- 4 cloves garlic
- 2 lemons
- 1/2 cup olive oil
- 1 tsp dried oregano
- 200g feta cheese
- 1 cucumber and fresh cherry tomatoes for Greek salad`;

export const GroceryListTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const { toast } = useToast();
  const { reportLatency } = useAI();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast('Please enter ingredients or a recipe.', 'error');
      return;
    }
    setIsLoading(true);
    setIsSaved(false);
    try {
      const res = await api.generateGroceryList(inputText);
      setCategories(res.result.categories);
      setMeta(res.meta);
      if (res.meta?.latencyMs) reportLatency(res.meta.latencyMs);
      toast('Grocery list organized into aisles!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to generate grocery list', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheck = (catIndex: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, cIdx) => {
        if (cIdx !== catIndex) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
        };
      })
    );
  };

  const deleteItem = (catIndex: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, cIdx) => {
        if (cIdx !== catIndex) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const addItemToCategory = (catIndex: number) => {
    const newItem: GroceryItem = {
      id: `item-${Date.now()}`,
      name: 'New grocery item',
      quantity: '1',
      checked: false,
    };
    setCategories((prev) =>
      prev.map((cat, cIdx) => {
        if (cIdx !== catIndex) return cat;
        return { ...cat, items: [...cat.items, newItem] };
      })
    );
  };

  const handleCopy = async () => {
    if (categories.length === 0) return;
    const text = categories
      .map(
        (c) =>
          `🛒 ${c.category}\n` +
          c.items.map((i) => `  ${i.checked ? '[x]' : '[ ]'} ${i.quantity} ${i.name}`).join('\n')
      )
      .join('\n\n');

    const ok = await copyToClipboard(text);
    if (ok) {
      setIsCopied(true);
      toast('Grocery list copied!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (categories.length === 0) return;
    try {
      await api.saveResult({
        toolType: 'grocery-list',
        title: `Grocery List (${categories.reduce((acc, c) => acc + c.items.length, 0)} items) — ${new Date().toLocaleDateString()}`,
        originalInput: inputText,
        outputContent: JSON.stringify(categories),
        metadata: { categoryCount: categories.length, meta },
      });
      setIsSaved(true);
      toast('Grocery list saved to History!', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to save grocery list', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            <span>Grocery List Assistant</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Turn recipes, ingredients, and weekly dinner ideas into clean, store-aisle categorized shopping checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInputText(SAMPLE_RECIPES);
              toast('Sample recipe ingredients loaded.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => {
              setInputText('');
              setCategories([]);
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
            <span className="text-xs font-medium text-slate-400">Meal Plan or Ingredients</span>
            <span className="text-xs text-slate-500">{inputText.length} chars</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste recipe, ingredient list, or meal description (e.g. tacos, greek salad, pasta bake)..."
            rows={15}
            className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 font-sans leading-relaxed resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Sorting into Grocery Aisles...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Build Categorized List</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Categorized Shopping List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aisle Checklist</span>
            </span>

            {categories.length > 0 && (
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
                <p className="text-xs font-mono">Parsing quantities & grouping by grocery section...</p>
              </div>
            ) : categories.length > 0 ? (
              <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                {categories.map((cat, catIdx) => (
                  <div key={catIdx} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-indigo-400" />
                        {cat.category} ({cat.items.length})
                      </span>
                      <button
                        onClick={() => addItemToCategory(catIdx)}
                        className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-lg group ${
                            item.checked ? 'opacity-50 line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleCheck(catIdx, item.id)}
                              className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
                            />
                            <span className="text-xs font-mono text-emerald-400/90 shrink-0">
                              {item.quantity}
                            </span>
                            <span className="text-xs truncate">{item.name}</span>
                          </div>

                          <button
                            onClick={() => deleteItem(catIdx, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                <ShoppingCart className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">List empty</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Type meals or ingredients on the left. LazyFlow will categorize items into Produce, Dairy, Protein, and Pantry.
                </p>
              </div>
            )}

            {meta && categories.length > 0 && (
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
