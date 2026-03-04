import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListApiInputSchema, ListApiOutputSchema } from "../schema/api.js";
import { SwaggerStore } from "../swagger/store.js";

export function registerListApiTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "list_api",
    {
      description: "List API summaries with pagination and optional filters.",
      inputSchema: ListApiInputSchema.shape
    },
    async (args) => {
      const data = ListApiOutputSchema.parse({
        ...store.getMeta(),
        ...store.listApi(args)
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
