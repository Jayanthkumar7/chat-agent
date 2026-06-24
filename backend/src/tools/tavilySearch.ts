import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import dotenv from "dotenv";

dotenv.config();
// ══════════════════════════════════════════════════════════════════
//  TAVILY SEARCH TOOL — YOUR TASK
// ══════════════════════════════════════════════════════════════════
//
//  Use this tool when the user asks about:
//  - Recent tech or AI news ("what's trending in AI?")
//  - Time-sensitive topics ("latest releases this week")
//  - Career/role research ("what is FDE role, give roadmap")
//  - Anything that needs current, real-world information
//
//  Implementation steps:
//  1. Import TavilySearchResults from @langchain/community/tools/tavily_search
//  2. Initialize with { maxResults: 5 }
//  3. The TAVILY_API_KEY env var is picked up automatically
//  4. Call search.invoke(query) and return the results
//
//  Docs: https://js.langchain.com/docs/integrations/tools/tavily_search
//  API:  https://docs.tavily.com
// ══════════════════════════════════════════════════════════════════


const search = new TavilySearchResults({
  maxResults: 5,
});

export const tavilySearchTool = tool(
  async ({ query }) => {
    const results = await search.invoke(query);
    return JSON.stringify(results, null, 2);
  },
  {
    name: "tavily_search",
    description:
      "Search the web for recent tech news, AI updates, trending topics, career information, programming concepts, and other real-time information.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);
