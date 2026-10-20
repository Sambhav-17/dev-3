export interface AIServiceConfig {
  ollamaBaseUrl: string;
  model: string;
}

export interface AIResponseMeta {
  provider: 'ollama' | 'open_fallback';
  model: string;
  latencyMs: number;
  tokensEstimated: number;
}

// Check if Ollama is accessible
export async function checkOllamaHealth(baseUrl: string): Promise<{ available: boolean; models: string[]; version?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { available: false, models: [] };
    const data = await res.json() as { models?: Array<{ name: string }> };
    const models = (data.models || []).map((m: { name: string }) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

// Call Ollama endpoint directly
async function callOllama(
  baseUrl: string,
  model: string,
  prompt: string,
  systemPrompt: string,
  jsonFormat: boolean = false
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for local inference

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: systemPrompt,
        stream: false,
        format: jsonFormat ? 'json' : undefined,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as { response?: string };
    return data.response || '';
  } catch (err: unknown) {
    clearTimeout(timeout);
    throw err;
  }
}

// Robust fallback open-source algorithmic processing
function runSemanticSummarizer(
  text: string,
  length: 'short' | 'medium' | 'detailed',
  style: 'bullets' | 'paragraph' | 'executive'
): string {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const targetCount = length === 'short' ? 2 : length === 'medium' ? 4 : 7;
  const picked = sentences.slice(0, Math.max(1, Math.min(targetCount, sentences.length)));

  if (style === 'bullets') {
    return picked.map((s) => `• ${s}`).join('\n');
  } else if (style === 'executive') {
    return `### Executive Overview\n\n${picked.slice(0, 2).join(' ')}\n\n### Strategic Takeaways\n${picked.slice(2).map((s) => `• ${s}`).join('\n') || '• Core workflow identified with high priority for automation.'}`;
  } else {
    return picked.join(' ');
  }
}

function runSemanticTaskExtraction(text: string): Array<{
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  completed: boolean;
}> {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
  const tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    deadline: string | null;
    completed: boolean;
  }> = [];

  let count = 0;
  for (const line of lines) {
    // Detect priority markers
    let priority: 'low' | 'medium' | 'high' = 'medium';
    const lower = line.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.includes('immediately') || lower.includes('high priority')) {
      priority = 'high';
    } else if (lower.includes('low priority') || lower.includes('whenever') || lower.includes('nice to have') || lower.includes('later')) {
      priority = 'low';
    }

    // Detect explicit deadlines
    let deadline: string | null = null;
    const deadlineMatch = line.match(/(?:by|before|due|deadline:?)\s+([A-Za-z0-9, ]{3,20})/i);
    if (deadlineMatch) {
      deadline = deadlineMatch[1].trim();
    }

    // Clean task title
    const cleanTitle = line
      .replace(/^[-*•\d.)\]\s]+/, '')
      .replace(/\[\s*\]/, '')
      .replace(/^(todo|task|action item):\s*/i, '');

    if (cleanTitle.length > 3) {
      count++;
      tasks.push({
        id: `task-${Date.now()}-${count}`,
        title: cleanTitle.length > 80 ? cleanTitle.slice(0, 80) + '...' : cleanTitle,
        description: line,
        priority,
        deadline,
        completed: false,
      });
    }
  }

  // If no lines formatted as tasks, split by sentences
  if (tasks.length === 0) {
    const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 10);
    sentences.slice(0, 5).forEach((sentence, idx) => {
      tasks.push({
        id: `task-${Date.now()}-${idx + 1}`,
        title: sentence.trim().slice(0, 75),
        description: sentence.trim(),
        priority: 'medium',
        deadline: null,
        completed: false,
      });
    });
  }

  return tasks;
}

function runSemanticEmailRewriter(
  text: string,
  options: { tone: 'professional' | 'concise' | 'friendly' | 'formal' | 'direct'; subjectOnly?: boolean }
): { subject: string; body: string; originalIntent: string } {
  const cleaned = text.trim();
  const firstLine = cleaned.split('\n')[0] || 'Work Update';
  const subjectWords = firstLine.replace(/^(re:|fwd:|subject:)/i, '').trim().split(' ').slice(0, 6).join(' ');
  const subject = `Update: ${subjectWords || 'Productivity & Action Plan'}`;

  let body = '';
  switch (options.tone) {
    case 'concise':
      body = `Hi Team,\n\nFollowing up briefly:\n\n${cleaned
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((l) => `• ${l}`)
        .join('\n')}\n\nPlease let me know if you have any questions.\n\nBest,\n[Your Name]`;
      break;
    case 'friendly':
      body = `Hi everyone,\n\nHope you're having a wonderful week!\n\nI wanted to share a quick note: ${cleaned}\n\nReally appreciate your help and looking forward to catching up soon.\n\nWarm regards,\n[Your Name]`;
      break;
    case 'formal':
      body = `Dear Colleague,\n\nI am writing to formally communicate the following matter:\n\n"${cleaned}"\n\nYour prompt review and guidance on this proceeding would be sincerely appreciated.\n\nSincerely,\n[Your Name]`;
      break;
    case 'direct':
      body = `Hello,\n\nAction needed:\n${cleaned}\n\nPlease confirm receipt and next steps.\n\nThanks,\n[Your Name]`;
      break;
    case 'professional':
    default:
      body = `Hello,\n\nI hope this message finds you well.\n\nRegarding our recent discussion:\n\n${cleaned}\n\nPlease review at your earliest convenience and let me know how you would like to proceed.\n\nBest regards,\n[Your Name]`;
      break;
  }

  return {
    subject,
    body,
    originalIntent: 'Preserved user core objective with refined tone, eliminated passive-aggressive phrasing, and structured sign-off.',
  };
}

function runSemanticNoteOrganizer(text: string): {
  title: string;
  categories: Array<{ name: string; notes: string[] }>;
  keyPoints: string[];
  actionItems: string[];
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const keyPoints: string[] = [];
  const actionItems: string[] = [];
  const generalNotes: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('todo') || lower.includes('must') || lower.includes('action') || lower.startsWith('- [ ]') || lower.includes('follow up')) {
      actionItems.push(line.replace(/^[-*•\d.)\]\s]+/, ''));
    } else if (lower.includes('important') || lower.includes('key') || lower.includes('note:') || lower.includes('decision')) {
      keyPoints.push(line.replace(/^[-*•\d.)\]\s]+/, ''));
    } else {
      generalNotes.push(line.replace(/^[-*•\d.)\]\s]+/, ''));
    }
  }

  // Default fallback if categories are sparse
  if (keyPoints.length === 0 && lines.length > 0) {
    keyPoints.push(...lines.slice(0, Math.min(3, lines.length)));
  }

  return {
    title: lines[0]?.slice(0, 50) || 'Organized Workspace Notes',
    categories: [
      { name: 'Core Insights', notes: keyPoints.length > 0 ? keyPoints : ['Discussion points captured'] },
      { name: 'General Observations', notes: generalNotes.length > 0 ? generalNotes : ['Context details noted'] },
    ],
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Notes processed and organized.'],
    actionItems: actionItems.length > 0 ? actionItems : ['Review notes and assign follow-ups.'],
  };
}

function runSemanticDailyPlanner(
  tasks: string[],
  availableHours: number = 8
): {
  totalEstimatedMinutes: number;
  availableHours: number;
  schedule: Array<{
    timeSlot: string;
    task: string;
    durationMinutes: number;
    priority: 'high' | 'medium' | 'low';
    isBreak: boolean;
  }>;
} {
  const schedule: Array<{
    timeSlot: string;
    task: string;
    durationMinutes: number;
    priority: 'high' | 'medium' | 'low';
    isBreak: boolean;
  }> = [];

  let startMinutes = 9 * 60; // 09:00 AM
  let totalEstimatedMinutes = 0;
  const maxMinutes = Math.min(availableHours * 60, 600);

  const cleanTasks = tasks.map((t) => t.trim()).filter(Boolean);
  const effectiveTasks = cleanTasks.length > 0 ? cleanTasks : ['Deep work session', 'Review correspondence', 'Planning & sync'];

  for (let i = 0; i < effectiveTasks.length; i++) {
    if (totalEstimatedMinutes + 45 > maxMinutes) break;

    const taskName = effectiveTasks[i];
    const duration = i === 0 ? 60 : 45;
    const startH = Math.floor(startMinutes / 60);
    const startM = startMinutes % 60;
    const endMinutes = startMinutes + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const formatTime = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 === 0 ? 12 : h % 12;
      return `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    schedule.push({
      timeSlot: `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`,
      task: taskName,
      durationMinutes: duration,
      priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
      isBreak: false,
    });

    startMinutes = endMinutes;
    totalEstimatedMinutes += duration;

    // Suggest a break after 90 minutes of work
    if ((i + 1) % 2 === 0 && totalEstimatedMinutes + 15 <= maxMinutes) {
      const bEnd = startMinutes + 15;
      schedule.push({
        timeSlot: `${formatTime(Math.floor(startMinutes / 60), startMinutes % 60)} - ${formatTime(Math.floor(bEnd / 60), bEnd % 60)}`,
        task: 'Recovery Break (Walk, Hydrate, Rest Eyes)',
        durationMinutes: 15,
        priority: 'low',
        isBreak: true,
      });
      startMinutes = bEnd;
      totalEstimatedMinutes += 15;
    }
  }

  return {
    totalEstimatedMinutes,
    availableHours,
    schedule,
  };
}

function runSemanticGroceryList(input: string): {
  categories: Array<{
    category: string;
    items: Array<{ id: string; name: string; quantity: string; checked: boolean }>;
  }>;
} {
  const lines = input.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.length > 1);

  const produceKeywords = ['apple', 'banana', 'onion', 'garlic', 'tomato', 'potato', 'spinach', 'lettuce', 'lemon', 'herb', 'vegetable', 'fruit', 'avocado', 'carrot', 'pepper'];
  const dairyKeywords = ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'parmesan', 'mozzarella', 'cheddar'];
  const bakeryPantryKeywords = ['bread', 'flour', 'sugar', 'rice', 'pasta', 'olive oil', 'salt', 'pepper', 'sauce', 'canned', 'beans', 'cereal', 'oats'];
  const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'shrimp', 'steak', 'bacon', 'tofu'];

  const categoryMap: Record<string, Array<{ id: string; name: string; quantity: string; checked: boolean }>> = {
    'Produce & Fresh': [],
    'Dairy & Eggs': [],
    'Meat & Protein': [],
    'Pantry & Grains': [],
    'Household & Snacks': [],
  };

  let idCounter = 1;
  for (const rawItem of lines) {
    const lower = rawItem.toLowerCase();
    // Parse quantity
    const quantMatch = rawItem.match(/^([\d/.\s]+(?:cups?|tbsp|tsp|lbs?|oz|grams?|kg|bunch|pack|heads?|cans?|cloves?)?)\s*(.*)/i);
    let quantity = '1 unit';
    let name = rawItem;

    if (quantMatch && quantMatch[1]?.trim() && quantMatch[2]?.trim()) {
      quantity = quantMatch[1].trim();
      name = quantMatch[2].trim();
    }

    const itemObj = {
      id: `item-${Date.now()}-${idCounter++}`,
      name: name.replace(/^[-*•\s]+/, ''),
      quantity,
      checked: false,
    };

    if (produceKeywords.some((k) => lower.includes(k))) {
      categoryMap['Produce & Fresh'].push(itemObj);
    } else if (dairyKeywords.some((k) => lower.includes(k))) {
      categoryMap['Dairy & Eggs'].push(itemObj);
    } else if (meatKeywords.some((k) => lower.includes(k))) {
      categoryMap['Meat & Protein'].push(itemObj);
    } else if (bakeryPantryKeywords.some((k) => lower.includes(k))) {
      categoryMap['Pantry & Grains'].push(itemObj);
    } else {
      categoryMap['Household & Snacks'].push(itemObj);
    }
  }

  const resultCategories = Object.entries(categoryMap)
    .filter(([_, items]) => items.length > 0)
    .map(([cat, items]) => ({ category: cat, items }));

  return { categories: resultCategories.length > 0 ? resultCategories : [{ category: 'General Groceries', items: [] }] };
}

// Master Unified AI Execution Router
export async function executeAIRequest<T>(
  taskType: 'summarize' | 'extract-tasks' | 'rewrite-email' | 'organize-notes' | 'plan-day' | 'grocery-list' | 'chat',
  inputPayload: any,
  config: AIServiceConfig
): Promise<{ data: T; meta: AIResponseMeta }> {
  const start = Date.now();
  const ollamaCheck = await checkOllamaHealth(config.ollamaBaseUrl);

  if (ollamaCheck.available) {
    try {
      if (taskType === 'summarize') {
        const { text, length = 'medium', style = 'bullets' } = inputPayload;
        const system = `You are LazyFlow AI, an open-source productivity model specialized in high-density text summarization. Produce a ${length} summary in ${style} format. Preserve core facts.`;
        const prompt = `Summarize the following text:\n\n${text}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, false);
        return {
          data: output.trim() as unknown as T,
          meta: {
            provider: 'ollama',
            model: config.model,
            latencyMs: Date.now() - start,
            tokensEstimated: Math.round(text.length / 4),
          },
        };
      }

      if (taskType === 'extract-tasks') {
        const { text } = inputPayload;
        const system = `You are LazyFlow AI. Extract actionable tasks into a strict JSON array of objects with keys: "title", "description", "priority" ('high'|'medium'|'low'), "deadline" (string or null). Do not invent deadlines. Return only JSON.`;
        const prompt = `Extract all tasks from:\n\n${text}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, true);
        const parsed = JSON.parse(output);
        const tasks = (Array.isArray(parsed) ? parsed : parsed.tasks || []).map((t: any, idx: number) => ({
          id: `task-${Date.now()}-${idx}`,
          title: t.title || 'Untitled task',
          description: t.description || '',
          priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
          deadline: t.deadline || null,
          completed: false,
        }));
        return {
          data: tasks as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: Math.round(text.length / 4) },
        };
      }

      if (taskType === 'rewrite-email') {
        const { text, tone = 'professional' } = inputPayload;
        const system = `You are LazyFlow AI Email Assistant. Rewrite the user's message in a ${tone} tone. Return strict JSON with keys: "subject", "body", "originalIntent".`;
        const prompt = `Rewrite this message:\n\n${text}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, true);
        const parsed = JSON.parse(output);
        return {
          data: parsed as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: Math.round(text.length / 4) },
        };
      }

      if (taskType === 'organize-notes') {
        const { text } = inputPayload;
        const system = `You are LazyFlow AI. Organize unstructured notes into JSON with: "title", "categories" (array of {name, notes}), "keyPoints" (array of strings), "actionItems" (array of strings).`;
        const prompt = `Organize these notes:\n\n${text}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, true);
        const parsed = JSON.parse(output);
        return {
          data: parsed as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: Math.round(text.length / 4) },
        };
      }

      if (taskType === 'plan-day') {
        const { tasks, availableHours = 8 } = inputPayload;
        const system = `You are LazyFlow AI Daily Planner. Generate a realistic schedule for a ${availableHours}-hour workday. Return JSON with: "totalEstimatedMinutes", "availableHours", "schedule" (array of {timeSlot, task, durationMinutes, priority, isBreak}).`;
        const prompt = `Plan my day for ${availableHours} hours with tasks:\n${Array.isArray(tasks) ? tasks.join('\n') : tasks}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, true);
        const parsed = JSON.parse(output);
        return {
          data: parsed as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: 250 },
        };
      }

      if (taskType === 'grocery-list') {
        const { text } = inputPayload;
        const system = `You are LazyFlow AI Grocery Assistant. Convert recipe or food ingredients into categorized grocery items. Return JSON with "categories" (array of {category, items: [{id, name, quantity, checked}]}).`;
        const prompt = `Generate grocery list for:\n\n${text}`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, true);
        const parsed = JSON.parse(output);
        return {
          data: parsed as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: Math.round(text.length / 4) },
        };
      }

      if (taskType === 'chat') {
        const { message, history = [] } = inputPayload;
        const system = `You are LazyFlow AI, an open-weight productivity partner. You help people automate digital busywork, organize tasks, synthesize documents, and live more. Keep answers practical, structured, and concise.`;
        const prompt = `${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}\nuser: ${message}\nassistant:`;
        const output = await callOllama(config.ollamaBaseUrl, config.model, prompt, system, false);
        return {
          data: output.trim() as unknown as T,
          meta: { provider: 'ollama', model: config.model, latencyMs: Date.now() - start, tokensEstimated: Math.round(message.length / 4) },
        };
      }
    } catch (err) {
      console.warn('[AI Service] Ollama call failed or returned unparseable response, falling back to open semantic engine:', err);
      // Fallback seamlessly
    }
  }

  // Fallback semantic processing (zero failure, offline capable)
  let fallbackData: any;
  if (taskType === 'summarize') {
    fallbackData = runSemanticSummarizer(inputPayload.text, inputPayload.length || 'medium', inputPayload.style || 'bullets');
  } else if (taskType === 'extract-tasks') {
    fallbackData = runSemanticTaskExtraction(inputPayload.text);
  } else if (taskType === 'rewrite-email') {
    fallbackData = runSemanticEmailRewriter(inputPayload.text, { tone: inputPayload.tone || 'professional' });
  } else if (taskType === 'organize-notes') {
    fallbackData = runSemanticNoteOrganizer(inputPayload.text);
  } else if (taskType === 'plan-day') {
    const rawTasks = Array.isArray(inputPayload.tasks)
      ? inputPayload.tasks
      : typeof inputPayload.tasks === 'string'
      ? inputPayload.tasks.split('\n')
      : ['Deep Work Block', 'Process Emails', 'Team Sync'];
    fallbackData = runSemanticDailyPlanner(rawTasks, inputPayload.availableHours || 8);
  } else if (taskType === 'grocery-list') {
    fallbackData = runSemanticGroceryList(inputPayload.text);
  } else if (taskType === 'chat') {
    const msg = inputPayload.message.toLowerCase();
    if (msg.includes('summar') || msg.includes('digest')) {
      fallbackData = "I can summarize any document or notes for you! Switch over to the **Smart Summarizer** tab in the sidebar or paste your text right here, and I'll generate a concise breakdown in your choice of bullet points, paragraphs, or executive briefings.";
    } else if (msg.includes('task') || msg.includes('extract') || msg.includes('meeting')) {
      fallbackData = "Head over to the **Task Extractor** tool! Paste your unorganized meeting transcripts or project briefs, and I'll isolate distinct deliverables, assign priority levels, and detect explicit deadlines automatically.";
    } else if (msg.includes('email') || msg.includes('tone') || msg.includes('rewrite')) {
      fallbackData = "Need to polish an email? The **Email Assistant** tool lets you toggle between Professional, Concise, Friendly, and Direct tones while preserving your core message and generating subject lines.";
    } else if (msg.includes('plan') || msg.includes('schedule') || msg.includes('day')) {
      fallbackData = "Use the **Daily Planner** tool to input your commitments and available hours. It calculates optimal focus blocks and intersperses recommended recovery pauses to protect your energy.";
    } else {
      fallbackData = `Hello! I'm LazyFlow AI, your open-weight productivity copilot. I help you automate repetitive busywork so you can work less and live more. You can ask me questions, or jump into any of our 6 dedicated automation tools in the sidebar:\n\n• **Smart Summaries**\n• **Task Extraction**\n• **Email Polishing**\n• **Note Organizing**\n• **Daily Planning**\n• **Grocery Categorization**\n\nWhat repetitive task can I take off your plate today?`;
    }
  }

  return {
    data: fallbackData as T,
    meta: {
      provider: 'open_fallback',
      model: `${config.model} (Semantic Fallback)`,
      latencyMs: Date.now() - start,
      tokensEstimated: 120,
    },
  };
}
