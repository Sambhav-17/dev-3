import React, { useState } from 'react';
import { copyToClipboard } from '../lib/utils.js';
import { useToast } from '../components/Toast.js';
import {
  Award,
  Sparkles,
  Heart,
  Copy,
  Check,
  Terminal,
  Code,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

export const HacktoberfestHub: React.FC<{ onLaunchApp?: () => void }> = ({ onLaunchApp }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const devPostMarkdown = `---
title: LazyFlow AI — Work Less, Live More (Hacktoberfest Open-Source AI Challenge)
published: true
tags: hacktoberfest, opensource, ai, python, webdev
cover_image: https://raw.githubusercontent.com/placeholder/lazyflow-ai/main/docs/banner.png
---

## 🚀 What I Built
**LazyFlow AI** is an open-source productivity copilot designed for Hacktoberfest Week 3 ("Slow and Steady"). It automates the tedious, repetitive digital busywork that drains daily energy:
1. **Smart Summaries** — Condense lengthy transcripts and papers into short, medium, or detailed briefings.
2. **Task Extraction** — Convert unstructured meeting notes into priority-tagged action items with explicit deadline detection.
3. **Email Assistant** — Calibrate tone (Professional, Concise, Friendly, Direct) and formulate subjects while safeguarding original intent.
4. **Note Organizer** — Cluster fragmented brainstorms into categorical headings, key points, and action items.
5. **Daily Planner** — Generate burnout-free schedules with realistic focus blocks and restorative pauses.
6. **Grocery List Assistant** — Transform recipes into organized supermarket aisles.

## 💡 The "Lazy Payoff"
The philosophy is simple: **Do the task once, automate it next time, and save your energy for things that matter.** 
Instead of rushing from one frantic task to the next, open-weight models let us build calm, predictable, sustainable workflows that work for us quietly in the background.

## 🧠 Why Open Innovation Matters
- **Local Inference:** Sensitive meeting transcripts and personal drafts never leave your device when running Ollama.
- **Zero API Tax:** No per-token subscription charges or unexpected rate limits.
- **Model Independence:** Swap effortlessly between Qwen 2.5, Llama 3.2, Mistral, or Phi-3 without rewriting application logic.
- **True Offline Capability:** Works completely disconnected from the cloud after local weights are fetched.

## 🛠 Tech Stack & Architecture
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Full-Stack / Backend:** Node 22 + Express with SQLite WAL storage, plus Python FastAPI alternative in \`/backend\`
- **AI Core:** Ollama HTTP REST API with structured JSON schemas and resilient offline semantic fallback
- **Containerization:** Docker & Docker Compose for 1-click Ollama + Web orchestration

## 💻 Repository & Getting Started
\`\`\`bash
# 1. Start Ollama and download weights
ollama run qwen2.5:7b

# 2. Clone and start LazyFlow
git clone https://github.com/placeholder/lazyflow-ai.git
cd lazyflow-ai
npm install
npm run dev
\`\`\`
`;

  const handleCopyMarkdown = async () => {
    const ok = await copyToClipboard(devPostMarkdown);
    if (ok) {
      setIsCopied(true);
      toast('Copied complete DEV.to submission markdown!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-emerald-500/15 border border-amber-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Hacktoberfest Week 3 Challenge
            </span>
            <span className="text-xs text-slate-400">Theme: “Slow and Steady”</span>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-all shadow"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy DEV.to Post Draft</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          LazyFlow AI — Open Innovation Showcase
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          Built for the open-source community to demonstrate how local, open-weight models (Qwen 2.5, Llama 3.2, Mistral) can sustainably eliminate repetitive busywork without privacy compromises or per-token fees.
        </p>

        {onLaunchApp && (
          <div className="pt-2">
            <button
              onClick={onLaunchApp}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <span>Launch Live Workspace Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4 Pillars of Open Innovation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Why Open Innovation Matters in AI</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">1. Private Local Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proprietary cloud APIs require streaming company confidential notes, draft emails, and client meetings across the internet. With Ollama running open weights on your machine, zero data leaves your localhost.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">2. Free From Per-Token Metering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once downloaded, running open-weight models consumes only local electrical and compute power. No monthly subscriptions, surprise overage bills, or artificial rate-limit walls.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">3. Freedom to Swap & Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open weights can be inspected, fine-tuned, and substituted at will. Switch from Qwen to Llama or DeepSeek in 1 click without rebuilding your application infrastructure.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">4. True Offline Capability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Airplane mode, remote retreats, or unstable Wi-Fi: your productivity assistant continues executing tasks uninterrupted because the weights live directly on disk.
            </p>
          </div>
        </div>
      </div>

      {/* The Lazy Payoff Explanation */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span>The "Slow & Steady" Lazy Payoff</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Productivity isn't about running on a frantic hamster wheel of 100 context switches per day. By automating the mechanical tasks (extracting tasks from messy transcripts, adjusting email tone, organizing brainstorms, formatting groceries), you create quiet space for focused, thoughtful execution.
        </p>
      </div>

      {/* DEV Submission Preview */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>DEV.to Submission Markdown Template</span>
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            {isCopied ? 'Copied!' : 'Copy Template'}
          </button>
        </div>
        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed select-all">
          {devPostMarkdown}
        </pre>
      </div>
    </div>
  );
};
