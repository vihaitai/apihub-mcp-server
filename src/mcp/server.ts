import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SwaggerStore } from "../swagger/store.js";
import { registerGetApiDetailTool } from "../tools/getApiDetail.js";
import { registerListApiTool } from "../tools/listApi.js";
import { registerSearchApisTool } from "../tools/searchApis.js";

export function createApiMcpServer(store: SwaggerStore): McpServer {
  const server = new McpServer(
    {
      name: "apihub-mcp-server",
      version: "1.0.0"
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerListApiTool(server, store);
  registerSearchApisTool(server, store);
  registerGetApiDetailTool(server, store);

  return server;
}
