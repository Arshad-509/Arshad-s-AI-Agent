# 🧪 Intelligent QA AI Assistant

> Designed and developed by **Arshad Shaik**

An enterprise-grade AI assistant for Software Quality Assurance and Full-Stack Testing.
Supports 6 AI providers, real-time streaming, conversation history, markdown rendering, web search, and DOM locator generation — all at **$0 cost** using free-tier APIs.

![Status](https://img.shields.io/badge/Status-Active-success)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Multi-Provider AI** | Switch between Groq, Gemini, OpenAI, Anthropic, DeepSeek, Mistral |
| **Streaming Mode** | Real-time token streaming via SSE or single-shot responses |
| **Conversation History** | Last 10 messages sent as context for multi-turn chats |
| **Markdown Rendering** | Code blocks, syntax highlighting, lists, headers, inline code |
| **Web Search** | DuckDuckGo-powered live web results injected into AI context |
| **DOM Locator Gen** | Paste HTML or URL → AI generates Page Object Models + locators |
| **Per-Provider API Keys** | Each provider stores its own key independently |
| **Temperature Control** | Slide between precise and creative outputs |
| **Copy & Retry** | Copy any AI response or regenerate the last answer |
| **Export Chat** | Download full conversation as a `.txt` file |
| **Light / Dark Mode** | Persistent theme preference |

---

## 🤖 Supported Providers

| Provider | Free Tier | Models |
|----------|-----------|--------|
| **Groq** | ✅ Yes | llama-3.3-70b-versatile, llama-3.1-8b-instant, llama-4-scout, qwen3-32b, gemma2-9b |
| **Google Gemini** | ✅ Yes | gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro |
| **OpenAI** | ⚠ Paid | gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini |
| **Anthropic** | ⚠ Paid | claude-sonnet-4-6, claude-haiku-4-5, claude-opus-4-6 |
| **DeepSeek** | ✅ Low cost | deepseek-chat, deepseek-reasoner |
| **Mistral** | ✅ Free tier | mistral-small-latest, mistral-large-latest, codestral-latest |

---

## 📁 Project Structure

```
qa-ai-assistant/
├── backend/
│   ├── main.py              # FastAPI app — POST /agent, /providers, /health
│   ├── requirements.txt
│   ├── vercel.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Provider config, settings, theme
│   │   │   ├── ChatMessage.jsx      # Message bubble with markdown
│   │   │   ├── ChatInput.jsx        # Textarea, action tabs, send/stop
│   │   │   └── WelcomeScreen.jsx    # Landing capabilities grid
│   │   ├── hooks/
│   │   │   ├── useChat.js           # Message state, send, stream, abort
│   │   │   └── useProviders.js      # Fetch provider/model list from backend
│   │   ├── utils/
│   │   │   └── markdown.js          # Lightweight markdown renderer
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── vercel.json
├── docs/architecture/
│   └── overview.md
├── vercel.json
├── package.json
├── requirements.txt
├── run.sh
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (or any supported provider)

### Quick Start

```bash
# Clone
git clone <your-repo-url>
cd qa-ai-assistant

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your GROQ_API_KEY (or other provider keys)
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:8000
npm run dev
```

Or use the convenience script from the root:

```bash
chmod +x run.sh && ./run.sh
```

- Backend → http://localhost:8000
- Frontend → http://localhost:5173
- API Docs → http://localhost:8000/docs

---

## ☁️ Deploy to Vercel (Free)

### Step 1 — Get Free API Keys

| Provider | URL |
|----------|-----|
| Groq     | https://console.groq.com |
| Gemini   | https://aistudio.google.com |
| Mistral  | https://console.mistral.ai |

### Step 2 — Deploy Backend

```bash
cd backend
npx vercel login
npx vercel --prod
```

When prompted, set environment variables:
```
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
MISTRAL_API_KEY=...
```

Note your backend URL: `https://qa-backend-xxxx.vercel.app`

### Step 3 — Deploy Frontend

```bash
cd frontend
cp .env.example .env.production
# Set: VITE_API_URL=https://qa-backend-xxxx.vercel.app
npx vercel --prod
```

When prompted:
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

---

## 🔌 API Reference

### `POST /agent`

```json
{
  "question": "Generate Playwright tests for a login form",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "api_key": "gsk_...",
  "stream": false,
  "action": "chat",
  "temperature": 0.7,
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response (stream=false):**
```json
{
  "answer": "Here are the Playwright tests...",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

**Response (stream=true):** `text/event-stream` SSE
```
data: {"token": "Here"}
data: {"token": " are"}
...
```

### `GET /providers`

Returns all supported providers with their available models.

### `GET /health`

Returns `{ "status": "healthy" }`.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite 5, Vanilla CSS (no UI library)
- **Backend:** Python 3.11, FastAPI, httpx (async HTTP)
- **AI Providers:** Groq, Gemini, OpenAI, Anthropic, DeepSeek, Mistral
- **Web Search:** DuckDuckGo Instant Answer API (free, no key)
- **Hosting:** Vercel (free tier)

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> **Designed and developed by Arshad Shaik**
