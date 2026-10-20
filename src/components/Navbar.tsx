import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { OllamaStatusBadge } from './OllamaStatusBadge.js';
import { AuthModal } from './AuthModal.js';
import { Sparkles, Terminal, LogOut, User, Menu, X, ArrowRight, Github, Heart } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenSettings }) => {
  const { user, isGuest, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = currentView === 'landing';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-950/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-base sm:text-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                LazyFlow <span className="text-emerald-400 font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 ml-1">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:inline">
                Work Less, Live More
              </span>
            </div>
          </div>

          {/* Center Links (Landing Mode) or Status (App Mode) */}
          <div className="hidden md:flex items-center gap-6">
            {isLanding ? (
              <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
                <button
                  onClick={() => {
                    const el = document.getElementById('features-section');
                    el ? el.scrollIntoView({ behavior: 'smooth' }) : onNavigate('landing');
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('how-it-works-section');
                    el ? el.scrollIntoView({ behavior: 'smooth' }) : onNavigate('landing');
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('open-ai-section');
                    el ? el.scrollIntoView({ behavior: 'smooth' }) : onNavigate('landing');
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Open Innovation
                </button>
                <button
                  onClick={() => onNavigate('hacktoberfest')}
                  className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Hacktoberfest
                </button>
              </nav>
            ) : (
              <OllamaStatusBadge onOpenSettings={onOpenSettings} />
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {!isLanding && (
              <button
                onClick={() => onNavigate('hacktoberfest')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors"
              >
                <span>Hacktoberfest W3</span>
              </button>
            )}

            {isLanding ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/40"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isGuest ? (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Guest (Sync Account)</span>
                    <span className="sm:hidden">Guest</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50 hidden sm:inline-block">
                      {user?.name || user?.email}
                    </span>
                    <button
                      onClick={logout}
                      title="Log Out"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0b0f19] px-4 py-3 space-y-2">
            <div className="py-2">
              <OllamaStatusBadge onOpenSettings={onOpenSettings} />
            </div>
            <button
              onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-medium text-slate-200"
            >
              Workspace Dashboard
            </button>
            <button
              onClick={() => { onNavigate('hacktoberfest'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-medium text-amber-300"
            >
              Hacktoberfest DEV Showcase
            </button>
            <button
              onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-medium text-slate-400"
            >
              AI & Ollama Settings
            </button>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
