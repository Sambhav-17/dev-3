# LazyFlow AI — Work Less, Live More

> **Hacktoberfest Open-Source AI Challenge — Week 3: “Slow and Steady”**  
> An open-weight AI productivity suite built to eliminate repetitive digital busywork so you can protect your energy for high-leverage creative thinking.

---

## 🌟 Overview

**LazyFlow AI** is a production-quality, open-source productivity web application that uses open-weight artificial intelligence (via **Ollama**) to automate everyday tasks:

1. **Smart Summaries** — Condense lengthy meeting notes, articles, and briefs into bullet points, paragraphs, or executive summaries.
2. **Task Extraction** — Convert unorganized conversations and transcripts into structured, priority-tagged action items with explicit deadline detection.
3. **Email Assistant** — Calibrate drafts into professional, concise, friendly, or direct tone while preserving original intent and generating subject lines.
4. **Note Organizer** — Cluster messy scratchpad notes into categorical headings, key takeaways, and action items.
5. **Daily Planner** — Formulate realistic, burnout-free workday schedules with duration blocks and restorative breaks.
6. **Grocery List Assistant** — Translate ingredients, recipes, or meal ideas into supermarket aisle checklists.
7. **AI Copilot Chat** — An everyday productivity partner to answer questions and brainstorm automations.
8. **Persistent SQLite Store** — Save, search, edit, favorite, and delete previous AI results with isolated user records.

---

## 🧠 Why Open Innovation Matters

In line with the Hacktoberfest Open-Source AI Challenge:

- **Local Inference for Complete Privacy:** Personal notes, sensitive meeting transcripts, and rough drafts never leave your machine when using Ollama.
- **Zero API Tax:** No per-request token billing, surprise charges, or credit limits.
- **Model Independence:** Swap freely between **Qwen 2.5**, **Llama 3.2**, **Mistral**, or **Phi-3** with a single click in Settings.
- **True Offline Capability:** Once model weights are downloaded to your drive, LazyFlow operates seamlessly even without an active internet connection.

---

## 🛠 Technology Stack

- **Frontend:**
  - React 19 + TypeScript
  - Vite 8 build toolchain
  - Tailwind CSS v4 styling with custom glassmorphism panels
  - Lucide React iconography
  - Canvas Confetti for completion celebrations
- **Backend & API:**
  - Node 22 + Express unified full-stack server
  - Embedded SQLite storage (`node:sqlite`) with Write-Ahead Logging (WAL)
  - Python FastAPI alternative service located in `/backend`
- **AI Core:**
  - Ollama REST HTTP API with structured JSON output enforcement
  - Resilient offline fallback semantic parser ensuring zero crash rate
- **DevOps:**
  - Docker & Docker Compose configuration for 1-step containerized deployment

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js 22+**
2. **Ollama** installed ([https://ollama.com](https://ollama.com))

### 1. Download Model with Ollama
```bash
# Pull and start your preferred open-weight model
ollama run qwen2.5:7b
# or for lightweight low-VRAM devices:
ollama run llama3.2:3b
```

### 2. Clone and Install
```bash
git clone https://github.com/placeholder/lazyflow-ai.git
cd lazyflow-ai
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Default parameters in `.env`:
```env
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:7b"
DATABASE_URL="sqlite://./data/lazyflow.db"
PORT=3000
```

### 4. Run the Full-Stack Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker Compose

To orchestrate both Ollama and LazyFlow together in Docker:

```bash
docker-compose up -d
docker-compose exec ollama ollama pull qwen2.5:7b
```

---

## 🐍 Alternative Python FastAPI Backend

If you prefer running the Python FastAPI backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Running Automated Tests

LazyFlow includes a verification suite testing cryptography, SQLite schema, and AI algorithms:

```bash
npm test
```

All 7 test suites verify:
- Scrypt password hashing & timing-safe validation
- SQLite table schema creation and prepared statement execution
- Semantic summarizer length & style parameters
- Task extraction with priority tag detection
- Email rewriting with tone adjustment and intent protection
- Daily schedule time budgeting with break calculations
- Grocery aisle categorization

---

## 📊 Transparent Productivity Measurement

Unlike tools with fabricated vanity metrics, LazyFlow's **Time Saved** statistic is calculated directly from your database records:
- **Smart Summary:** 12 minutes saved per run
- **Task Extraction:** 15 minutes saved per run
- **Email Rewrite:** 10 minutes saved per run
- **Note Organizer:** 18 minutes saved per run
- **Daily Planner:** 20 minutes saved per run
- **Grocery List:** 8 minutes saved per run
- **Completed Task:** 4 minutes credited

Formula: `Total Saved Minutes = Sum(Tool Operation Count × Weight) + (Completed Tasks × 4m)`.

---

## 📄 License

Licensed under the **Apache License 2.0**. You are free to use, modify, distribute, and integrate this software into your own personal or commercial workflows.
