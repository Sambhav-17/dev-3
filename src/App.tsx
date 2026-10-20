import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AIProvider } from './context/AIContext.js';
import { ToastProvider } from './components/Toast.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { LandingPage } from './views/LandingPage.js';
import { DashboardOverview } from './views/DashboardOverview.js';
import { SummarizerTool } from './views/tools/SummarizerTool.js';
import { TaskExtractorTool } from './views/tools/TaskExtractorTool.js';
import { EmailAssistantTool } from './views/tools/EmailAssistantTool.js';
import { NoteOrganizerTool } from './views/tools/NoteOrganizerTool.js';
import { DailyPlannerTool } from './views/tools/DailyPlannerTool.js';
import { GroceryListTool } from './views/tools/GroceryListTool.js';
import { AIAssistantChat } from './views/tools/AIAssistantChat.js';
import { TasksBoardView } from './views/TasksBoardView.js';
import { HistoryView } from './views/HistoryView.js';
import { SettingsView } from './views/SettingsView.js';
import { HacktoberfestHub } from './views/HacktoberfestHub.js';
import { api } from './lib/api.js';

function MainApp() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Sync counts for sidebar badges
  const refreshCounts = async () => {
    try {
      const [tasksRes, histRes] = await Promise.all([api.getTasks(), api.getHistory()]);
      setTasksCount(tasksRes.tasks.filter((t) => !t.completed).length);
      setSavedCount(histRes.results.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [currentView]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLanding = currentView === 'landing';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSettings={() => setCurrentView('settings')}
      />

      <div className="flex-1 flex w-full">
        {!isLanding && (
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            tasksCount={tasksCount}
            savedCount={savedCount}
          />
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${isLanding ? 'px-0 sm:px-0 lg:px-0' : ''}`}>
          {currentView === 'landing' && (
            <LandingPage
              onEnterApp={(tool) => setCurrentView(tool || 'dashboard')}
              onOpenAuth={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardOverview onNavigate={handleNavigate} />
          )}

          {currentView === 'tool-summarize' && <SummarizerTool />}
          {currentView === 'tool-tasks' && (
            <TaskExtractorTool onNavigateToTasks={() => setCurrentView('tasks')} />
          )}
          {currentView === 'tool-email' && <EmailAssistantTool />}
          {currentView === 'tool-notes' && <NoteOrganizerTool />}
          {currentView === 'tool-planner' && <DailyPlannerTool />}
          {currentView === 'tool-grocery' && <GroceryListTool />}
          {currentView === 'tool-chat' && <AIAssistantChat />}

          {currentView === 'tasks' && (
            <TasksBoardView onNavigateToExtractor={() => setCurrentView('tool-tasks')} />
          )}

          {currentView === 'history' && <HistoryView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'hacktoberfest' && (
            <HacktoberfestHub onLaunchApp={() => setCurrentView('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AIProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AIProvider>
    </AuthProvider>
  );
}
