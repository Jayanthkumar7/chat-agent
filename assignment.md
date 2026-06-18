# Assignment: Build the TheTechX AI Chat Agent

**Cohort 1 — Full-Stack AI Project**

---

## Overview

You are building a full-stack AI chat agent for TheTechX — a platform that helps learners grow in tech. The agent should be knowledgeable about TheTechX, stay current on tech trends, remember conversations, and deliver a clean chat experience.

This is not a tutorial you follow step-by-step. The base scaffold is set up — your job is to understand it, make decisions, and build the remaining pieces.

---

## What You're Building

```
┌─────────────────────────────────────────────┐
│           Next.js Chat Interface             │
│   User types a message → agent responds      │
└──────────────────┬──────────────────────────┘
                   │ HTTP POST /api/chat
┌──────────────────▼──────────────────────────┐
│         Node.js + LangChain Agent            │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Pinecone │ │  Tavily  │ │   Notion    │ │
│  │  Search  │ │  Search  │ │   Memory    │ │
│  │ (RAG)    │ │ (Web)    │ │  (History)  │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
└─────────────────────────────────────────────┘
```

### Three Agent Tools

| Tool              | When to Use                                              | API         |
|-------------------|----------------------------------------------------------|-------------|
| `pinecone_search` | Questions about TheTechX (courses, fees, cohorts, info) | Pinecone    |
| `tavily_search`   | Recent tech news, AI updates, career role research      | Tavily      |
| `save_to_notion`  | After every exchange — save the conversation            | Notion      |
| `get_from_notion` | When the same user returns — load their history         | Notion      |

---

## How the Agent Should Behave

### Collecting User Info (via conversation — not a form)

The agent must ask for the user's **name** and **mobile number** through natural conversation before answering other questions:

```
User:   Hi!
Agent:  Hello! I'm the TheTechX AI assistant. Before we get started,
        could I get your name and mobile number? This helps me save
        our conversation for you.
User:   I'm Arjun, 9876543210
Agent:  Nice to meet you, Arjun! How can I help you today?
User:   What courses does TheTechX offer?
Agent:  [uses pinecone_search → answers from knowledge base]
        [uses save_to_notion → saves exchange to Notion]
```

The agent should NOT answer other questions until it has both name and mobile number.

### Tool Routing Examples

| User Says                                          | Agent Should Use     |
|----------------------------------------------------|----------------------|
| "What is TheTechX?"                                | `pinecone_search`    |
| "How much does the cohort cost?"                   | `pinecone_search`    |
| "What are the top AI tools trending this week?"    | `tavily_search`      |
| "FDE roles are new — what is it, give me a roadmap"| `tavily_search`      |
| "What did we talk about last time?"                | `get_from_notion`    |

---

## LangChain vs LangGraph — Your Decision

You must choose one framework to build the agent. Research both and pick what fits.

### Option A: LangChain AgentExecutor

Simpler. Good if you want straightforward tool-calling without complex state management.

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";

const llm = new ChatGoogleGenerativeAI({ model: "gemini-1.5-flash" });
const agent = await createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools });
```

Docs: [https://js.langchain.com/docs/how_to/agent_executor](https://js.langchain.com/docs/how_to/agent_executor)

### Option B: LangGraph StateGraph

More powerful. Better for managing conversation state (like tracking whether name/mobile have been collected) and conditional routing between tools.

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("collect_info", collectUserInfo)
  .addNode("agent", callAgent)
  .addConditionalEdges("agent", routeToTool)
  ...
```

Docs: [https://langchain-ai.github.io/langgraphjs/](https://langchain-ai.github.io/langgraphjs/)

**Your deliverable:** In your `SUBMISSION.md`, write 1–2 paragraphs explaining which you chose and why. There is no wrong answer — the quality of your reasoning matters.

---

## Implementation Phases

### Phase 1: Setup

- [ ] Fork and clone the repository
- [ ] Follow `guide.md` to get all four API keys (Google, Pinecone, Tavily, Notion)
- [ ] Create `backend/.env` and `frontend/.env.local` from the examples
- [ ] Run `npm install` in both `backend/` and `frontend/`
- [ ] Verify the backend starts: `cd backend && npm run dev`
  - Visit `http://localhost:3001/health` — should return `{"status":"ok"}`
- [ ] Verify the frontend starts: `cd frontend && npm run dev`
  - Visit `http://localhost:3000` — should show the chat interface

---

### Phase 2: Knowledge Base Ingestion

**File:** `backend/src/scripts/ingest.ts`

- [ ] Fill `backend/data/thetechx_knowledge.txt` with TheTechX content (get this from your instructor)
- [ ] Implement the ingest script:
  1. Use `RecursiveCharacterTextSplitter` with `chunkSize: 1000, chunkOverlap: 200`
  2. Generate embeddings with `GoogleGenerativeAIEmbeddings` (`model: "text-embedding-004"`)
  3. Upload to Pinecone with `PineconeStore.fromDocuments`
- [ ] Run `npm run ingest` — verify it completes without errors
- [ ] Check your Pinecone dashboard — you should see vectors in the index

Helpful imports:
```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
```

---

### Phase 3: Implement the Tools

Each tool file has detailed comments explaining what to implement. Read them.

#### 3a. Pinecone Search — `backend/src/tools/pineconeSearch.ts`

- [ ] Initialize `Pinecone` client with `PINECONE_API_KEY`
- [ ] Connect to the existing index using `PineconeStore.fromExistingIndex`
- [ ] Run `vectorStore.similaritySearch(query, 4)` and return the matched chunks as a string
- [ ] Test: call the tool manually and verify it returns relevant TheTechX content

#### 3b. Tavily Search — `backend/src/tools/tavilySearch.ts`

- [ ] Import `TavilySearchResults` from `@langchain/community/tools/tavily_search`
- [ ] Initialize with `{ maxResults: 5 }`
- [ ] The `TAVILY_API_KEY` env var is automatically used — no need to pass it manually
- [ ] Test: search for "latest AI tools 2025" and verify results come back

#### 3c. Notion Memory — `backend/src/tools/notionMemory.ts`

- [ ] Initialize Notion `Client` with `NOTION_API_KEY`
- [ ] `saveToNotionTool`:
  - Query the database filtering by the `Mobile` column
  - If a record exists: append the new message to the `Conversation` JSON array
  - If no record: create a new row with Name, Mobile, and the first message
  - Update the `Last Updated` date property
- [ ] `getFromNotionTool`:
  - Query the database filtering by the `Mobile` column
  - Return the `Conversation` property as a parsed JSON array
  - Return a default message if no record is found
- [ ] Test: save a few messages, then retrieve them

Store conversation as a JSON array in the `Conversation` text property:
```json
[
  { "role": "user", "content": "Hi!", "time": "2025-01-01T10:00:00Z" },
  { "role": "assistant", "content": "Hello! ...", "time": "2025-01-01T10:00:01Z" }
]
```

---

### Phase 4: Build the Agent

**File:** `backend/src/agent/index.ts`

- [ ] Choose LangChain or LangGraph (see above)
- [ ] Initialize `ChatGoogleGenerativeAI` with `model: "gemini-1.5-flash"`
- [ ] Wire up all tools: `[pineconeSearchTool, tavilySearchTool, saveToNotionTool, getFromNotionTool]`
- [ ] Implement the `runAgent(message, state)` function so it:
  1. If `state.hasCollectedUserInfo === false`: asks for name and mobile
  2. Once collected: sets `state.userName`, `state.userMobile`, `state.hasCollectedUserInfo = true`
  3. Routes to the appropriate tool based on the question
  4. Saves every exchange to Notion
  5. Returns `{ response: string, state: AgentState }`

System prompt suggestion:
```
You are the TheTechX AI Assistant. You help users learn about TheTechX programs
and stay current on tech trends.

At the start of every new conversation, ask for the user's name and mobile number.
Do not answer other questions until you have both.

Use pinecone_search for TheTechX-specific questions.
Use tavily_search for recent news, trending topics, and career research.
Always save conversations to Notion after responding.
```

---

### Phase 5: Connect the Frontend

**File:** `backend/src/server.ts`

- [ ] Uncomment the `runAgent` import and usage in `server.ts`
- [ ] Test the full flow end-to-end:
  1. Open `http://localhost:3000`
  2. Type "Hi" — the agent should ask for your name and mobile
  3. Give your name and number — the agent should acknowledge
  4. Ask "What does TheTechX offer?" — should return info from Pinecone
  5. Ask "What are trending AI tools this week?" — should use Tavily
  6. Check your Notion database — the conversation should appear

---

## Evaluation Criteria

| Criteria                                                              | Points |
|-----------------------------------------------------------------------|--------|
| Knowledge base vectorized and `pinecone_search` returns relevant results | 20  |
| `tavily_search` works for tech news and research queries               | 20     |
| Notion correctly stores and retrieves conversations by mobile number   | 20     |
| Agent collects name + mobile through natural conversation              | 15     |
| Agent routes to the correct tool based on the query type               | 15     |
| Frontend chat UI works end-to-end                                      | 10     |
| **Total**                                                              | **100**|

---

## Bonus Challenges

These are not required but will earn extra credit:

- [ ] **Conversation continuity:** When the same mobile number starts a new session, the agent loads their history from Notion and references past conversations
- [ ] **Streaming responses:** Use Next.js streaming and LangChain streaming to show agent responses word-by-word instead of waiting for the full response
- [ ] **Better UI:** Markdown rendering for agent responses, typing indicator, message timestamps, mobile-responsive design
- [ ] **Deploy it:** Backend on Railway or Render, frontend on Vercel — share a live URL

---

## Submission Instructions

1. Push your completed code to your GitHub fork
2. Create a `SUBMISSION.md` file at the root with:
   - Your full name and mobile number (for demo — instructor will test with these)
   - Which framework you chose — **LangChain** or **LangGraph** — and 1–2 paragraphs explaining why
   - A screenshot or short screen recording of the working agent
   - Any challenges you hit and how you solved them
3. Share the GitHub repository link with your instructor

---

## Resources

| Resource | Link |
|----------|------|
| LangChain JS Docs | [https://js.langchain.com/docs/](https://js.langchain.com/docs/) |
| LangGraph JS Docs | [https://langchain-ai.github.io/langgraphjs/](https://langchain-ai.github.io/langgraphjs/) |
| LangChain Google GenAI | [https://js.langchain.com/docs/integrations/llms/google_genai](https://js.langchain.com/docs/integrations/llms/google_genai) |
| LangChain Pinecone | [https://js.langchain.com/docs/integrations/vectorstores/pinecone](https://js.langchain.com/docs/integrations/vectorstores/pinecone) |
| Tavily Tool | [https://js.langchain.com/docs/integrations/tools/tavily_search](https://js.langchain.com/docs/integrations/tools/tavily_search) |
| Notion API Docs | [https://developers.notion.com/docs/working-with-databases](https://developers.notion.com/docs/working-with-databases) |
| Notion JS SDK | [https://github.com/makenotion/notion-sdk-js](https://github.com/makenotion/notion-sdk-js) |
| Google AI Studio | [https://aistudio.google.com](https://aistudio.google.com) |
| Pinecone Dashboard | [https://app.pinecone.io](https://app.pinecone.io) |
