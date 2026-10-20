import {
  SavedResult,
  TaskItem,
  UserSettings,
  StatsData,
  AIResponseMeta,
  EmailRewriteResult,
  NoteOrganizerResult,
  DailyPlanResult,
  GroceryCategory,
} from '../types/index.js';

const API_BASE = '/api';

// Retrieve token or guest ID
export function getStoredToken(): string | null {
  return localStorage.getItem('lazyflow_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('lazyflow_token', token);
  } else {
    localStorage.removeItem('lazyflow_token');
  }
}

export function getGuestId(): string {
  let guestId = localStorage.getItem('lazyflow_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('lazyflow_guest_id', guestId);
  }
  return guestId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const guestId = getGuestId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-id': guestId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = isJson && data.error ? data.error : response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Health
  checkHealth: () => request<any>('/health'),

  // Auth
  register: (payload: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request<{ isGuest: boolean; user: any }>('/auth/me'),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  // Settings
  getSettings: () => request<UserSettings>('/settings'),
  saveSettings: (settings: Partial<UserSettings>) =>
    request<{ success: boolean }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
  testOllama: (url: string) => request<{ available: boolean; models: string[] }>(`/settings/test-ollama?url=${encodeURIComponent(url)}`),

  // AI Workspace Operations
  summarize: (text: string, length: 'short' | 'medium' | 'detailed', style: 'bullets' | 'paragraph' | 'executive') =>
    request<{ summary: string; meta: AIResponseMeta }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, length, style }),
    }),

  extractTasks: (text: string) =>
    request<{ tasks: TaskItem[]; meta: AIResponseMeta }>('/ai/extract-tasks', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  rewriteEmail: (text: string, tone: 'professional' | 'concise' | 'friendly' | 'formal' | 'direct') =>
    request<{ result: EmailRewriteResult; meta: AIResponseMeta }>('/ai/rewrite-email', {
      method: 'POST',
      body: JSON.stringify({ text, tone }),
    }),

  organizeNotes: (text: string) =>
    request<{ result: NoteOrganizerResult; meta: AIResponseMeta }>('/ai/organize-notes', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  planDay: (tasks: string[], availableHours: number) =>
    request<{ result: DailyPlanResult; meta: AIResponseMeta }>('/ai/plan-day', {
      method: 'POST',
      body: JSON.stringify({ tasks, availableHours }),
    }),

  generateGroceryList: (text: string) =>
    request<{ result: { categories: GroceryCategory[] }; meta: AIResponseMeta }>('/ai/grocery-list', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  chat: (message: string, history: Array<{ role: string; content: string }>) =>
    request<{ response: string; meta: AIResponseMeta }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // History CRUD
  getHistory: (params?: { tool?: string; search?: string; favoriteOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.tool && params.tool !== 'all') query.set('tool', params.tool);
    if (params?.search) query.set('search', params.search);
    if (params?.favoriteOnly) query.set('favoriteOnly', 'true');
    const qStr = query.toString();
    return request<{ results: SavedResult[] }>(`/history${qStr ? `?${qStr}` : ''}`);
  },

  saveResult: (result: {
    toolType: string;
    title: string;
    originalInput: string;
    outputContent: string;
    metadata?: any;
  }) =>
    request<SavedResult>('/history', {
      method: 'POST',
      body: JSON.stringify(result),
    }),

  updateResult: (id: string, updates: { title?: string; outputContent?: string }) =>
    request<{ success: boolean; updatedAt: number }>(`/history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteResult: (id: string) =>
    request<{ success: boolean }>(`/history/${id}`, {
      method: 'DELETE',
    }),

  toggleFavorite: (id: string) =>
    request<{ id: string; isFavorite: boolean }>(`/history/${id}/favorite`, {
      method: 'POST',
    }),

  clearAllData: () =>
    request<{ success: boolean; message: string }>('/history/clear-all', {
      method: 'POST',
    }),

  // Tasks CRUD
  getTasks: () => request<{ tasks: TaskItem[] }>('/tasks'),
  saveTasks: (tasks: Partial<TaskItem>[]) =>
    request<{ createdCount: number; tasks: TaskItem[] }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),
  toggleTask: (id: string, completed: boolean) =>
    request<{ success: boolean; id: string; completed: boolean }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  updateTask: (id: string, updates: Partial<TaskItem>) =>
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Stats
  getStats: () => request<StatsData>('/stats'),
};
