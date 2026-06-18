import { AgentState, initialState } from './state';

// ══════════════════════════════════════════════════════════════════
//  AGENT IMPLEMENTATION — YOUR TASK
// ══════════════════════════════════════════════════════════════════
//
//  Choose ONE framework and implement the agent:
//
//  OPTION A — LangChain AgentExecutor (simpler, stateless)
//  ─────────────────────────────────────────────────────
//  Good for: straightforward tool-calling
//  Docs: https://js.langchain.com/docs/how_to/agent_executor
//
//    import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
//    import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
//    import { ChatPromptTemplate } from '@langchain/core/prompts';
//
//  OPTION B — LangGraph (recommended for stateful conversations)
//  ─────────────────────────────────────────────────────────────
//  Good for: collecting name/mobile, conditional routing, memory
//  Docs: https://langchain-ai.github.io/langgraphjs/
//
//    import { StateGraph, START, END, MessagesAnnotation } from '@langchain/langgraph';
//    import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
//
//  See assignment.md → "LangChain vs LangGraph" for comparison.
//  Write a short explanation of your choice in SUBMISSION.md.
// ══════════════════════════════════════════════════════════════════
//
//  Your agent MUST:
//  1. On first message: ask for the user's name and mobile number
//  2. Once name + mobile are collected:
//     - Route TheTechX questions → pineconeSearchTool
//     - Route tech news / research queries → tavilySearchTool
//     - Save every exchange to Notion via notionMemory tools
//  3. Return { response: string, state: AgentState } on every call
//
// ══════════════════════════════════════════════════════════════════

export async function runAgent(
  message: string,
  state: Partial<AgentState>
): Promise<{ response: string; state: AgentState }> {
  const currentState: AgentState = {
    ...initialState(),
    ...state,
  };

  // TODO: Replace this placeholder with your agent implementation
  throw new Error(
    'Agent not implemented yet. See guide.md and assignment.md to get started.'
  );
}
