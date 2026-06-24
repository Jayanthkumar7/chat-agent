import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from "dotenv";

dotenv.config();
// ══════════════════════════════════════════════════════════════════
//  PINECONE SEARCH TOOL — YOUR TASK
// ══════════════════════════════════════════════════════════════════
//
//  Use this tool when the user asks about TheTechX specifically:
//  - "What is TheTechX?"
//  - "What courses does TheTechX offer?"
//  - "How much does the cohort cost?"
//  - "Who are the instructors?"
//
//  Implementation steps:
//  1. Import Pinecone and PineconeStore from @langchain/pinecone
//  2. Import GoogleGenerativeAIEmbeddings from @langchain/google-genai
//  3. Initialize the embeddings model (model: 'text-embedding-004')
//  4. Connect to the existing Pinecone index
//  5. Run a similarity search with the query
//  6. Return the matched document chunks as a string
//
//  NOTE: You must run `npm run ingest` first to populate Pinecone.
//
//  Docs: https://js.langchain.com/docs/integrations/vectorstores/pinecone
// ══════════════════════════════════════════════════════════════════

export const pineconeSearchTool = tool(
  async ({ query }: { query: string }) => {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GOOGLE_API_KEY,
      model: "gemini-embedding-001",
    });

    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    const results = await vectorStore.similaritySearch(query, 4);
    return results.map((r) => r.pageContent).join('\n\n');

  },
  {
    name: 'pinecone_search',
    description:
      'Search the TheTechX knowledge base for information about TheTechX programs, courses, cohorts, fees, and details. Use this for TheTechX-specific questions.',
    schema: z.object({
      query: z.string().describe('The search query about TheTechX'),
    }),
  }
);
