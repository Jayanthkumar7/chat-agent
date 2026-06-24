# Notion Database Memory Integration Plan

This document outlines the detailed plan, tasks, commands, and tests required to implement the session-based conversation memory storage and retrieval in Notion for **TheTechX Chat Agent**.

---

## 1. Overview & Objectives

The goal is to implement two LangChain tools in [notionMemory.ts](file:///c:/Users/hyndh/OneDrive/Documents/jayanth_file/chat-agent/backend/src/tools/notionMemory.ts):
1. **`saveToNotionTool`**: Saves/appends conversation messages to a Notion database row mapped by the user's unique mobile number.
2. **`getFromNotionTool`**: Retrieves the stored conversation history JSON array for a returning user based on their mobile number.

---

## 2. Notion Database Schema Setup

Before running the tools, ensure your Notion database has the following properties:

| Property Name | Type       | Description                                                      |
| :------------ | :--------- | :--------------------------------------------------------------- |
| **Name**      | `title`    | Primary key (default column). Stores the user's name.            |
| **Mobile**    | `rich_text`| Unique identifier representing the user's mobile number.          |
| **Conversation**| `rich_text`| JSON string containing the array of message exchange objects.    |
| **Last Updated**| `date`    | Timestamp updated whenever a new message is saved.              |

*Note: Ensure your Notion integration is added as a connection to the database (in page settings).*

---

## 3. Implementation Details

We will update [notionMemory.ts](file:///c:/Users/hyndh/OneDrive/Documents/jayanth_file/chat-agent/backend/src/tools/notionMemory.ts) with the following TypeScript code:

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@notionhq/client';

// Helper to initialize Notion client safely
const getNotionClient = () => {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    throw new Error(
      'NOTION_API_KEY and NOTION_DATABASE_ID must be set in environmental variables.'
    );
  }

  return {
    notion: new Client({ auth: apiKey }),
    databaseId,
  };
};

interface MessageEntry {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const saveToNotionTool = tool(
  async ({
    name,
    mobile,
    message,
    role,
  }: {
    name: string;
    mobile: string;
    message: string;
    role: 'user' | 'assistant';
  }) => {
    const { notion, databaseId } = getNotionClient();

    // 1. Query the database to see if a record already exists for this mobile number
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Mobile',
        rich_text: {
          equals: mobile,
        },
      },
    });

    const newEntry: MessageEntry = {
      role,
      content: message,
      time: new Date().toISOString(),
    };

    if (response.results.length > 0) {
      // Record exists -> Append to existing conversation
      const page = response.results[0] as any;
      const conversationText = page.properties.Conversation?.rich_text?.[0]?.plain_text || '[]';
      
      let conversation: MessageEntry[] = [];
      try {
        conversation = JSON.parse(conversationText);
        if (!Array.isArray(conversation)) {
          conversation = [];
        }
      } catch (err) {
        conversation = [];
      }

      conversation.push(newEntry);

      // Update Notion Page
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Conversation: {
            rich_text: [
              {
                text: {
                  content: JSON.stringify(conversation),
                },
              },
            ],
          },
          'Last Updated': {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      });
      
      return `Successfully updated conversation history for ${name} (${mobile}).`;
    } else {
      // Record does not exist -> Create a new page entry
      const conversation = [newEntry];

      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: name,
                },
              },
            ],
          },
          Mobile: {
            rich_text: [
              {
                text: {
                  content: mobile,
                },
              },
            ],
          },
          Conversation: {
            rich_text: [
              {
                text: {
                  content: JSON.stringify(conversation),
                },
              },
            ],
          },
          'Last Updated': {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      });

      return `Successfully created new database entry for ${name} (${mobile}).`;
    }
  },
  {
    name: 'save_to_notion',
    description:
      'Save a conversation message to Notion. Call this after every user message and agent response.',
    schema: z.object({
      name: z.string().describe("The user's full name"),
      mobile: z.string().describe("The user's mobile number (used as unique ID)"),
      message: z.string().describe('The message content to save'),
      role: z
        .enum(['user', 'assistant'])
        .describe('Whether this is a user message or agent response'),
    }),
  }
);

export const getFromNotionTool = tool(
  async ({ mobile }: { mobile: string }) => {
    const { notion, databaseId } = getNotionClient();

    // Query database for matching mobile number
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Mobile',
        rich_text: {
          equals: mobile,
        },
      },
    });

    if (response.results.length === 0) {
      return 'No previous conversation found.';
    }

    const page = response.results[0] as any;
    const conversationText = page.properties.Conversation?.rich_text?.[0]?.plain_text || '[]';
    
    // Validate JSON structure
    try {
      const history = JSON.parse(conversationText);
      return JSON.stringify(history);
    } catch (err) {
      return '[]';
    }
  },
  {
    name: 'get_from_notion',
    description:
      'Retrieve past conversation history for a user from Notion using their mobile number.',
    schema: z.object({
      mobile: z.string().describe("The user's mobile number"),
    }),
  }
);
```

---

## 4. Execution Tasks Checklist

- [ ] **Step 1: Check Environment variables**
  Verify `backend/.env` contains your correct `NOTION_API_KEY` and `NOTION_DATABASE_ID`.
- [ ] **Step 2: Install dependencies**
  Ensure `@notionhq/client` is loaded (it is present in `package.json` but must be installed).
- [ ] **Step 3: Update Source Code**
  Replace the placeholder functions in [notionMemory.ts](file:///c:/Users/hyndh/OneDrive/Documents/jayanth_file/chat-agent/backend/src/tools/notionMemory.ts) with the implementation above.
- [ ] **Step 4: Create Verification Script**
  Add a script `backend/src/scripts/testNotion.ts` to test the tools in isolation.
- [ ] **Step 5: Run Verification Tests**
  Execute the test script and verify records are correctly generated and updated in Notion.

---

## 5. Commands to Run

From the `backend` folder:

### Install dependencies
```bash
npm install
```

### Run testing script in isolation
```bash
npx tsx src/scripts/testNotion.ts
```

### Run backend development server
```bash
npm run dev
```

---

## 6. Verification and Test Code

Create the test script at `backend/src/scripts/testNotion.ts` containing:

```typescript
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
```
