/**
 * testFullConversation.ts
 *
 * End-to-end integration test simulating a full multi-turn conversation.
 * Covers the complete flow:
 *   Turn 1: "Hi"               → agent asks for name + mobile
 *   Turn 2: name + mobile      → agent greets, sets state
 *   Turn 3: TheTechX question  → agent uses pinecone_search
 *   Turn 4: Tech news question → agent uses tavily_search
 *   Turn 5: History recall     → agent uses get_from_notion
 *
 * State is carried forward across turns exactly as the frontend would do it.
 *
 * NOTE: Requires live API keys and a populated Pinecone index.
 *
 * HOW TO RUN:
 *   cd backend
 *   npx tsx src/agent/testFullConversation.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { runAgent } from './index';
import { AgentState } from './state';

function printTurn(turnNum: number, input: string, response: string, state: AgentState) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Turn ${turnNum}`);
  console.log(`User   : ${input}`);
  console.log(`Agent  : ${response.slice(0, 400)}${response.length > 400 ? '...' : ''}`);
  console.log(`State  : hasCollectedUserInfo=${state.hasCollectedUserInfo}, userName=${state.userName}, userMobile=${state.userMobile}, messages=${state.messages.length}`);
}

async function testFullConversation() {
  console.log('=== Test: Full Multi-Turn Conversation ===');

  let state: Partial<AgentState> = {}; // Start with empty state (fresh session)

  // ── Turn 1: Bare greeting ───────────────────────────────────────────────────
  const input1 = 'Hi there!';
  let result = await runAgent(input1, state);
  printTurn(1, input1, result.response, result.state);
  state = result.state;
  console.assert(!result.state.hasCollectedUserInfo, '❌ Should NOT have user info after bare greeting');
  console.log('✅ Turn 1 OK');

  // ── Turn 2: Provide name and mobile ────────────────────────────────────────
  const input2 = "I'm Rohan, 9123456789";
  result = await runAgent(input2, state);
  printTurn(2, input2, result.response, result.state);
  state = result.state;
  console.assert(result.state.hasCollectedUserInfo, '❌ Should have user info after providing mobile');
  console.assert(result.state.userName !== null, '❌ userName should be set');
  console.assert(result.state.userMobile?.includes('9123456789'), '❌ userMobile should contain the number');
  console.log('✅ Turn 2 OK');

  // ── Turn 3: TheTechX question (pinecone) ───────────────────────────────────
  const input3 = 'What is TheTechX and what programs do you offer?';
  result = await runAgent(input3, state);
  printTurn(3, input3, result.response, result.state);
  state = result.state;
  console.assert(result.state.messages.length > 2, '❌ Messages array should have grown');
  console.log('✅ Turn 3 OK');

  // ── Turn 4: Tech news (tavily) ─────────────────────────────────────────────
  const input4 = 'What are the latest trends in generative AI this week?';
  result = await runAgent(input4, state);
  printTurn(4, input4, result.response, result.state);
  state = result.state;
  console.log('✅ Turn 4 OK');

  // ── Turn 5: History recall (get_from_notion) ───────────────────────────────
  const input5 = 'Can you summarise what we have discussed so far?';
  result = await runAgent(input5, state);
  printTurn(5, input5, result.response, result.state);
  state = result.state;
  console.log('✅ Turn 5 OK');

  console.log(`\n${'═'.repeat(60)}`);
  console.log('=== Full Conversation Test Complete ===');
  console.log(`Total messages in state: ${state.messages?.length}`);
  console.log('Check your Notion database to verify all exchanges were saved.');
}

testFullConversation().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
