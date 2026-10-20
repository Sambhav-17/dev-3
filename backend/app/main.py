import os
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="LazyFlow AI Backend",
    description="Open-source AI productivity service using Ollama and local open-weight models.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=100000)
    length: str = Field(default="medium") # short, medium, detailed
    style: str = Field(default="bullets") # bullets, paragraph, executive

class TaskExtractRequest(BaseModel):
    text: str = Field(..., min_length=5)

class EmailRewriteRequest(BaseModel):
    text: str = Field(..., min_length=5)
    tone: str = Field(default="professional")

class PlanDayRequest(BaseModel):
    tasks: List[str]
    availableHours: float = Field(default=8.0, ge=1.0, le=24.0)

class GroceryRequest(BaseModel):
    text: str = Field(..., min_length=3)

@app.get("/api/health")
async def health_check():
    ollama_online = False
    models = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_online = True
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
    except Exception:
        ollama_online = False

    return {
        "status": "healthy",
        "service": "LazyFlow AI Python Backend",
        "database": "sqlite-local",
        "active_model": OLLAMA_MODEL,
        "ollama": {
            "url": OLLAMA_BASE_URL,
            "connected": ollama_online,
            "available_models": models
        }
    }

@app.post("/api/ai/summarize")
async def summarize(req: SummarizeRequest):
    # Calls Ollama or executes semantic summarization
    start = time.time()
    system_prompt = f"Produce a {req.length} summary in {req.style} format. Preserve key points."
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": req.text,
                    "system": system_prompt,
                    "stream": False
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "summary": data.get("response", "").strip(),
                    "meta": {
                        "provider": "ollama",
                        "model": OLLAMA_MODEL,
                        "latencyMs": int((time.time() - start) * 1000)
                    }
                }
    except Exception:
        pass

    # Fallback
    sentences = [s.strip() for s in req.text.split(".") if len(s.strip()) > 10]
    count = 2 if req.length == "short" else 4 if req.length == "medium" else 6
    summary = "\n".join([f"• {s}." for s in sentences[:count]])
    return {
        "summary": summary,
        "meta": {
            "provider": "open_fallback",
            "model": f"{OLLAMA_MODEL} (Local Fallback)",
            "latencyMs": int((time.time() - start) * 1000)
        }
    }
