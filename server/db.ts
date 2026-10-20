import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lazyflow.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_type TEXT NOT NULL,
    title TEXT NOT NULL,
    original_input TEXT NOT NULL,
    output_content TEXT NOT NULL,
    metadata_json TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    deadline TEXT,
    completed INTEGER DEFAULT 0,
    source_result_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    ollama_base_url TEXT DEFAULT 'http://127.0.0.1:11434',
    selected_model TEXT DEFAULT 'qwen2.5:7b',
    default_summary_length TEXT DEFAULT 'medium',
    theme TEXT DEFAULT 'dark',
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_saved_results_user ON saved_results(user_id, tool_type);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, completed);
`);

console.log(`[Database] SQLite database initialized at ${DB_PATH}`);
