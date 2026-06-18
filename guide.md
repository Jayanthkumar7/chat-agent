# TheTechX Chat Agent — Setup Guide

Complete step-by-step instructions to get the project running locally.

---

## Prerequisites

Make sure you have the following installed:

| Tool    | Version  | Check with       |
|---------|----------|------------------|
| Node.js | >= 18    | `node -v`        |
| npm     | >= 9     | `npm -v`         |
| Git     | any      | `git --version`  |

---

## Project Structure Overview

```
chat-agent/
├── frontend/                        # Next.js 15 chat UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Entry page — renders ChatInterface
│   │   │   ├── layout.tsx           # Root layout
│   │   │   └── api/chat/route.ts    # Proxies requests to backend
│   │   ├── components/
│   │   │   └── ChatInterface.tsx    # Chat UI component (improve this!)
│   │   └── types/index.ts           # Shared TypeScript types
│   └── .env.local.example
│
├── backend/                         # Node.js agent + Express server
│   ├── src/
│   │   ├── server.ts                # Express HTTP server
│   │   ├── agent/
│   │   │   ├── index.ts             # Agent entry point (you build this)
│   │   │   └── state.ts             # AgentState type definition
│   │   ├── tools/
│   │   │   ├── tavilySearch.ts      # Web search tool (you implement)
│   │   │   ├── pineconeSearch.ts    # RAG search tool (you implement)
│   │   │   └── notionMemory.ts      # Notion save/get tools (you implement)
│   │   └── scripts/
│   │       └── ingest.ts            # Vectorize knowledge base (you implement)
│   └── data/
│       └── thetechx_knowledge.txt   # Fill this with TheTechX content
│
├── guide.md                         # This file
├── assignment.md                    # Project brief
└── README.md
```

---

## Step 1 — Fork & Clone the Repository

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/<your-username>/chat-agent.git
cd chat-agent
```

---

## Step 2 — Get Your API Keys

You need four API keys. Get all of them before continuing.

---

### 2.1 Google AI Studio — Gemini API Key

Used for: LLM (Gemini 1.5 Flash) + Embeddings (text-embedding-004)

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key — this is your `GOOGLE_API_KEY`

> Free tier limits: 15 requests/minute, 1 million tokens/minute. More than enough for development.

---

### 2.2 Pinecone — Vector Database

Used for: Storing and searching the TheTechX knowledge base

1. Go to [https://app.pinecone.io](https://app.pinecone.io) and sign up (free)
2. Once logged in, click **"Create Index"**
3. Fill in the form:
   - **Index name:** `thetechx-knowledge`
   - **Dimensions:** `768`  ← must be 768 for Gemini text-embedding-004
   - **Metric:** `cosine`
   - **Pod type:** Starter (free)
4. Click **"Create Index"**
5. Go to **"API Keys"** in the left sidebar
6. Copy your API Key — this is your `PINECONE_API_KEY`

> Your `PINECONE_INDEX_NAME` is `thetechx-knowledge` (what you named it above).

---

### 2.3 Tavily — Web Search API

Used for: Real-time web searches (tech news, career research)

1. Go to [https://app.tavily.com](https://app.tavily.com) and sign up (free)
2. After signing in, your API key is shown on the dashboard
3. Copy it — this is your `TAVILY_API_KEY`

> Free tier: 1,000 API calls/month.

---

### 2.4 Notion — Conversation Memory (Detailed)

Used for: Storing and retrieving conversations per user (by mobile number)

This has multiple steps — follow carefully.

#### Step A: Create a Notion Integration

1. Log in to [https://www.notion.so](https://www.notion.so)
2. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
3. Click **"+ New integration"**
4. Fill in:
   - **Name:** `TheTechX Chat Agent`
   - **Associated workspace:** select your workspace
5. Under **Capabilities**, make sure these are enabled:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
6. Click **"Submit"**
7. You'll see an **Internal Integration Token** starting with `secret_...`
8. Copy it — this is your `NOTION_API_KEY`

#### Step B: Create the Conversations Database

1. Open Notion and create a new page: click **"+ New page"** in the sidebar
2. Name the page: **Chat Conversations**
3. On the page, type `/` and select **"Table"** → **"Full page"**
4. A database is created with a default **Name** column

#### Step C: Configure Database Columns

Your database needs these exact columns:

| Column Name   | Property Type | Notes                                      |
|---------------|---------------|--------------------------------------------|
| Name          | Title         | Already exists (default) — keep as-is     |
| Mobile        | Text          | User's mobile number — used as unique ID  |
| Conversation  | Text          | Stores messages as a JSON string          |
| Last Updated  | Date          | Update this on every new message          |

To add a column: Click **"+ Add a property"** at the top right of the table

#### Step D: Connect the Integration to the Database

1. With the **Chat Conversations** database open, click the **"..."** (three dots) icon in the top-right corner of the page
2. Scroll down and click **"+ Add connections"**
3. Search for **"TheTechX Chat Agent"** (the name you gave your integration)
4. Click on it to connect

> Without this step, your code will get a "Could not find database" error.

#### Step E: Get the Database ID

1. With the database open, look at your browser's URL bar:
   ```
   https://www.notion.so/yourworkspace/Chat-Conversations-83d5dbb7aabbccdd1122334455667788?v=...
   ```
2. The **Database ID** is the 32-character string after the last `/` and before `?v=`:
   ```
   83d5dbb7aabbccdd1122334455667788
   ```
3. Copy it — this is your `NOTION_DATABASE_ID`

> Tip: The ID has no dashes in the URL but Notion's API accepts both formats.

---

## Step 3 — Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys:

```env
GOOGLE_API_KEY=AIza...your_key_here
PINECONE_API_KEY=pcsk_...your_key_here
PINECONE_INDEX_NAME=thetechx-knowledge
TAVILY_API_KEY=tvly-...your_key_here
NOTION_API_KEY=secret_...your_token_here
NOTION_DATABASE_ID=83d5dbb7...your_id_here
PORT=3001
```

```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local
```

The frontend `.env.local` only needs:
```env
BACKEND_URL=http://localhost:3001
```

---

## Step 4 — Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (create-next-app already did this, but run it to be sure)
cd ../frontend
npm install
```

---

## Step 5 — Fill the Knowledge Base & Run Ingest

> Do this **after** you implement `backend/src/scripts/ingest.ts`

1. Open `backend/data/thetechx_knowledge.txt`
2. Replace the placeholder text with actual TheTechX content
3. Once the ingest script is implemented, run:

```bash
cd backend
npm run ingest
```

You should see output like:
```
Starting ingestion of thetechx_knowledge.txt...
File size: 5243 characters
Split into 12 chunks
Uploading to Pinecone...
Ingestion complete!
```

---

## Step 6 — Start the Application

You need two terminals running at the same time.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
You should see:
```
TheTechX Chat Agent backend → http://localhost:3001
Health check → http://localhost:3001/health
```

Test it:
```bash
curl http://localhost:3001/health
# {"status":"ok","message":"TheTechX Chat Agent backend is running"}
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Open your browser at: [http://localhost:3000](http://localhost:3000)

You should see the chat interface with a greeting from the agent.

---

## Understanding the Codebase

### How a message flows through the system

```
User types message
    ↓
ChatInterface.tsx (frontend component)
    ↓ POST /api/chat
frontend/src/app/api/chat/route.ts (Next.js route)
    ↓ POST http://localhost:3001/api/chat
backend/src/server.ts (Express server)
    ↓ calls
backend/src/agent/index.ts → runAgent()
    ↓ decides which tool to use
    ├─→ pineconeSearchTool  (TheTechX questions)
    ├─→ tavilySearchTool    (tech news / research)
    └─→ saveToNotionTool    (after every response)
    ↓ returns response + updated state
backend → frontend → user sees response
```

### AgentState — what the backend remembers

Defined in `backend/src/agent/state.ts`:

```typescript
interface AgentState {
  messages: BaseMessage[];       // conversation history
  userName: string | null;       // set once collected
  userMobile: string | null;     // set once collected — used as Notion key
  sessionId: string;             // unique per browser session
  hasCollectedUserInfo: boolean; // gate before answering other questions
}
```

The state is returned with every response and passed back with every new request. This is how the backend knows whether it has already collected the user's name and mobile number.

---

## LangChain vs LangGraph — Understanding Your Options

Both are valid. Here is what each one is good for:

### LangChain AgentExecutor

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const llm = new ChatGoogleGenerativeAI({ model: "gemini-1.5-flash" });
const agent = await createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({ input: "What is TheTechX?" });
```

**Good for:** Simple tool-calling where each message is independent.  
**Limitation:** Less control over multi-step conversation flows like collecting name and mobile number.

### LangGraph StateGraph

```typescript
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldUseTool)
  .addEdge("tools", "agent");

const app = workflow.compile();
```

**Good for:** Stateful conversations, conditional routing, collecting user info before answering.  
**More setup:** You define nodes (steps) and edges (routing logic) explicitly.

**Recommendation:** LangGraph gives you more control for this use case. But if you're new to agents, start with AgentExecutor and upgrade if needed.

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@langchain/google-genai'` | Dependencies not installed | Run `npm install` in `backend/` |
| `GOOGLE_API_KEY is not set` | Missing env var | Check `backend/.env` exists and has the key |
| `Could not find database with ID` | Notion DB not connected to integration | Redo Step 2.4 → Step D |
| `Pinecone: index not found` | Wrong index name or not created | Check `PINECONE_INDEX_NAME` matches the name you created |
| `ECONNREFUSED 127.0.0.1:3001` | Backend not running | Start the backend: `cd backend && npm run dev` |
| `TavilySearchResults is not a constructor` | Wrong import path | Use `@langchain/community/tools/tavily_search` |
| `Dimension mismatch in Pinecone` | Wrong index dimensions | Pinecone index must be 768 dimensions for Gemini embeddings |
