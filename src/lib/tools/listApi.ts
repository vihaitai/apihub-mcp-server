import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListApiInputSchema, ListApiOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerListApiTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "list_api",
    {
      description: "List API summaries with pagination and optional filters. Use 'project' to filter by project name (e.g., 'openapi', 'user-service').",
      inputSchema: ListApiInputSchema.shape
    },
    async (args) => {
      const startTime = Date.now();
      logger.info("Tool", `list_api 调用开始`, { args });

      try {
        const data = ListApiOutputSchema.parse({
          ...store.getMeta(args.project),
          ...store.listApi(args)
        });

        const duration = Date.now() - startTime;
        logger.info("Tool", `list_api 调用完成`, { duration: `${duration}ms`, total: data.total });

        return asToolResult(data);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error("Tool", `list_api 调用失败`, {
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
