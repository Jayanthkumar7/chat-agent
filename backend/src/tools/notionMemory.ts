import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@notionhq/client';

// ══════════════════════════════════════════════════════════════════
//  NOTION MEMORY TOOLS
// ══════════════════════════════════════════════════════════════════
//
//  Actual Notion Database Schema (as inspected):
//  ┌──────────────┬──────────────┬────────────────────────────────┐
//  │ Column       │ Type         │ Notes                          │
//  ├──────────────┼──────────────┼────────────────────────────────┤
//  │ Name         │ title        │ User's name                    │
//  │ mobile       │ phone_number │ Unique user identifier         │
//  │ message      │ rich_text    │ Single message content per row │
//  │ role         │ rich_text    │ "user" or "assistant"          │
//  └──────────────┴──────────────┴────────────────────────────────┘
//
//  Strategy: One row per message. Retrieval queries all rows for
//  a given mobile number and returns the full conversation history.
// ══════════════════════════════════════════════════════════════════

// Helper to initialize Notion client using native fetch (fixes node-fetch v2 stream bug on Node.js v24+)
const getNotionClient = () => {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    throw new Error(
      'NOTION_API_KEY and NOTION_DATABASE_ID must be set in environment variables.'
    );
  }

  return {
    notion: new Client({
      auth: apiKey,
      fetch: globalThis.fetch,
    }),
    databaseId,
  };
};

// ── Save Tool ──────────────────────────────────────────────────────────────────
// Creates one new row per message in the Notion database.

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

    // Each message is stored as a separate row
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // "Name" is the title column — store user's name
        Name: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        // "mobile" is a phone_number column
        mobile: {
          phone_number: mobile,
        },
        // "message" is a rich_text column — store message content
        message: {
          rich_text: [
            {
              text: {
                content: message,
              },
            },
          ],
        },
        // "role" is a rich_text column — store "user" or "assistant"
        role: {
          rich_text: [
            {
              text: {
                content: role,
              },
            },
          ],
        },
      },
    });

    return `Saved to Notion: [${role}] message for ${name} (${mobile})`;
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
  } as any
);

// ── Get Tool ───────────────────────────────────────────────────────────────────
// Retrieves all message rows for a given mobile number, returning conversation history.

export const getFromNotionTool = tool(
  async ({ mobile }: { mobile: string }) => {
    const { notion, databaseId } = getNotionClient();

    // Query all rows matching this mobile number
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'mobile',
        phone_number: {
          equals: mobile,
        },
      },
    });

    if (response.results.length === 0) {
      return 'No previous conversation found.';
    }

    // Map each row back to a message entry
    const history = response.results.map((page: any) => ({
      name: page.properties.Name?.title?.[0]?.plain_text || 'Unknown',
      role: page.properties.role?.rich_text?.[0]?.plain_text || 'unknown',
      content: page.properties.message?.rich_text?.[0]?.plain_text || '',
      time: page.created_time,
    }));

    // Sort chronologically by creation time
    history.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return JSON.stringify(history);
  },
  {
    name: 'get_from_notion',
    description:
      'Retrieve past conversation history for a user from Notion using their mobile number.',
    schema: z.object({
      mobile: z.string().describe("The user's mobile number"),
    }),
  } as any
);
