import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

interface AIContextType {
  ollamaStatus: 'connected' | 'offline' | 'checking';
  availableModels: string[];
  activeModel: string;
  ollamaUrl: string;
  lastLatency: number | null;
  refreshHealth: () => Promise<void>;
  updateSettings: (newUrl: string, newModel: string) => Promise<void>;
  reportLatency: (ms: number) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>('qwen2.5:7b');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://127.0.0.1:11434');
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await api.checkHealth();
      setOllamaStatus(data.ollama.connected ? 'connected' : 'offline');
      setAvailableModels(data.ollama.availableModels || []);
      if (data.activeModel) setActiveModel(data.activeModel);
      if (data.ollama.url) setOllamaUrl(data.ollama.url);
    } catch {
      setOllamaStatus('offline');
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 25000); // Check every 25s
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const updateSettings = async (newUrl: string, newModel: string) => {
    await api.saveSettings({
      ollamaBaseUrl: newUrl,
      selectedModel: newModel,
    });
    setOllamaUrl(newUrl);
    setActiveModel(newModel);
    await refreshHealth();
  };

  const reportLatency = (ms: number) => {
    setLastLatency(ms);
  };

  return (
    <AIContext.Provider
      value={{
        ollamaStatus,
        availableModels,
        activeModel,
        ollamaUrl,
        lastLatency,
        refreshHealth,
        updateSettings,
        reportLatency,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export function useAI() {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
}
