import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchApisInputSchema, SearchApisOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerSearchApisTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "search_apis",
    {
      description: "Search APIs by keyword, tag, HTTP method, and project. Use 'project' to search within a specific project (e.g., 'openapi', 'user-service').",
      inputSchema: SearchApisInputSchema.shape
    },
    async (args) => {
      const startTime = Date.now();
      logger.info("Tool", `search_apis 调用开始`, { args });

      try {
        const data = SearchApisOutputSchema.parse({
          ...store.getMeta(args.project),
          ...store.searchApis(args)
        });

        const duration = Date.now() - startTime;
        logger.info("Tool", `search_apis 调用完成`, { duration: `${duration}ms`, total: data.total });

        return asToolResult(data);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error("Tool", `search_apis 调用失败`, {
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}

function asToolResult(data: Record<string, unknown>): { content: [{ type: "text"; text: string }]; structuredContent: Record<string, unknown> } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}
