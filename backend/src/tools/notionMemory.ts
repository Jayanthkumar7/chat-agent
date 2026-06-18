import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════
//  NOTION MEMORY TOOLS — YOUR TASK
// ══════════════════════════════════════════════════════════════════
//
//  These two tools save and retrieve conversation history from Notion.
//  Each user is uniquely identified by their mobile number.
//
//  Notion Database Schema (set this up in Notion first — see guide.md):
//  ┌─────────────────┬─────────────┬──────────────────────────────────────────┐
//  │ Column          │ Type        │ Notes                                    │
//  ├─────────────────┼─────────────┼──────────────────────────────────────────┤
//  │ Name            │ Title       │ User's name (default title column)       │
//  │ Mobile          │ Text        │ Used as unique identifier                │
//  │ Conversation    │ Text        │ JSON array of { role, content, time }    │
//  │ Last Updated    │ Date        │ Updated on every new message             │
//  └─────────────────┴─────────────┴──────────────────────────────────────────┘
//
//  Implementation guide:
//  1. Import Client from @notionhq/client
//  2. Initialize: const notion = new Client({ auth: process.env.NOTION_API_KEY })
//  3. For saveToNotion:
//     a. Query the database filtering by Mobile === mobile
//     b. If a page exists → append the new message to Conversation (JSON)
//     c. If no page exists → create a new database entry
//  4. For getFromNotion:
//     a. Query the database filtering by Mobile === mobile
//     b. Return the Conversation property as parsed JSON
//
//  Docs: https://developers.notion.com/docs/working-with-databases
//  SDK:  https://github.com/makenotion/notion-sdk-js
// ══════════════════════════════════════════════════════════════════

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
    // TODO: Implement save to Notion
    //
    // const { Client } = require('@notionhq/client');
    // const notion = new Client({ auth: process.env.NOTION_API_KEY });
    //
    // Step 1: Check if a record already exists for this mobile
    // const response = await notion.databases.query({
    //   database_id: process.env.NOTION_DATABASE_ID!,
    //   filter: { property: 'Mobile', rich_text: { equals: mobile } },
    // });
    //
    // Step 2: Prepare the new message entry
    // const newEntry = { role, content: message, time: new Date().toISOString() };
    //
    // Step 3: If exists → update; if not → create
    // ...
    //
    // return 'Saved to Notion';

    throw new Error('saveToNotionTool not implemented yet.');
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
    // TODO: Implement get from Notion
    //
    // const { Client } = require('@notionhq/client');
    // const notion = new Client({ auth: process.env.NOTION_API_KEY });
    //
    // const response = await notion.databases.query({
    //   database_id: process.env.NOTION_DATABASE_ID!,
    //   filter: { property: 'Mobile', rich_text: { equals: mobile } },
    // });
    //
    // if (response.results.length === 0) return 'No previous conversation found.';
    //
    // const page = response.results[0] as any;
    // const conversationText = page.properties.Conversation.rich_text[0]?.plain_text || '[]';
    // const history = JSON.parse(conversationText);
    // return JSON.stringify(history);

    throw new Error('getFromNotionTool not implemented yet.');
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
