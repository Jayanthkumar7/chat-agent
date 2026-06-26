# LangChain v1 Migration Task – TheTechX AI Chat Agent

You are a senior TypeScript + LangChain engineer.

Your task is to perform a COMPLETE migration of my backend from LangChain 0.3.x APIs to LangChain 1.x.

This is NOT a bug fix.
This is an architectural migration.

────────────────────────────────────────
PROJECT
────────────────────────────────────────

This is a production-ready AI chatbot backend for TheTechX.

Current features:

* Express backend
* Gemini 2.5 Flash
* Pinecone vector search
* Tavily search
* Notion conversation memory
* User information collection
* Conversation state
* Tool calling

The current project was originally built using:

* createToolCallingAgent
* AgentExecutor
* ChatPromptTemplate

Those APIs are now deprecated/removed.

I want a COMPLETE migration to LangChain 1.x.

DO NOT preserve deprecated APIs.

────────────────────────────────────────
GOAL
────────────────────────────────────────

Produce a clean LangChain 1.x implementation.

The project must compile.

The project must run.

The project must use current best practices.

────────────────────────────────────────
DEPENDENCIES
────────────────────────────────────────

Current versions:

* langchain 1.x
* @langchain/core 1.x
* @langchain/google-genai 2.x
* @langchain/langgraph 1.x
* @langchain/pinecone 1.x
* @pinecone-database/pinecone 5.x

Assume these versions are already installed.

Do NOT downgrade packages.

────────────────────────────────────────
FILES TO UPDATE
────────────────────────────────────────

Rewrite and update as necessary:

src/agent/index.ts
src/tools/pineconeSearch.ts
src/tools/notionMemory.ts
src/tools/tavilySearch.ts (only if required)
src/agent/testUserInfoGate.ts

Update any imports throughout the project.

────────────────────────────────────────
ARCHITECTURE
────────────────────────────────────────

The architecture MUST remain:

HTTP Request

↓

runAgent()

↓

User Info Extraction

↓

State Update

↓

LLM Agent

↓

Tool Calls

↓

Final Response

↓

Persist Conversation

↓

Return Updated State

Do NOT introduce unnecessary abstractions.

────────────────────────────────────────
USER INFO EXTRACTION
────────────────────────────────────────

Keep the current flow.

Use Gemini structured output.

Use Zod.

Schema:

{
name?: string
mobile?: string
}

Requirements:

Never hallucinate.

Never guess.

Only extract if explicitly present.

Normalize mobile numbers to:

+919876543210

Implement a proper normalizeIndianMobile() utility.

User info should accumulate across turns.

Example:

User:
Hi I'm Priya

State:

name = Priya
mobile = undefined

User:

9876543210

State:

name = Priya
mobile = +919876543210

Only when both exist should:

hasCollectedUserInfo = true

────────────────────────────────────────
STATE
────────────────────────────────────────

Keep my AgentState.

Improve it if necessary.

hasCollectedUserInfo should NOT become inconsistent.

Prefer deriving it from:

userName

userMobile

instead of manually toggling.

────────────────────────────────────────
AGENT
────────────────────────────────────────

Use LangChain 1.x createAgent().

DO NOT use:

createToolCallingAgent

AgentExecutor

ChatPromptTemplate

MessagesPlaceholder

Remove all deprecated APIs.

────────────────────────────────────────
SYSTEM PROMPT
────────────────────────────────────────

Keep my routing logic.

Improve wording where necessary.

The prompt should instruct the model:

TheTechX questions

→ Pinecone

Tech news

→ Tavily

Conversation history

→ Notion

DO NOT ask for name/mobile after they have been collected.

Do NOT use placeholders like:

{name}

{mobile}

Instead rely on the context message.

────────────────────────────────────────
TOOLS
────────────────────────────────────────

Pinecone

Update for:

@langchain/pinecone v1

Pinecone SDK v5

Return plain strings only.

Never return AIMessage.

Never return ToolMessage.

────────────────────────────────────────

Notion

Keep the same schema.

One row per message.

Columns:

Name

mobile

message

role

Do NOT duplicate saves.

If code already persists conversation, remove the instruction from the prompt that tells the LLM to save messages.

The application code should be responsible for persistence.

────────────────────────────────────────

Tavily

Leave unchanged unless migration requires changes.

────────────────────────────────────────
MESSAGE HISTORY
────────────────────────────────────────

Use proper LangChain v1 messages.

Avoid rebuilding messages manually where unnecessary.

Store assistant responses correctly.

────────────────────────────────────────
ERROR HANDLING
────────────────────────────────────────

If the extractor fails

Ask user again.

If tool execution fails

Gracefully recover.

If Pinecone fails

Return a friendly message.

Never crash.

────────────────────────────────────────
CODE QUALITY
────────────────────────────────────────

Strict TypeScript.

No "as any".

No unnecessary casts.

No dead code.

No duplicated logic.

No duplicated Gemini clients unless justified.

Prefer helper functions.

────────────────────────────────────────
REMOVE
────────────────────────────────────────

Remove:

ChatPromptTemplate

MessagesPlaceholder

createToolCallingAgent

AgentExecutor

executor.invoke

Prompt variable hacks

Duplicate Notion persistence

Debug console.logs

Temporary debugging code

Unused imports

────────────────────────────────────────
DELIVERABLE
────────────────────────────────────────

Provide COMPLETE rewritten files.

Not patches.

Not snippets.

Each file should be production ready.

Do not skip code.

Do not use placeholders like:

"...existing code..."

Every file should be complete.

After rewriting, verify:

✅ npm install succeeds

✅ npm run build succeeds

✅ testUserInfoGate passes

Explain every architectural change you make before presenting the rewritten files.
