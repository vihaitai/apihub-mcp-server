import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchApisInputSchema, SearchApisOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";

export function registerSearchApisTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "search_apis",
    {
      description: "Search APIs by keyword, tag, and HTTP method.",
      inputSchema: SearchApisInputSchema.shape
    },
    async (args) => {
      const data = SearchApisOutputSchema.parse({
        ...store.getMeta(),
        ...store.searchApis(args)
      });

      return asToolResult(data);
    }
  );
}

function asToolResult(data: Record<string, unknown>): { content: [{ type: "text"; text: string }]; structuredContent: Record<string, unknown> } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}
