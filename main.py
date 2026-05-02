"""
Intelligent QA AI Assistant — Backend
Designed and developed by Arshad Shaik
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
import json
import re
import asyncio

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------
app = FastAPI(title="Intelligent QA AI Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Provider config
# ---------------------------------------------------------------------------
PROVIDER_CONFIGS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-4-scout-17b-16e-instruct",
            "qwen-qwq-32b",
            "gemma2-9b-it",
        ],
        "default_model": "llama-3.3-70b-versatile",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "models": [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
        "default_model": "gemini-2.0-flash",
    },
    "openai": {
        "base_url": "https://api.openai.com/v1/chat/completions",
        "models": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4.1",
            "gpt-4.1-mini",
        ],
        "default_model": "gpt-4o-mini",
    },
    "anthropic": {
        "base_url": None,   # handled separately
        "models": [
            "claude-sonnet-4-6",
            "claude-haiku-4-5-20251001",
            "claude-opus-4-6",
        ],
        "default_model": "claude-sonnet-4-6",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1/chat/completions",
        "models": ["deepseek-chat", "deepseek-reasoner"],
        "default_model": "deepseek-chat",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1/chat/completions",
        "models": [
            "mistral-large-latest",
            "mistral-small-latest",
            "codestral-latest",
        ],
        "default_model": "mistral-small-latest",
    },
}

# ---------------------------------------------------------------------------
# System Prompt
# ---------------------------------------------------------------------------
QA_SYSTEM_PROMPT = """You are an expert AI assistant specialising in Software Quality Assurance,
Full-Stack Development, and Test Automation. You help developers and QA engineers with:

- Generating comprehensive test cases (unit, integration, e2e, performance, security)
- Writing automation scripts for Selenium, Playwright, Cypress, pytest, JUnit
- Code review focused on testability, edge cases, and quality
- Debugging test failures and flaky tests
- CI/CD pipeline design and coverage analysis
- API testing (REST/GraphQL) with tools like Postman, REST-assured, httpx
- Performance testing with k6, JMeter, Locust
- Accessibility testing (WCAG, axe-core)
- Test strategy and QA consulting

Guidelines:
- Be concise but thorough. Lead with the most important information.
- Always provide working, runnable code examples when relevant.
- Admit uncertainty rather than hallucinate. If a question is vague, ask for clarification.
- Format code in proper markdown code blocks with language tags.
- When writing test scripts, include imports, setup, teardown, and meaningful assertions.
"""

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Message(BaseModel):
    role: str
    content: str

class AgentRequest(BaseModel):
    question: str
    provider: str = "groq"
    model: Optional[str] = None
    api_key: Optional[str] = None
    stream: bool = False
    history: Optional[List[Message]] = []
    action: str = "chat"          # chat | websearch | dom_locator
    temperature: Optional[float] = 0.7

class AgentResponse(BaseModel):
    answer: str
    provider: str
    model: str

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_env_key(provider: str) -> str:
    mapping = {
        "groq":      "GROQ_API_KEY",
        "gemini":    "GEMINI_API_KEY",
        "openai":    "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "deepseek":  "DEEPSEEK_API_KEY",
        "mistral":   "MISTRAL_API_KEY",
    }
    return os.environ.get(mapping.get(provider, ""), "")


async def web_search(query: str) -> str:
    """Fetch DuckDuckGo instant answer + organic snippets."""
    url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as client:
            r = await client.get(url)
            data = r.json()
            abstract = data.get("AbstractText", "")
            results = data.get("RelatedTopics", [])
            snippets = []
            for t in results[:4]:
                if isinstance(t, dict) and t.get("Text"):
                    snippets.append(t["Text"])
            combined = abstract + "\n" + "\n".join(snippets)
            return combined.strip() or "No results found."
    except Exception as e:
        return f"Web search error: {e}"


async def fetch_dom(url_or_html: str) -> str:
    """Fetch a URL and strip to essential DOM structure."""
    if url_or_html.strip().startswith("<"):
        html = url_or_html
    else:
        try:
            async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as client:
                r = await client.get(url_or_html, headers={"User-Agent": "Mozilla/5.0"})
                html = r.text
        except Exception as e:
            return f"Could not fetch URL: {e}"

    # Strip scripts, styles, comments
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style[^>]*>.*?</style>",  "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
    # Keep only elements useful for locators
    html = re.sub(r"\s+", " ", html)
    return html[:8000]


def build_messages(system: str, history: List[Message], question: str) -> list:
    msgs = [{"role": "system", "content": system}]
    for m in (history or [])[-10:]:
        msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": question})
    return msgs


async def call_openai_compatible(
    base_url: str,
    api_key: str,
    model: str,
    messages: list,
    stream: bool,
    temperature: float,
):
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 2048,
        "stream": stream,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if stream:
        async def event_generator():
            async with httpx.AsyncClient(timeout=60, verify=False) as client:
                async with client.stream("POST", base_url, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]
                            if chunk.strip() == "[DONE]":
                                break
                            try:
                                delta = json.loads(chunk)["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield f"data: {json.dumps({'token': delta})}\n\n"
                            except Exception:
                                pass
        return event_generator()
    else:
        async with httpx.AsyncClient(timeout=60, verify=False) as client:
            resp = await client.post(base_url, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()


async def call_anthropic(api_key: str, model: str, messages: list, stream: bool, temperature: float):
    url = "https://api.anthropic.com/v1/messages"
    system_content = next((m["content"] for m in messages if m["role"] == "system"), "")
    chat_messages = [m for m in messages if m["role"] != "system"]

    payload = {
        "model": model,
        "max_tokens": 2048,
        "system": system_content,
        "messages": chat_messages,
        "temperature": temperature,
        "stream": stream,
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    if stream:
        async def event_generator():
            async with httpx.AsyncClient(timeout=60, verify=False) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                ev = json.loads(line[6:])
                                if ev.get("type") == "content_block_delta":
                                    delta = ev.get("delta", {}).get("text", "")
                                    if delta:
                                        yield f"data: {json.dumps({'token': delta})}\n\n"
                            except Exception:
                                pass
        return event_generator()
    else:
        async with httpx.AsyncClient(timeout=60, verify=False) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["content"][0]["text"].strip()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "service": "Intelligent QA AI Assistant", "author": "Arshad Shaik"}


@app.get("/providers")
def get_providers():
    return {
        p: {
            "models": cfg["models"],
            "default_model": cfg["default_model"],
        }
        for p, cfg in PROVIDER_CONFIGS.items()
    }


@app.post("/agent")
async def run_agent(req: AgentRequest):
    provider = req.provider.lower()
    if provider not in PROVIDER_CONFIGS:
        raise HTTPException(400, f"Unknown provider '{provider}'")

    cfg    = PROVIDER_CONFIGS[provider]
    model  = req.model or cfg["default_model"]
    api_key = req.api_key or get_env_key(provider)

    if not api_key:
        raise HTTPException(400, f"No API key provided for '{provider}'. Set it in the UI or as an env var.")

    # --- Action pre-processing ---
    user_content = req.question.strip()

    if req.action == "websearch":
        results = await web_search(user_content)
        user_content = (
            f"Use the following live web search results to answer this query: '{user_content}'\n\n"
            f"--- Search Results ---\n{results}\n--- End Results ---\n\n"
            "Synthesise a clear, accurate answer. Cite key points from the results."
        )
    elif req.action == "dom_locator":
        dom = await fetch_dom(user_content)
        user_content = (
            f"Analyse this HTML DOM and generate a Page Object Model with robust locators "
            f"for Playwright and Selenium. Identify all interactive elements.\n\n"
            f"--- DOM ---\n{dom}\n--- End DOM ---"
        )

    messages = build_messages(QA_SYSTEM_PROMPT, req.history or [], user_content)

    try:
        if provider == "anthropic":
            result = await call_anthropic(api_key, model, messages, req.stream, req.temperature or 0.7)
        else:
            result = await call_openai_compatible(
                cfg["base_url"], api_key, model, messages, req.stream, req.temperature or 0.7
            )

        if req.stream:
            return StreamingResponse(result, media_type="text/event-stream")

        return AgentResponse(answer=result, provider=provider, model=model)

    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Provider API error: {e.response.text[:300]}")
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/health")
def health():
    return {"status": "healthy"}
