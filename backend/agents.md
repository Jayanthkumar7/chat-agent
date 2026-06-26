# TheTechX Chat Agent — Backend Architecture & File Reference

This document provides a comprehensive overview of the files and directories inside the [backend](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend) folder. It explains their roles, dependencies, and integration patterns within the system.

---

## Directory Overview

The backend is built with **TypeScript**, **Express**, **LangChain**, and **LangGraph**, using **Google Gemini** for LLM orchestration and embedding, **Pinecone** for vector search (RAG), and **Notion** for conversation memory.

Below is the directory structure:

```
backend/
├── .env                              # Environment variable configuration (API keys, ports)
├── package.json                      # Project dependencies and run/build scripts
├── tsconfig.json                     # TypeScript compiler configurations
├── agents.md                         # [THIS FILE] Architecture and file documentation
├── data/                             # Knowledge base sources used for Pinecone ingestion
│   ├── about.txt                     # High-level information about TheTechX
│   ├── cohort.txt                    # Details of learning cohorts and structure
│   ├── contact_faq.txt               # Frequently asked questions and contact channels
│   ├── services.txt                  # Description of services and career support
│   └── thetechx_knowledge.txt        # Combined knowledge document loaded into Pinecone
├── src/                              # Source code directory
│   ├── server.ts                     # Main Express API Server
│   ├── agent/                        # Core agent orchestration and testing
│   │   ├── index.ts                  # Main agent configuration and message runner
│   │   ├── state.ts                  # State interface and initial state values
│   │   ├── testFullConversation.ts   # Integration test for multi-turn conversations
│   │   ├── testToolRouting.ts        # Test for validating LLM tool routing behavior
│   │   └── testUserInfoGate.ts       # Test for checking name and mobile info collection gate
│   ├── scripts/                      # Setup and standalone verification scripts
│   │   ├── ingest.ts                 # Script to embed and upload data to Pinecone
│   │   ├── inspectNotion.ts          # Inspects Notion database columns & types
│   │   └── testNotion.ts             # Direct testing for Notion CRUD tools
│   └── tools/                        # Tools that the Agent can invoke
│       ├── notionMemory.ts           # Notion API wrappers to save & load history
│       ├── pineconeSearch.ts         # Query engine for Pinecone vector DB
│       └── tavilySearch.ts           # Web search agent tool powered by Tavily API
```

---

## Detailed File Descriptions

### Root Configuration Files
* **[.env](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/.env)**: Stores secrets and configuration variables including API keys for Google Gemini (`GOOGLE_API_KEY`), Pinecone (`PINECONE_API_KEY`), Notion (`NOTION_API_KEY`), and Tavily (`TAVILY_API_KEY`).
* **[package.json](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/package.json)**: Lists node dependencies and developer commands. Key commands include:
  * `npm run dev`: Runs the backend API server locally with hot-reloading using `tsx`.
  * `npm run ingest`: Runs the data-ingestion script to index knowledge source into Pinecone.
  * `npm run build`: Compiles TypeScript into JavaScript inside the `dist/` folder.
* **[tsconfig.json](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/tsconfig.json)**: TypeScript compiler settings configuring module output target (CommonJS), output directories, and modern strict checks.

---

### Data Sources (`data/`)
These raw text files contain the domain knowledge that is uploaded to Pinecone to provide contextual, grounded answers (Retrieval-Augmented Generation / RAG) regarding TheTechX.
* **[about.txt](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/data/about.txt)**: Basic overview, values, and vision of TheTechX.
* **[cohort.txt](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/data/cohort.txt)**: Timelines, pricing structures, curriculum, and structure for upcoming cohorts.
* **[contact_faq.txt](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/data/contact_faq.txt)**: Common questions and direct support contact info.
* **[services.txt](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/data/services.txt)**: Placements, mentorships, and additional learning services.
* **[thetechx_knowledge.txt](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/data/thetechx_knowledge.txt)**: The comprehensive consolidated document which is chunked and embedded.

---

### API Entry Point
* **[server.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/server.ts)**:
  An Express application defining:
  * `GET /health`: Basic service status check.
  * `POST /api/chat`: Processes chat messages by calling the LangGraph/LangChain agent pipeline via `runAgent` (defined in `src/agent/index.ts`). Accepts `message`, `sessionId`, and `agentState` in the request body, and returns the agent's text response along with the updated state object.

---

### Core Agent Logic (`src/agent/`)
* **[index.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/agent/index.ts)**:
  The orchestrator of the agent logic.
  * **User Info Gate**: Before allowing general queries, it checks if user's `name` and Indian `mobile` number are in the state. If missing, it uses structured output extraction with Gemini to parse them from the message. If still missing, it prompts the user to supply them.
  * **System Prompt & Tool Routing**: Once identification is complete, it runs the LangChain/LangGraph agent. The agent dynamically decides whether to query Pinecone for program specifics, Tavily for real-time web searches, or get past conversation history from Notion.
  * **State Integration**: Keeps track of message history.
* **[state.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/agent/state.ts)**:
  Defines the `AgentState` interface representing the current conversation state:
  * `messages`: Array of LangChain message objects (`HumanMessage`, `AIMessage`).
  * `userName`: User's extracted name.
  * `userMobile`: User's extracted mobile number (normalized to `+91XXXXXXXXXX`).
  * `sessionId`: Unique session ID.
  * `hasCollectedUserInfo`: Flag verifying if the identification gate has been completed.

---

### Standalone and Testing Scripts (`src/scripts/` & `src/agent/`)
* **[ingest.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/scripts/ingest.ts)**:
  Reads `thetechx_knowledge.txt`, splits the text into chunks of 1000 characters (200 overlap), calculates vector embeddings using `gemini-embedding-001`, and uploads them to the configured Pinecone index.
* **[inspectNotion.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/scripts/inspectNotion.ts)**:
  Queries the database metadata from Notion API to retrieve the exact property names and schema types (confirming: Title/Name, mobile/phone, message/rich_text, and role/rich_text).
* **[testNotion.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/scripts/testNotion.ts)**:
  Executes direct CRUD operations on the Notion DB via the saving and retrieval tools for sanity checks.
* **[testUserInfoGate.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/agent/testUserInfoGate.ts)**:
  Unit test validating that user identification is requested when unknown, successfully parsed when provided, and bypassed when already established in state.
* **[testToolRouting.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/agent/testToolRouting.ts)**:
  Validates that queries are correctly routed by the LLM: Pinecone for TheTechX information, Tavily for current technology news, and Notion for memory query commands.
* **[testFullConversation.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/agent/testFullConversation.ts)**:
  Simulates a complete, multi-turn dialogue from scratch (Bare greeting -> identification -> knowledge query -> search query -> conversation memory recall).

---

### Agent Tools (`src/tools/`)
* **[pineconeSearch.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/tools/pineconeSearch.ts)**:
  Defines `pineconeSearchTool`. Instantiates the `GoogleGenerativeAIEmbeddings` tool using `gemini-embedding-001` to generate query embeddings, and queries the Pinecone vector index for the top 4 most matching text segments.
* **[tavilySearch.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/tools/tavilySearch.ts)**:
  Defines `tavilySearchTool`. Issues a raw HTTP request to the Tavily search endpoint (`https://api.tavily.com/search`) and returns JSON strings containing the titles and snippets from search results.
* **[notionMemory.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/backend/src/tools/notionMemory.ts)**:
  Defines tools to store and fetch user conversation history:
  * `saveToNotionTool`: Appends a new page (row) with properties: `Name` (user name), `mobile` (phone), `message` (chat body), and `role` (`user` | `assistant`).
  * `getFromNotionTool`: Queries the database filtering by `mobile`, returning all previous chat items sorted chronologically.
