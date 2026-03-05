import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetApiDetailInputSchema, GetApiDetailOutputSchema } from "../schema/api";
import { NotFoundError, SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerGetApiDetailTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "get_api_detail",
    {
      description: `Get detailed API definition by operationId or method/path.

Input Schema (provide either operationId OR method+path):
- operationId (string, optional): The unique identifier of the API operation. Preferred way to get API details.
- method (enum, optional): HTTP method. Allowed values: GET, POST, PUT, PATCH, DELETE. Required if operationId is not provided.
- path (string, optional): API path (e.g., '/api/users'). Required if operationId is not provided.
- project (string, optional): Filter by project name (e.g., 'AI客服系统API'). Get available projects from list_api response.

Usage Tips:
1. Use 'operationId' for precise lookup when you know the exact operation identifier.
2. Use 'method' + 'path' when operationId is unknown.
3. Specify 'project' to narrow down the search scope and improve performance.`,
      inputSchema: GetApiDetailInputSchema.shape
    },
    async (args) => {
      const startTime = Date.now();
      logger.info("Tool", `get_api_detail 调用开始`, { args });

      try {
        const data = GetApiDetailOutputSchema.parse({
          ...store.getMeta(args.project),
          item: store.getApiDetail(args)
        });

        const duration = Date.now() - startTime;
        logger.info("Tool", `get_api_detail 调用完成`, {
          duration: `${duration}ms`,
          operationId: data.item.operationId,
          project: data.item.project
        });

        return asToolResult(data);
      } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof NotFoundError) {
          logger.warn("Tool", `get_api_detail API 未找到`, {
            duration: `${duration}ms`,
            args
          });
          return {
            content: [{ type: "text", text: error.message }],
            isError: true
          };
        }

        logger.error("Tool", `get_api_detail 调用失败`, {
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
