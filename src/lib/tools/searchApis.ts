import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchApisInputSchema, SearchApisOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerSearchApisTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "search_apis",
    {
      description: `Search APIs by keyword, tag, HTTP method, and project.

Input Schema:
- query (string, optional): Search keyword to filter APIs by operationId, path, summary, description, tags, or project name.
- project (string, optional): Filter by project name (e.g., 'AI客服系统API'). Get available projects from list_api response.
- tag (string, optional): Filter by API tag.
- method (enum, optional): Filter by HTTP method. Allowed values: GET, POST, PUT, PATCH, DELETE.
- limit (number, optional): Maximum number of results to return, range 1-100, default is 20.

Usage Tips:
1. Use 'query' for full-text search across operationId, path, summary, and description.
2. Combine 'query' with 'project' to search within a specific project.
3. Use 'tag' or 'method' to narrow down results further.`,
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
