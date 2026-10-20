export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AIResponseMeta {
  provider: 'ollama' | 'open_fallback';
  model: string;
  latencyMs: number;
  tokensEstimated: number;
}

export interface SavedResult {
  id: string;
  userId: string;
  toolType: 'summarize' | 'extract-tasks' | 'rewrite-email' | 'organize-notes' | 'plan-day' | 'grocery-list' | 'chat';
  title: string;
  originalInput: string;
  outputContent: string;
  metadata?: any;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TaskItem {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string | null;
  completed: boolean;
  sourceResultId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserSettings {
  ollamaBaseUrl: string;
  selectedModel: string;
  defaultSummaryLength: 'short' | 'medium' | 'detailed';
  theme: 'dark' | 'light' | 'system';
}

export interface ScheduleItem {
  timeSlot: string;
  task: string;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  isBreak: boolean;
}

export interface DailyPlanResult {
  totalEstimatedMinutes: number;
  availableHours: number;
  schedule: ScheduleItem[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface GroceryCategory {
  category: string;
  items: GroceryItem[];
}

export interface EmailRewriteResult {
  subject: string;
  body: string;
  originalIntent: string;
}

export interface NoteOrganizerResult {
  title: string;
  categories: Array<{ name: string; notes: string[] }>;
  keyPoints: string[];
  actionItems: string[];
}

export interface StatsData {
  totalOperations: number;
  savedResultsCount: number;
  tasksCompleted: number;
  totalTasks: number;
  favoritesCount: number;
  estimatedTimeSavedMinutes: number;
  estimatedTimeSavedHours: string;
  toolBreakdown: Record<string, number>;
  assumptions: {
    summaryMins: number;
    taskExtractMins: number;
    emailRewriteMins: number;
    noteOrganizeMins: number;
    dailyPlanMins: number;
    groceryMins: number;
    taskCheckMins: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  meta?: AIResponseMeta;
}
