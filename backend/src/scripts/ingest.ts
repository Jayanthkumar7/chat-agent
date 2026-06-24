import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

// -----------------------------------------------------------------------------
// Support __dirname in ES Modules
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// Ingest Script
//
// Reads backend/data/thetechx_knowledge.txt
// Splits into chunks
// Generates Gemini embeddings
// Uploads vectors into Pinecone
//
// Run:
// npx tsx src/scripts/ingest.ts
//
// OR
//
// npm run ingest
// -----------------------------------------------------------------------------

async function ingest() {
  try {
    // -------------------------------------------------------------------------
    // Validate environment variables
    // -------------------------------------------------------------------------
    const {
      GOOGLE_API_KEY,
      PINECONE_API_KEY,
      PINECONE_INDEX_NAME,
    } = process.env;

    if (!GOOGLE_API_KEY) {
      throw new Error("Missing GOOGLE_API_KEY in .env");
    }

    if (!PINECONE_API_KEY) {
      throw new Error("Missing PINECONE_API_KEY in .env");
    }

    if (!PINECONE_INDEX_NAME) {
      throw new Error("Missing PINECONE_INDEX_NAME in .env");
    }

    // -------------------------------------------------------------------------
    // Read knowledge file
    // -------------------------------------------------------------------------
    const dataPath = path.join(
      __dirname,
      "../../data/thetechx_knowledge.txt"
    );

    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `Knowledge file not found:\n${dataPath}`
      );
    }

    const content = fs.readFileSync(dataPath, "utf8");

    if (!content.trim()) {
      throw new Error("Knowledge file is empty.");
    }

    if (content.includes("[PLACEHOLDER")) {
      throw new Error(
        "thetechx_knowledge.txt still contains placeholder text."
      );
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Starting Knowledge Ingestion");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log(`Knowledge file: ${dataPath}`);
    console.log(`Characters: ${content.length}`);

    // -------------------------------------------------------------------------
    // Split into chunks
    // -------------------------------------------------------------------------
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments(
      [content],
      [
        {
          source: "thetechx_knowledge.txt",
        },
      ]
    );

    console.log(`Created ${docs.length} chunks`);

    // -------------------------------------------------------------------------
    // Embeddings
    // -------------------------------------------------------------------------
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GOOGLE_API_KEY,
      model: "gemini-embedding-001",
      dimensions: 512,
    });

    // -------------------------------------------------------------------------
    // Pinecone
    // -------------------------------------------------------------------------
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    const index = pinecone.index(PINECONE_INDEX_NAME);

    console.log("Uploading vectors to Pinecone...");

    await PineconeStore.fromDocuments(
      docs,
      embeddings,
      {
        pineconeIndex: index,
      }
    );

    console.log("");
    console.log("✅ Ingestion completed successfully!");
    console.log(`Uploaded ${docs.length} chunks.`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("\n❌ Ingestion Failed\n");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

ingest();