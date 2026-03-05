import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { loadEnv } from "./config/env";
import { SwaggerStore } from "./swagger/store";

type McpSession = {
  transport: WebStandardStreamableHTTPServerTransport;
  server: McpServer;
};

const globalForApp = globalThis as unknown as {
  __swaggerStore?: SwaggerStore;
  __swaggerStorePromise?: Promise<SwaggerStore>;
  __mcpSessions?: Map<string, McpSession>;
};

export async function getSwaggerStore(): Promise<SwaggerStore> {
  if (globalForApp.__swaggerStore) {
    return globalForApp.__swaggerStore;
  }

  if (globalForApp.__swaggerStorePromise) {
    return globalForApp.__swaggerStorePromise;
  }

  globalForApp.__swaggerStorePromise = (async () => {
    const env = loadEnv();
    const store = new SwaggerStore({
      swaggerUrl: env.SWAGGER_URL,
      refreshIntervalMs: env.SWAGGER_REFRESH_INTERVAL_MS,
      requestTimeoutMs: env.SWAGGER_REQUEST_TIMEOUT_MS
    });
    await store.init();
    globalForApp.__swaggerStore = store;
    return store;
  })();

  return globalForApp.__swaggerStorePromise;
}

export function getMcpSessions(): Map<string, McpSession> {
  if (!globalForApp.__mcpSessions) {
    globalForApp.__mcpSessions = new Map();
  }
  return globalForApp.__mcpSessions;
}

export type { McpSession };
