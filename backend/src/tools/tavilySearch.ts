import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dotenv from "dotenv";

dotenv.config();

// ══════════════════════════════════════════════════════════════════
//  TAVILY SEARCH TOOL
// ══════════════════════════════════════════════════════════════════
//
//  Use this tool when the user asks about:
//  - Recent tech or AI news ("what's trending in AI?")
//  - Time-sensitive topics ("latest releases this week")
//  - Career/role research ("what is FDE role, give roadmap")
//  - Anything that needs current, real-world information
//
// ══════════════════════════════════════════════════════════════════

export const tavilySearchTool = tool(
  async ({ query }: { query: string }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set.");
    }
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with status ${response.status}`);
      }

      interface TavilyResult {
        title: string;
        url: string;
        content: string;
        score: number;
      }

      interface TavilyResponse {
        results?: TavilyResult[];
      }

      const data = (await response.json()) as TavilyResponse;
      const results = data.results || [];
      return JSON.stringify(
        results.map((r) => ({ url: r.url, content: r.content })),
        null,
        2
      );
    } catch (err) {
      console.error("[Tavily] Search error:", err);
      return "Tavily search is temporarily unavailable. Proceeding without search results.";
    }
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

