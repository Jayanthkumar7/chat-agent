# TheTechX AI Chat Agent

Base scaffold for building an AI-powered chat agent for TheTechX.
This is a **Cohort 1 Assignment** — you build out the agent from this starting point.

## What You'll Build

An AI chat agent that:
- Answers questions about TheTechX using a knowledge base (Pinecone RAG)
- Searches the web for recent tech news and research (Tavily)
- Remembers conversations per user stored in Notion

## Project Structure

```
chat-agent/
├── frontend/          # Next.js 15 chat UI (TypeScript + Tailwind)
├── backend/           # Node.js agent + Express API
│   ├── src/
│   │   ├── agent/     # LangChain / LangGraph agent (you build this)
│   │   ├── tools/     # Tavily, Pinecone, Notion tools (you implement)
│   │   └── scripts/   # ingest.ts — vectorize knowledge base
│   └── data/
│       └── thetechx_knowledge.txt   # Fill this before ingesting
├── guide.md           # Step-by-step setup instructions
└── assignment.md      # Full project brief and requirements
```

## Quick Start

1. Read **`assignment.md`** — understand what you're building
2. Follow **`guide.md`** — get all API keys and set up the project
3. Start with **`backend/src/`** — the agent lives there

## Tech Stack

| Layer          | Technology                            |
|----------------|---------------------------------------|
| Frontend       | Next.js 15, TypeScript, Tailwind CSS  |
| Backend        | Node.js, TypeScript, Express          |
| LLM            | Google Gemini 1.5 Flash (free)        |
| Embeddings     | Google text-embedding-004 (free)      |
| Vector Store   | Pinecone                              |
| Web Search     | Tavily API                            |
| Memory         | Notion API                            |
| Agent Framework| LangChain / LangGraph (your choice)   |
