import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  CheckSquare,
  Mail,
  FolderKanban,
  Calendar,
  ShoppingCart,
  ShieldCheck,
  Zap,
  HardDrive,
  Cpu,
  CheckCircle,
  Copy,
  Terminal,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: (tool?: string) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenAuth }) => {
  // Interactive live preview toggle in hero
  const [heroTab, setHeroTab] = useState<'summary' | 'tasks'>('summary');

  const features = [
    {
      id: 'tool-summarize',
      title: 'Smart Summaries',
      desc: 'Condense dense articles, long meeting transcripts, and research papers into short, medium, or executive briefings.',
      icon: FileText,
      pill: 'Save ~12 mins / run',
      accent: 'text-emerald-400',
    },
    {
      id: 'tool-tasks',
      title: 'Task Extractor',
      desc: 'Isolate distinct action items, assign high/medium/low priority levels, and detect explicit deadlines from chaotic chats.',
      icon: CheckSquare,
      pill: 'Save ~15 mins / run',
      accent: 'text-indigo-400',
    },
    {
      id: 'tool-email',
      title: 'Email Rewriter',
      desc: 'Refine hasty, emotional, or verbose drafts into calibrated professional, concise, or friendly communications.',
      icon: Mail,
      pill: 'Save ~10 mins / run',
      accent: 'text-purple-400',
    },
    {
      id: 'tool-notes',
      title: 'Note Organizer',
      desc: 'Cluster raw stream-of-consciousness brainstorms into categorical headings, key takeaways, and next steps.',
      icon: FolderKanban,
      pill: 'Save ~18 mins / run',
      accent: 'text-cyan-400',
    },
    {
      id: 'tool-planner',
      title: 'Daily Planner',
      desc: 'Formulate realistic workday schedules with focus time blocks and built-in restorative pauses to guard against burnout.',
      icon: Calendar,
      pill: 'Save ~20 mins / run',
      accent: 'text-amber-400',
    },
    {
      id: 'tool-grocery',
      title: 'Grocery List Assistant',
      desc: 'Transform plain-text recipes or weekly meal ideas into categorized supermarket aisles with checkable items.',
      icon: ShoppingCart,
      pill: 'Save ~8 mins / run',
      accent: 'text-pink-400',
    },
  ];

  return (
    <div className="space-y-24 py-6 sm:py-12 overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-emerald-500/10 to-purple-600/15 blur-3xl rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Hacktoberfest Open-Source AI Challenge</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">Week 3: Slow and Steady</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-[1.1]">
          Your Busywork. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Handled.</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Let open-source AI handle the repetitive tasks, messy notes, and little jobs that steal your time. You stay in control. Your day gets easier.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onEnterApp()}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-2xl text-sm sm:text-base transition-all shadow-xl shadow-emerald-950/40 flex items-center gap-2 group cursor-pointer"
          >
            <span>Start Automating</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('features-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-2xl text-sm sm:text-base transition-all border border-slate-700/80 shadow-md"
          >
            Explore Features
          </button>
        </div>

        {/* Interactive Live Hero Product Preview */}
        <div className="max-w-4xl mx-auto mt-12 p-3 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-md text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">LazyFlow Workspace Preview</span>
            </div>

            <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
              <button
                onClick={() => setHeroTab('summary')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  heroTab === 'summary' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Synthesized Summary
              </button>
              <button
                onClick={() => setHeroTab('tasks')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  heroTab === 'tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Extracted Tasks
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Input mock */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Original Input (Unstructured Transcript)
              </div>
              <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                "Met with architecture team regarding Hacktoberfest launch. We identified a bottleneck in token pricing for proprietary models. Liam suggested running Ollama locally with Qwen 2.5 for zero fees. Maya needs to finalize the DEV post by Thursday. Urgent: check SQLite WAL mode before 5 PM."
              </p>
            </div>

            {/* Output mock */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                <span>LazyFlow AI Output</span>
                <span className="text-slate-500">Latency: 42ms</span>
              </div>

              {heroTab === 'summary' ? (
                <div className="space-y-1.5 text-slate-200 leading-relaxed">
                  <p className="font-semibold text-emerald-300">• Architecture consensus:</p>
                  <p className="text-slate-300">
                    Switching to local Ollama with Qwen 2.5 eliminates recurring token charges and ensures private inference.
                  </p>
                  <p className="font-semibold text-emerald-300 mt-2">• Key milestones:</p>
                  <p className="text-slate-300">
                    DEV submission post targeted for Thursday; database WAL verification scheduled for today.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200">Verify SQLite WAL mode integrity</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase font-semibold">
                      Urgent (5 PM)
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200">Finalize Hacktoberfest DEV post</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-semibold">
                      Due Thursday
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200">Benchmark Ollama Qwen 2.5 local inference</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                      Normal
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Automate Once. Save Time Forever.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Six purpose-built open-weight tools engineered for real digital busywork. Click any feature to launch directly into the live workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => onEnterApp(feat.id)}
                className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className={`w-6 h-6 ${feat.accent}`} />
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      {feat.pill}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-emerald-300">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Zero complicated prompt engineering. A calm 4-step loop designed for speed and control.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Choose a Task', desc: 'Pick from summaries, task lists, email rewrites, daily planning, or groceries.' },
            { step: '02', title: 'Paste Input', desc: 'Paste rough notes, messy transcripts, bullet points, or ingredient lists.' },
            { step: '03', title: 'Open-Weight Inference', desc: 'Your configured local model (Qwen, Llama, Mistral) structures the output.' },
            { step: '04', title: 'Review, Edit & Save', desc: 'Review, tweak directly in-place, copy with one click, or persist to SQLite.' },
          ].map((s, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3 relative">
              <div className="text-2xl font-black font-mono text-emerald-400/40">
                {s.step}
              </div>
              <h3 className="text-base font-bold text-slate-200">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Innovation Section */}
      <section id="open-ai-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              Hacktoberfest Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
              Why Open-Weight AI Matters
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We believe everyday productivity software should not require surrendering your personal notes, meeting records, and thoughts to proprietary clouds with metering fees and black-box changes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Local Confidentiality</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run models on your own machine via Ollama. No transmission of sensitive notes to outside servers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Zero Subscription Metering</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No monthly per-user licenses or per-token fees. The model is yours to run as many times as you want.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Works Completely Offline</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once weights are downloaded to your disk, you can synthesize documents and organize tasks with no internet connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-400">LazyFlow AI</span>
          <span>— Open-source productivity for Hacktoberfest Week 3.</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="hover:text-slate-300 transition-colors">Privacy First</span>
          <span className="hover:text-slate-300 transition-colors">Apache-2.0 License</span>
          <span className="hover:text-slate-300 transition-colors">SQLite Storage</span>
        </div>
      </footer>
    </div>
  );
};
