/**
 * testToolRouting.ts
 *
 * Tests that the agent routes questions to the correct tool.
 * Verifies that:
 *  1. TheTechX-specific questions trigger pinecone_search
 *  2. Tech news / AI trend questions trigger tavily_search
 *  3. History recall questions trigger get_from_notion
 *
 * NOTE: This test calls the live LLM and live tools.
 *       Ensure all API keys are set in backend/.env before running.
 *       Pinecone must be populated via `npm run ingest` first.
 *
 * HOW TO RUN:
 *   cd backend
 *   npx tsx src/agent/testToolRouting.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { runAgent } from './index';
import { AgentState } from './state';

// A pre-authenticated state so we skip the user-info gate
const authenticatedState: Partial<AgentState> = {
  hasCollectedUserInfo: true,
  userName: 'TestUser',
  userMobile: '+919000000001',
  messages: [],
  sessionId: 'routing-test-session',
};

async function testToolRouting() {
  console.log('=== Test: Tool Routing ===\n');

  // ── Test 1: TheTechX question → should use pinecone_search ─────────────────
  console.log('[Test 1] Asking a TheTechX-specific question...');
  console.log('         (expect: pinecone_search is used in the response chain)');
  try {
    const result = await runAgent('What courses does TheTechX offer?', { ...authenticatedState });
    console.log('Response (first 300 chars):', result.response.slice(0, 300));
    console.log('✅ Test 1 completed — check that response mentions TheTechX content\n');
  } catch (err) {
    console.error('❌ Test 1 failed:', err);
  }

  // ── Test 2: Tech news question → should use tavily_search ──────────────────
  console.log('[Test 2] Asking a real-time tech question...');
  console.log('         (expect: tavily_search is used)');
  try {
    const result = await runAgent('What are the top AI tools trending right now?', { ...authenticatedState });
    console.log('Response (first 300 chars):', result.response.slice(0, 300));
    console.log('✅ Test 2 completed — check that response mentions current AI tools\n');
  } catch (err) {
    console.error('❌ Test 2 failed:', err);
  }

  // ── Test 3: History question → should use get_from_notion ──────────────────
  console.log('[Test 3] Asking about past conversation history...');
  console.log('         (expect: get_from_notion is called)');
  try {
    const result = await runAgent('What did we talk about before?', { ...authenticatedState });
    console.log('Response (first 300 chars):', result.response.slice(0, 300));
    console.log('✅ Test 3 completed — check that response references past messages or says no history found\n');
  } catch (err) {
    console.error('❌ Test 3 failed:', err);
  }

  console.log('=== Tool Routing Tests Complete ===');
}

testToolRouting().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
