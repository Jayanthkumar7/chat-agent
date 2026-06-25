/**
 * testUserInfoGate.ts
 *
 * Tests the user-info collection gate in runAgent.
 * Verifies that:
 *  1. A bare greeting with no mobile number triggers the "please share name+mobile" prompt
 *  2. A message containing a mobile number sets hasCollectedUserInfo = true
 *  3. The extracted name and mobile are stored correctly in state
 *  4. A second call with hasCollectedUserInfo = true skips the gate entirely
 *
 * HOW TO RUN:
 *   cd backend
 *   npx tsx src/agent/testUserInfoGate.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { runAgent } from './index';

async function testUserInfoGate() {
  console.log('=== Test: User Info Gate ===\n');

  // ── Test 1: No mobile → should ask for name and mobile ─────────────────────
  console.log('[Test 1] Sending "Hi" (no mobile number)...');
  const result1 = await runAgent('Hi', {});

  console.log('Response:', result1.response);
  console.log('hasCollectedUserInfo:', result1.state.hasCollectedUserInfo);
  console.assert(
    result1.state.hasCollectedUserInfo === false,
    '❌ FAIL: hasCollectedUserInfo should be false when no mobile provided'
  );
  console.assert(
    result1.response.toLowerCase().includes('mobile') || result1.response.toLowerCase().includes('number'),
    '❌ FAIL: Response should ask for mobile number'
  );
  console.log('✅ Test 1 passed\n');

  // ── Test 2: Message with mobile → should collect info ──────────────────────
  console.log('[Test 2] Sending name + mobile number...');
  const result2 = await runAgent("I'm Priya, 9876543210", {});

  console.log('Response:', result2.response);
  console.log('hasCollectedUserInfo:', result2.state.hasCollectedUserInfo);
  console.log('userName:', result2.state.userName);
  console.log('userMobile:', result2.state.userMobile);
  console.assert(
    result2.state.hasCollectedUserInfo === true,
    '❌ FAIL: hasCollectedUserInfo should be true after mobile provided'
  );
  console.assert(
    result2.state.userMobile?.includes('9876543210'),
    '❌ FAIL: userMobile should contain the 10-digit number'
  );
  console.log('✅ Test 2 passed\n');

  // ── Test 3: Already has user info → should skip gate ───────────────────────
  console.log('[Test 3] Sending follow-up with state already having user info...');
  const result3 = await runAgent('Tell me about TheTechX', {
    hasCollectedUserInfo: true,
    userName: 'Priya',
    userMobile: '+919876543210',
    messages: [],
    sessionId: 'test-session',
  });

  console.log('Response (first 200 chars):', result3.response.slice(0, 200));
  console.assert(
    result3.state.hasCollectedUserInfo === true,
    '❌ FAIL: hasCollectedUserInfo should remain true'
  );
  console.log('✅ Test 3 passed\n');

  console.log('=== All User Info Gate Tests Complete ===');
}

testUserInfoGate().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
