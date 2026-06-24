# Agent Build Plan — `backend/src/agent/index.ts`

## Overview

This document describes, in plain instructions, exactly how to build the `runAgent` function inside `backend/src/agent/index.ts`. The agent must greet new users, collect their name and mobile number, route questions to the right tool, persist every exchange to Notion, and return a response plus updated state on every call.

---

## Framework Choice: LangChain AgentExecutor

Use **LangChain AgentExecutor** (not LangGraph). Reason: the state management needed here (collecting name and mobile) is simple conditional logic that can live outside the LLM framework. We only need LangChain to handle tool calling and LLM prompting — not graph-based routing. This keeps the implementation straightforward and easier to debug.

---

## Step 1: Imports

Import the following at the top of the file:

- `ChatGoogleGenerativeAI` from `@langchain/google-genai` — this is the LLM (Gemini 1.5 Flash)
- `createToolCallingAgent` and `AgentExecutor` from `langchain/agents`
- `ChatPromptTemplate` and `MessagesPlaceholder` from `@langchain/core/prompts`
- `HumanMessage` and `AIMessage` from `@langchain/core/messages`
- `AgentState` and `initialState` from `./state`
- `saveToNotionTool` and `getFromNotionTool` from `../tools/notionMemory`
- `tavilySearchTool` from `../tools/tavilySearch`
- `pineconeSearchTool` from `../tools/pineconeSearch`
- `dotenv` — call `dotenv.config()` at the top so env variables are loaded

---

## Step 2: Initialize the LLM

Create a single `ChatGoogleGenerativeAI` instance outside `runAgent` so it is not re-created on every call.

- Model name: `"gemini-1.5-flash"`
- Read the API key from `process.env.GOOGLE_API_KEY`
- Temperature: `0` (for deterministic, factual responses)

---

## Step 3: Define the Tool List

Create a single array of all four tools in this order:

1. `pineconeSearchTool` — for TheTechX-specific knowledge base questions
2. `tavilySearchTool` — for real-time tech news, trending topics, career research
3. `saveToNotionTool` — for persisting every message exchange
4. `getFromNotionTool` — for retrieving past conversation history when the user asks

This array will be passed to the AgentExecutor.

---

## Step 4: Write the System Prompt

Create a `ChatPromptTemplate` using `fromMessages`. It must contain:

1. A **system message** (plain string) that instructs the agent:
   - It is the TheTechX AI Assistant
   - At the start of a new conversation, always ask for the user's name and mobile number before answering anything else
   - Do NOT answer any questions until both name and mobile are confirmed
   - Once user info is collected, route TheTechX questions to `pinecone_search` and tech/news/career questions to `tavily_search`
   - After every response, always call `save_to_notion` to persist the exchange
   - If the user asks "what did we talk about" or similar, call `get_from_notion` first
   - Speak in a friendly, helpful tone

2. A **MessagesPlaceholder** with variable name `"chat_history"` — this will hold prior messages in the conversation

3. A **HumanMessage placeholder** with variable name `"input"` — this holds the current user message

4. A **MessagesPlaceholder** with variable name `"agent_scratchpad"` — required by LangChain for the agent's internal reasoning steps

---

## Step 5: Build the Agent and Executor

Create the agent using `createToolCallingAgent`, passing:
- The LLM instance
- The tools array
- The prompt template from Step 4

Then wrap it in an `AgentExecutor`, passing:
- The agent
- The tools array
- Set `verbose` to `false` (or `true` during development for debugging)
- Set `handleParsingErrors` to `true` so the agent gracefully handles LLM output parsing failures

Create these two objects **outside** `runAgent` at module level so they are re-used across calls (important for performance).

---

## Step 6: Implement `runAgent`

The `runAgent` function signature already exists: it accepts `message: string` and `state: Partial<AgentState>` and must return `Promise<{ response: string; state: AgentState }>`.

Inside the function, follow these steps in order:

### 6a. Merge state
Merge the incoming partial state with `initialState()` to get the full current `AgentState`. This ensures missing fields always have defaults.

### 6b. Gate on user info collection
Check if `currentState.hasCollectedUserInfo` is `false`.

- If `false`: Do NOT invoke the full agent yet. Instead, check if the current `message` contains both a name and a mobile number.
  - Use a simple heuristic: detect if the message contains a 10-digit number (or a number starting with `+91`). If yes, extract the mobile and treat the rest as the name.
  - If the message does NOT contain a mobile number, return a fixed response asking for their name and mobile number. Do not call any tools. Return the unchanged state.
  - If the message DOES contain a mobile number, extract the name and mobile from the message, set `currentState.userName`, `currentState.userMobile`, and `currentState.hasCollectedUserInfo = true`. Then return a warm greeting that uses their name and asks how you can help.

### 6c. Invoke the agent
Once `hasCollectedUserInfo` is `true`, invoke the `AgentExecutor` by calling `executor.invoke(...)` with:
- `input`: the current user message
- `chat_history`: the `currentState.messages` array (the prior messages)
- Also pass the user's name and mobile in the system context if the prompt supports it (by injecting them into the system message or as additional variables)

### 6d. Extract the response
The `executor.invoke` result contains an `output` field. Use this as the `response` string.

### 6e. Update state messages
Append two new messages to `currentState.messages`:
- A `HumanMessage` wrapping the original user `message`
- An `AIMessage` wrapping the extracted `response`

### 6f. Return
Return the object `{ response, state: currentState }`.

---

## Step 7: Handle the `save_to_notion` Call

The agent will call `save_to_notion` on its own based on the system prompt instructions. However, to guarantee it always happens, after `executor.invoke` completes, explicitly call `saveToNotionTool.invoke(...)` for both the user message and the agent response if the agent did not already invoke it. This is a safety net.

Pass:
- `name`: `currentState.userName`
- `mobile`: `currentState.userMobile`
- `message`: the user message (role: `"user"`)
- `message`: the agent response (role: `"assistant"`)

Call it twice: once for the user message, once for the agent reply.

---

## Step 8: Error Handling

Wrap the `executor.invoke` call in a `try/catch`. If it throws:
- Log the error to `console.error`
- Return a fallback response: `"I'm sorry, I ran into an issue. Please try again."`
- Return the current state unchanged

---

## Step 9: Connect to the Server

In `backend/src/server.ts`, the `runAgent` import and usage are already commented out. Uncomment the following:
- The `import { runAgent } from './agent'` line
- The `try/catch` block inside the `/api/chat` route handler that calls `runAgent(message, agentState || {})`
- The `res.json(...)` call that returns `{ response: result.response, agentState: result.state }`

---

## Step 10: Test the Full Flow

After implementation, run the backend with `npm run dev` and test in order:

1. Send `"Hi"` → agent should ask for name and mobile
2. Send `"I'm Arjun, 9876543210"` → agent should greet Arjun and ask how it can help
3. Send `"What is TheTechX?"` → agent should call `pinecone_search` and answer from knowledge base
4. Send `"What are the top AI tools trending this week?"` → agent should call `tavily_search`
5. Send `"What did we talk about last time?"` → agent should call `get_from_notion` and summarize history
6. Open the Notion database → verify rows exist for all messages saved

---

## Key Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| Framework | LangChain AgentExecutor | Simpler; state collection handled in plain logic |
| LLM | Gemini 1.5 Flash | Specified in assignment, fast and free tier |
| User info gate | Manual check in `runAgent` | Cleaner than adding a LangGraph node for it |
| Message persistence | Agent-driven + safety net | Prompt tells agent to call save_to_notion; fallback explicit call ensures it always runs |
| State shape | Use existing `AgentState` from `state.ts` | Already defined with `userName`, `userMobile`, `hasCollectedUserInfo`, `messages` |
| Tool order | pinecone → tavily → save → get | pinecone first as it's the most commonly needed; get is least common |

---

## Files to Touch

| File | Action |
|---|---|
| `backend/src/agent/index.ts` | Full implementation — replace the placeholder `throw` |
| `backend/src/server.ts` | Uncomment the `runAgent` import and usage |
| No other files need changes | All tools are already implemented and working |
