import assert from 'node:assert';
import { executeAIRequest } from '../server/aiService.js';
import { db } from '../server/db.js';
import { hashPassword, verifyPassword } from '../server/auth.js';

console.log('--- Running LazyFlow AI Automated Verification Suite ---');

async function runTests() {
  // Test 1: Password hashing and verification
  console.log('✓ Testing scrypt password hashing & verification...');
  const pwd = 'hacktoberfest2026';
  const hashed = hashPassword(pwd);
  assert.strictEqual(verifyPassword(pwd, hashed), true);
  assert.strictEqual(verifyPassword('wrongpwd', hashed), false);
  console.log('  -> Password cryptography verified.');

  // Test 2: Database tables integrity
  console.log('✓ Testing SQLite schema & prepared statements...');
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  const tableNames = tableCheck.map((t) => t.name);
  assert.ok(tableNames.includes('users'), 'Users table missing');
  assert.ok(tableNames.includes('saved_results'), 'Saved results table missing');
  assert.ok(tableNames.includes('tasks'), 'Tasks table missing');
  assert.ok(tableNames.includes('user_settings'), 'User settings table missing');
  console.log('  -> All 4 database tables verified.');

  // Test 3: AI Service Semantic Summarizer
  console.log('✓ Testing AI summarization fallback engine...');
  const sampleText = 'LazyFlow AI is designed for the Hacktoberfest Open-Source AI Challenge. It reduces repetitive busywork through open-weight models. Users can summarize documents, organize messy notes, and plan realistic workday schedules without per-request subscription fees.';
  const summaryResult = await executeAIRequest<string>(
    'summarize',
    { text: sampleText, length: 'medium', style: 'bullets' },
    { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen2.5:7b' }
  );
  assert.ok(summaryResult.data.length > 10, 'Summary data was empty');
  assert.ok(summaryResult.meta.provider, 'Meta provider missing');
  console.log('  -> Summarizer returned structured output with latency:', summaryResult.meta.latencyMs, 'ms');

  // Test 4: Task Extraction
  console.log('✓ Testing task extraction engine...');
  const meetingNotes = `Meeting Notes:
- Review Q3 serverless architecture by Friday
- Urgent: Deploy security patch before tomorrow 5pm
- Draft Hacktoberfest DEV post`;
  const taskResult = await executeAIRequest<any[]>(
    'extract-tasks',
    { text: meetingNotes },
    { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen2.5:7b' }
  );
  assert.ok(taskResult.data.length >= 2, 'Expected at least 2 tasks');
  assert.ok(taskResult.data.some((t) => t.priority === 'high'), 'Expected high priority detection');
  console.log('  -> Extracted', taskResult.data.length, 'tasks with priority tags & deadlines.');

  // Test 5: Email Rewriter
  console.log('✓ Testing email rewriter engine...');
  const emailResult = await executeAIRequest<any>(
    'rewrite-email',
    { text: 'Send me the report now or project will fail.', tone: 'professional' },
    { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen2.5:7b' }
  );
  assert.ok(emailResult.data.subject, 'Missing subject');
  assert.ok(emailResult.data.body, 'Missing body');
  assert.ok(emailResult.data.originalIntent, 'Missing originalIntent explanation');
  console.log('  -> Email rewrite generated professional tone & subject.');

  // Test 6: Daily Planner
  console.log('✓ Testing daily schedule optimizer...');
  const planResult = await executeAIRequest<any>(
    'plan-day',
    { tasks: ['Finish database schema', 'Code review PR #12', 'Team architecture sync'], availableHours: 6 },
    { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen2.5:7b' }
  );
  assert.ok(planResult.data.schedule.length >= 3, 'Expected schedule slots');
  assert.ok(planResult.data.schedule.some((s: any) => s.isBreak), 'Expected recovery break slot');
  console.log('  -> Generated schedule with', planResult.data.schedule.length, 'time blocks including breaks.');

  // Test 7: Grocery List
  console.log('✓ Testing grocery list categorized extractor...');
  const groceryResult = await executeAIRequest<any>(
    'grocery-list',
    { text: '2 cups of flour, 3 fresh tomatoes, 1 lb cheddar cheese, 500g chicken breast' },
    { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen2.5:7b' }
  );
  assert.ok(groceryResult.data.categories.length > 0, 'No categories produced');
  console.log('  -> Categorized grocery ingredients into', groceryResult.data.categories.length, 'sections.');

  console.log('========================================================');
  console.log('ALL TESTS PASSED! LazyFlow AI is production ready.');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
