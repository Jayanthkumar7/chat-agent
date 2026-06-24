import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Client } from '@notionhq/client';

async function inspectDatabase() {
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
    fetch: globalThis.fetch,
  });

  const databaseId = process.env.NOTION_DATABASE_ID!;
  console.log('Fetching database schema for ID:', databaseId);

  const db = await notion.databases.retrieve({ database_id: databaseId });

  console.log('\n=== Database Properties ===');
  for (const [propName, propValue] of Object.entries(db.properties)) {
    console.log(`  - "${propName}" (type: ${(propValue as any).type})`);
  }
}

inspectDatabase().catch(console.error);
