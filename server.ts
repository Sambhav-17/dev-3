import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from './server/db.js';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, deleteSessionToken } from './server/auth.js';
import { checkOllamaHealth, executeAIRequest, AIServiceConfig } from './server/aiService.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to extract session / guest user ID
function getAuthContext(req: Request): { userId: string; isGuest: boolean; user?: any } {
  const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

  if (token) {
    const session = verifySessionToken(token);
    if (session) {
      return { userId: session.userId, isGuest: false, user: session };
    }
  }

  // Fallback to guest ID sent in headers or default guest
  const guestId = (req.headers['x-guest-id'] as string) || 'guest_default';
  return { userId: `guest_${guestId}`, isGuest: true };
}

// Get user settings from DB or default
function getUserAISettings(userId: string): AIServiceConfig {
  try {
    const row = db.prepare('SELECT ollama_base_url, selected_model FROM user_settings WHERE user_id = ?').get(userId) as any;
    return {
      ollamaBaseUrl: row?.ollama_base_url || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: row?.selected_model || process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    };
  } catch {
    return {
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    };
  }
}

/* -------------------------------------------------------------
 * API ENDPOINTS
 * ----------------------------------------------------------- */

// 1. Health & Status
app.get('/api/health', async (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);
  const ollama = await checkOllamaHealth(config.ollamaBaseUrl);

  res.json({
    status: 'ok',
    version: '1.0.0',
    app: 'LazyFlow AI — Work Less, Live More',
    database: 'sqlite-connected',
    activeModel: config.model,
    ollama: {
      url: config.ollamaBaseUrl,
      connected: ollama.available,
      availableModels: ollama.models,
    },
    inferenceMode: ollama.available ? 'local-ollama' : 'semantic-fallback',
  });
});

// 2. Auth Endpoints
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const id = `user_${crypto.randomUUID()}`;
  const passwordHash = hashPassword(password);
  const now = Date.now();

  db.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    email.toLowerCase(),
    name.trim(),
    passwordHash,
    now
  );

  // Initialize default user settings
  db.prepare('INSERT OR IGNORE INTO user_settings (user_id, updated_at) VALUES (?, ?)').run(id, now);

  const token = createSessionToken({ id, email: email.toLowerCase(), name: name.trim() });
  res.json({
    token,
    user: { id, email: email.toLowerCase(), name: name.trim() },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createSessionToken({ id: user.id, email: user.email, name: user.name });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const auth = getAuthContext(req);
  if (auth.isGuest) {
    return res.json({
      isGuest: true,
      user: { id: auth.userId, name: 'Guest Developer', email: 'guest@lazyflow.local' },
    });
  }
  res.json({
    isGuest: false,
    user: auth.user,
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;
  if (token) {
    deleteSessionToken(token);
  }
  res.json({ success: true });
});

// 3. User Settings Endpoints
app.get('/api/settings', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
  if (!row) {
    return res.json({
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      selectedModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      defaultSummaryLength: 'medium',
      theme: 'dark',
    });
  }
  res.json({
    ollamaBaseUrl: row.ollama_base_url,
    selectedModel: row.selected_model,
    defaultSummaryLength: row.default_summary_length,
    theme: row.theme,
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { ollamaBaseUrl, selectedModel, defaultSummaryLength, theme } = req.body;
  const now = Date.now();

  db.prepare(`
    INSERT INTO user_settings (user_id, ollama_base_url, selected_model, default_summary_length, theme, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      ollama_base_url = excluded.ollama_base_url,
      selected_model = excluded.selected_model,
      default_summary_length = excluded.default_summary_length,
      theme = excluded.theme,
      updated_at = excluded.updated_at
  `).run(
    userId,
    ollamaBaseUrl || 'http://127.0.0.1:11434',
    selectedModel || 'qwen2.5:7b',
    defaultSummaryLength || 'medium',
    theme || 'dark',
    now
  );

  res.json({ success: true, message: 'Settings saved successfully' });
});

app.get('/api/settings/test-ollama', async (req: Request, res: Response) => {
  const url = (req.query.url as string) || 'http://127.0.0.1:11434';
  const result = await checkOllamaHealth(url);
  res.json(result);
});

// 4. AI Workspace Execution Endpoints
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  const { text, length, style } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required for summarization' });
  }
  if (text.length > 100000) {
    return res.status(400).json({ error: 'Text exceeds maximum limit of 100,000 characters' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<string>('summarize', { text, length, style }, config);
    res.json({
      summary: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Summarization failed' });
  }
});

app.post('/api/ai/extract-tasks', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required for task extraction' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<any[]>('extract-tasks', { text }, config);
    res.json({
      tasks: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Task extraction failed' });
  }
});

app.post('/api/ai/rewrite-email', async (req: Request, res: Response) => {
  const { text, tone } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Original message text is required' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<any>('rewrite-email', { text, tone }, config);
    res.json({
      result: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Email rewrite failed' });
  }
});

app.post('/api/ai/organize-notes', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Notes text is required' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<any>('organize-notes', { text }, config);
    res.json({
      result: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Note organization failed' });
  }
});

app.post('/api/ai/plan-day', async (req: Request, res: Response) => {
  const { tasks, availableHours } = req.body;
  if (!tasks || (Array.isArray(tasks) && tasks.length === 0)) {
    return res.status(400).json({ error: 'List of tasks is required for planning' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<any>('plan-day', { tasks, availableHours: Number(availableHours) || 8 }, config);
    res.json({
      result: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Daily planning failed' });
  }
});

app.post('/api/ai/grocery-list', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Ingredients or meal description required' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<any>('grocery-list', { text }, config);
    res.json({
      result: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Grocery list generation failed' });
  }
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const { userId } = getAuthContext(req);
  const config = getUserAISettings(userId);

  try {
    const result = await executeAIRequest<string>('chat', { message, history }, config);
    res.json({
      response: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Chat generation failed' });
  }
});

// 5. Saved History CRUD
app.get('/api/history', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { tool, search, favoriteOnly } = req.query;

  let query = 'SELECT * FROM saved_results WHERE user_id = ?';
  const params: any[] = [userId];

  if (tool && tool !== 'all') {
    query += ' AND tool_type = ?';
    params.push(tool);
  }

  if (favoriteOnly === 'true') {
    query += ' AND is_favorite = 1';
  }

  if (search && typeof search === 'string' && search.trim()) {
    query += ' AND (title LIKE ? OR output_content LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const rows = db.prepare(query).all(...params) as any[];
  const formatted = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    toolType: r.tool_type,
    title: r.title,
    originalInput: r.original_input,
    outputContent: r.output_content,
    metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    isFavorite: Boolean(r.is_favorite),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  res.json({ results: formatted });
});

app.post('/api/history', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { toolType, title, originalInput, outputContent, metadata } = req.body;

  if (!toolType || !outputContent) {
    return res.status(400).json({ error: 'Tool type and output content are required' });
  }

  const id = `res_${crypto.randomUUID()}`;
  const now = Date.now();
  const titleFinal = title?.trim() || `${toolType.toUpperCase()} Result — ${new Date().toLocaleDateString()}`;

  db.prepare(`
    INSERT INTO saved_results (id, user_id, tool_type, title, original_input, output_content, metadata_json, is_favorite, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    userId,
    toolType,
    titleFinal,
    originalInput || '',
    outputContent,
    metadata ? JSON.stringify(metadata) : null,
    now,
    now
  );

  res.json({
    id,
    title: titleFinal,
    toolType,
    createdAt: now,
  });
});

app.put('/api/history/:id', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { id } = req.params;
  const { title, outputContent } = req.body;

  const item = db.prepare('SELECT id FROM saved_results WHERE id = ? AND user_id = ?').get(id, userId);
  if (!item) {
    return res.status(404).json({ error: 'Saved item not found or unauthorized' });
  }

  const now = Date.now();
  db.prepare(`
    UPDATE saved_results
    SET title = COALESCE(?, title), output_content = COALESCE(?, output_content), updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(title, outputContent, now, id, userId);

  res.json({ success: true, updatedAt: now });
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { id } = req.params;

  db.prepare('DELETE FROM saved_results WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true });
});

app.post('/api/history/:id/favorite', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { id } = req.params;

  const item = db.prepare('SELECT is_favorite FROM saved_results WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const nextStatus = item.is_favorite ? 0 : 1;
  db.prepare('UPDATE saved_results SET is_favorite = ? WHERE id = ? AND user_id = ?').run(nextStatus, id, userId);

  res.json({ id, isFavorite: Boolean(nextStatus) });
});

// 6. Tasks Persistence CRUD
app.get('/api/tasks', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY completed ASC, created_at DESC').all(userId) as any[];

  res.json({
    tasks: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      deadline: r.deadline,
      completed: Boolean(r.completed),
      sourceResultId: r.source_result_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { tasks } = req.body; // Can be single task or array of tasks

  const taskList = Array.isArray(tasks) ? tasks : [req.body];
  const now = Date.now();
  const created: any[] = [];

  const stmt = db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, priority, deadline, completed, source_result_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of taskList) {
    if (!t.title) continue;
    const id = t.id && !t.id.startsWith('task-') ? t.id : `task_${crypto.randomUUID()}`;
    stmt.run(
      id,
      userId,
      t.title.trim(),
      t.description || '',
      ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      t.deadline || null,
      t.completed ? 1 : 0,
      t.sourceResultId || null,
      now,
      now
    );
    created.push({ id, title: t.title, priority: t.priority, completed: Boolean(t.completed) });
  }

  res.json({ createdCount: created.length, tasks: created });
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { id } = req.params;
  const { completed, title, priority, deadline } = req.body;

  const now = Date.now();
  db.prepare(`
    UPDATE tasks
    SET completed = CASE WHEN ? IS NOT NULL THEN ? ELSE completed END,
        title = CASE WHEN ? IS NOT NULL THEN ? ELSE title END,
        priority = CASE WHEN ? IS NOT NULL THEN ? ELSE priority END,
        deadline = CASE WHEN ? IS NOT NULL THEN ? ELSE deadline END,
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    completed !== undefined ? (completed ? 1 : 0) : null,
    completed !== undefined ? (completed ? 1 : 0) : null,
    title ?? null,
    title ?? null,
    priority ?? null,
    priority ?? null,
    deadline ?? null,
    deadline ?? null,
    now,
    id,
    userId
  );

  res.json({ success: true, id, completed });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  const { id } = req.params;

  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true, id });
});

// 7. Aggregate Statistics & Saved Effort
app.get('/api/stats', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);

  const totalResultsRow = db.prepare('SELECT COUNT(*) as count FROM saved_results WHERE user_id = ?').get(userId) as any;
  const totalTasksRow = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed FROM tasks WHERE user_id = ?').get(userId) as any;
  const favRow = db.prepare('SELECT COUNT(*) as count FROM saved_results WHERE user_id = ? AND is_favorite = 1').get(userId) as any;

  // Breakdown by tool
  const toolBreakdown = db.prepare('SELECT tool_type, COUNT(*) as count FROM saved_results WHERE user_id = ? GROUP BY tool_type').all(userId) as any[];

  // Transparent calculation model:
  // Summarizer: 12 mins saved per summary
  // Task Extractor: 15 mins saved per extraction
  // Email Assistant: 10 mins saved per rewrite
  // Note Organizer: 18 mins saved per notes session
  // Daily Planner: 20 mins saved per plan
  // Grocery List: 8 mins saved per list
  // Chat: 5 mins saved per query
  const weights: Record<string, number> = {
    summarize: 12,
    'extract-tasks': 15,
    'rewrite-email': 10,
    'organize-notes': 18,
    'plan-day': 20,
    'grocery-list': 8,
    chat: 5,
  };

  let calculatedMinutes = 0;
  toolBreakdown.forEach((b) => {
    const w = weights[b.tool_type] || 10;
    calculatedMinutes += Number(b.count) * w;
  });

  // Add 4 minutes per completed task
  const completedTasks = Number(totalTasksRow?.completed || 0);
  calculatedMinutes += completedTasks * 4;

  const totalOps = Number(totalResultsRow?.count || 0) + Number(totalTasksRow?.total || 0);

  res.json({
    totalOperations: totalOps,
    savedResultsCount: Number(totalResultsRow?.count || 0),
    tasksCompleted: completedTasks,
    totalTasks: Number(totalTasksRow?.total || 0),
    favoritesCount: Number(favRow?.count || 0),
    estimatedTimeSavedMinutes: calculatedMinutes,
    estimatedTimeSavedHours: (calculatedMinutes / 60).toFixed(1),
    toolBreakdown: toolBreakdown.reduce((acc: any, cur: any) => {
      acc[cur.tool_type] = cur.count;
      return acc;
    }, {}),
    assumptions: {
      summaryMins: 12,
      taskExtractMins: 15,
      emailRewriteMins: 10,
      noteOrganizeMins: 18,
      dailyPlanMins: 20,
      groceryMins: 8,
      taskCheckMins: 4,
    },
  });
});

// Clear user data endpoint
app.post('/api/history/clear-all', (req: Request, res: Response) => {
  const { userId } = getAuthContext(req);
  db.prepare('DELETE FROM saved_results WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
  res.json({ success: true, message: 'All saved workspace data has been cleared.' });
});

/* -------------------------------------------------------------
 * FRONTEND SERVING (Vite in Dev, Dist in Prod)
 * ----------------------------------------------------------- */
async function start() {
  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LazyFlow AI] Server running at http://0.0.0.0:${PORT} (env: ${IS_PROD ? 'production' : 'development'})`);
  });
}

start().catch((err) => {
  console.error('[LazyFlow AI] Failed to start server:', err);
  process.exit(1);
});
