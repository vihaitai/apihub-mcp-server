import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetApiDetailInputSchema, GetApiDetailOutputSchema } from "../schema/api";
import { NotFoundError, SwaggerStore } from "../swagger/store";

export function registerGetApiDetailTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "get_api_detail",
    {
      description: "Get detailed API definition by operationId or method/path. Use 'project' to specify which project to search in (e.g., 'openapi', 'user-service').",
      inputSchema: GetApiDetailInputSchema.shape
    },
    async (args) => {
      try {
        const data = GetApiDetailOutputSchema.parse({
          ...store.getMeta(args.project),
          item: store.getApiDetail(args)
        });
        return asToolResult(data);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return {
            content: [{ type: "text", text: error.message }],
            isError: true
          };
        }
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
