import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { saveToNotionTool, getFromNotionTool } from '../tools/notionMemory';

async function testNotionIntegration() {
  console.log('--- Starting Notion Tools Test ---');
  
  const testMobile = '+919876543210';
  const testName = 'Arjun Dev';
  
  try {
    // 1. Test saveToNotionTool (New entry creation)
    console.log('\n[Test 1] Saving user message (First entry)...');
    const result1 = await saveToNotionTool.invoke({
      name: testName,
      mobile: testMobile,
      message: 'Hi, I want to learn about Full-Stack AI Cohort.',
      role: 'user'
    });
    console.log('Result 1:', result1);

    // 2. Test saveToNotionTool (Append message)
    console.log('\n[Test 2] Saving assistant response (Appending)...');
    const result2 = await saveToNotionTool.invoke({
      name: testName,
      mobile: testMobile,
      message: 'Hello Arjun! Our cohort covers frontend, backend, and agent architectures.',
      role: 'assistant'
    });
    console.log('Result 2:', result2);

    // 3. Test getFromNotionTool (Retrieve history)
    console.log('\n[Test 3] Retrieving conversation history...');
    const historyResult = await getFromNotionTool.invoke({
      mobile: testMobile
    });
    
    console.log('History retrieved:');
    console.log(JSON.stringify(JSON.parse(historyResult), null, 2));

    console.log('\n--- Notion Integration Test Completed Successfully ---');
  } catch (error) {
    console.error('\n❌ Test Failed:', error);
  }
}

testNotionIntegration();
