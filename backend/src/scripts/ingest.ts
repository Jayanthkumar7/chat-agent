import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// ══════════════════════════════════════════════════════════════════
//  INGEST SCRIPT — YOUR TASK
// ══════════════════════════════════════════════════════════════════
//
//  This script reads thetechx_knowledge.txt, splits it into chunks,
//  generates embeddings using Gemini, and stores them in Pinecone.
//
//  Run this once (or whenever you update the knowledge base):
//    npm run ingest
//
//  Implementation steps:
//  1. Read backend/data/thetechx_knowledge.txt
//  2. Split into overlapping chunks with RecursiveCharacterTextSplitter
//     - chunkSize: 1000, chunkOverlap: 200
//  3. Generate embeddings with GoogleGenerativeAIEmbeddings
//     - model: 'text-embedding-004' (produces 768-dim vectors)
//  4. Upload to Pinecone with PineconeStore.fromDocuments
//
//  Docs:
//  - https://js.langchain.com/docs/integrations/vectorstores/pinecone
//  - https://js.langchain.com/docs/how_to/recursive_text_splitter
// ══════════════════════════════════════════════════════════════════

async function ingest() {
  const dataPath = path.join(__dirname, '../../data/thetechx_knowledge.txt');

  if (!fs.existsSync(dataPath)) {
    console.error('ERROR: thetechx_knowledge.txt not found at:', dataPath);
    process.exit(1);
  }

  const content = fs.readFileSync(dataPath, 'utf-8');

  if (content.includes('[PLACEHOLDER')) {
    console.error(
      'ERROR: thetechx_knowledge.txt is still a placeholder.\n' +
        'Fill it with TheTechX information before running ingest.'
    );
    process.exit(1);
  }

  console.log('Starting ingestion of thetechx_knowledge.txt ...');
  console.log(`File size: ${content.length} characters`);

  // TODO: Implement ingestion
  //
  // import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
  // import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
  // import { PineconeStore } from '@langchain/pinecone';
  // import { Pinecone } from '@pinecone-database/pinecone';
  // import { Document } from '@langchain/core/documents';
  //
  // const splitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 1000,
  //   chunkOverlap: 200,
  // });
  //
  // const docs = await splitter.createDocuments([content]);
  // console.log(`Split into ${docs.length} chunks`);
  //
  // const embeddings = new GoogleGenerativeAIEmbeddings({
  //   model: 'text-embedding-004',
  //   apiKey: process.env.GOOGLE_API_KEY!,
  // });
  //
  // const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  // const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  //
  // console.log('Uploading to Pinecone...');
  // await PineconeStore.fromDocuments(docs, embeddings, { pineconeIndex: index });
  // console.log('Ingestion complete!');

  throw new Error('Ingest script not implemented yet. See guide.md for instructions.');
}

ingest().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
