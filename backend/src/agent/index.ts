import dotenv from 'dotenv';
dotenv.config();

import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from "langchain";
import { HumanMessage, AIMessage } from '@langchain/core/messages';

import { AgentState, initialState } from './state';
import { saveToNotionTool, getFromNotionTool } from '../tools/notionMemory';
import { tavilySearchTool } from '../tools/tavilySearch';
import { pineconeSearchTool } from '../tools/pineconeSearch';
import { z } from "zod";


// ──────────────────────────────────────────────────────────────────────────────
// Step 0: Code to extract the name and the phone number
// ──────────────────────────────────────────────────────────────────────────────

const UserInfoSchema = z.object({
  name: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
});



function normalizeIndianMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return mobile;
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: Initialize LLM — created once at module level for performance
// ──────────────────────────────────────────────────────────────────────────────

const extractionLLM = new ChatOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  model: "mistralai/mistral-medium-3.5-128b",
  temperature: 0,
});

const agentLLM = new ChatOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  model: "mistralai/mistral-medium-3.5-128b",
  temperature: 0.70,
  topP: 1.00,
  maxTokens: 16384,
  modelKwargs: {
    reasoning_effort: "high",
  },
});

const userInfoExtractor = extractionLLM.withStructuredOutput(UserInfoSchema);

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: Tool list
// ──────────────────────────────────────────────────────────────────────────────

const tools = [
  pineconeSearchTool, // TheTechX knowledge base (courses, fees, cohorts)
  tavilySearchTool,   // Real-time tech news, AI trends, career research
  getFromNotionTool,  // Retrieve past conversation history
];

// ──────────────────────────────────────────────────────────────────────────────
// Step 4: System prompt
// ──────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the TheTechX AI Assistant — a friendly, knowledgeable guide for the TheTechX learning community.

CRITICAL RULE — User Identity:
- Every user message starts with a context block like:

  [USER: name=Priya, mobile=+919876543210]

- Read the name and mobile number from this context block.
- Use them whenever a tool requires them.
- Never ask the user for their name or mobile again once they have been collected..
- dont reply to the questions if prmompted other than tech news or thetechX related questions
- reply "I can only answer questions related to tech news or thetechX related questions" if the user asks any other question 

Tool Routing Rules (follow these strictly):
- If the user asks about TheTechX specifically (courses, fees, cohort details, programs, instructors, schedule) → call pinecone_search
- If the user asks about tech news, AI trends, career paths, programming concepts, or anything requiring real-time/current info → call tavily_search
- If the user asks "what did we talk about", "recall our conversation", "what was discussed earlier" or anything about past history → call get_from_notion first, then summarise the results

Tone & Behaviour:
- Be warm, encouraging, and concise
- When using tool results, synthesize them into a clear, helpful answer — do not dump raw tool output
- If you are unsure which tool to use, default to pinecone_search for TheTechX questions and tavily_search for everything reagarding any tech news else`;




// ──────────────────────────────────────────────────────────────────────────────
// Step 5: Build agent and executor — created once at module level
// ──────────────────────────────────────────────────────────────────────────────

const agent = createAgent({
  model: agentLLM,
  tools,
  systemPrompt: SYSTEM_PROMPT,
});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to extract a mobile number and name from a raw message string.
 * Supports formats: 10-digit numbers, +91 prefix, spaces between digits.
 * Returns null if no mobile number is detected.
 */

async function extractUserInfo(
  message: string
): Promise<z.infer<typeof UserInfoSchema>> {
  return await userInfoExtractor.invoke(`
Extract the user's name and Indian mobile number.

Rules:
- Return only structured data.
- Never invent information.
- Normalize Indian mobile numbers to +91XXXXXXXXXX.
- Ignore any text that is not the user's name or phone number.

User message:
${message}
`);
}




// ──────────────────────────────────────────────────────────────────────────────
// Step 6 + 7 + 8: runAgent — the main entry point called by server.ts
// ──────────────────────────────────────────────────────────────────────────────

export async function runAgent(
  message: string,
  state: Partial<AgentState>
): Promise<{ response: string; state: AgentState }> {

  // 6a. Merge incoming partial state with defaults
  const currentState: AgentState = {
    ...initialState(),
    ...state,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 6b. Gate: user info not yet collected
  // ──────────────────────────────────────────────────────────────────────────
  if (!currentState.hasCollectedUserInfo) {
    const extracted = await extractUserInfo(message);

    // Update state with anything extracted
    if (extracted.name) {
      currentState.userName = extracted.name;
    }

    if (extracted.mobile) {
      currentState.userMobile = normalizeIndianMobile(extracted.mobile);
    }

    // Determine whether we have all required info
    currentState.hasCollectedUserInfo =
      !!currentState.userName && !!currentState.userMobile;

    if (!currentState.hasCollectedUserInfo) {
      const missing = [];

      if (!currentState.userName) missing.push("name");
      if (!currentState.userMobile) missing.push("mobile number");

      return {
        response:
          `Hello! 👋 Before we get started, could you please share your ${missing.join(
            " and "
          )}?`,
        state: currentState,
      };
    }

    // Persist the first exchange to Notion (fire-and-forget, don't block the response)
    saveToNotionTool
      .invoke({ name: currentState.userName, mobile: currentState.userMobile, message, role: 'user' })
      .catch((err) => console.error('[Notion] Failed to save intro message:', err));

    const greeting =
      `Nice to meet you, **${currentState.userName}**! 🎉 ` +
      `I've saved your details so you won't need to enter them again this session.\n\n` +
      `I can help you with:\n` +
      `- 📚 Everything about **TheTechX** (courses, fees, cohorts, programs)\n` +
      `- 🌐 **Tech news** and AI trends\n` +
      `- 💼 **Career guidance** and role research\n\n` +
      `What would you like to explore today?`;

    // Save the greeting too
    saveToNotionTool
      .invoke({ name: currentState.userName, mobile: currentState.userMobile, message: greeting, role: 'assistant' })
      .catch((err) => console.error('[Notion] Failed to save greeting:', err));

    const updatedState: AgentState = {
      ...currentState,
      messages: [
        ...currentState.messages,
        new HumanMessage(message),
        new AIMessage(greeting),
      ],
    };

    return {
      response: greeting,
      state: updatedState,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6c–6f. User info is known — invoke the full agent
  // ──────────────────────────────────────────────────────────────────────────

  // Inject user context into the input so tools receive name/mobile automatically
  const contextualInput =
    `[USER: name=${currentState.userName}, mobile=${currentState.userMobile}]\n\n${message}`;

  let response: string;

  try {
    const result = await agent.invoke({
      messages: [
        ...currentState.messages,
        new HumanMessage(contextualInput),
      ],
    });

    console.dir(result, { depth: null });

    const lastMessage = result.messages.at(-1);

    response =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content);
  } catch (err) {
    console.error('[Agent] executor.invoke failed:', err);
    response = "I'm sorry, I ran into an issue processing your request. Please try again.";

    // Return early without saving a broken exchange
    return { response, state: currentState };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Safety-net — always persist the exchange to Notion
  // The agent's system prompt tells it to call save_to_notion automatically,
  // but we also do it explicitly here to guarantee it never gets skipped.
  // ──────────────────────────────────────────────────────────────────────────
  try {
    await saveToNotionTool.invoke({
      name: currentState.userName!,
      mobile: currentState.userMobile!,
      message,
      role: 'user',
    });
    await saveToNotionTool.invoke({
      name: currentState.userName!,
      mobile: currentState.userMobile!,
      message: response,
      role: 'assistant',
    });
  } catch (err) {
    // Non-fatal — log but don't fail the response
    console.error('[Notion] Failed to persist exchange:', err);
  }

  // 6e. Update message history
  const updatedState: AgentState = {
    ...currentState,
    messages: [
      ...currentState.messages,
      new HumanMessage(message),
      new AIMessage(response),
    ],
  };

  // 6f. Return response + updated state
  return { response, state: updatedState };
}
