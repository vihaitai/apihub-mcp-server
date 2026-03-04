import { loadEnv } from "./config/env.js";
import { SwaggerStore } from "./swagger/store.js";
import { startSseServer } from "./transport/sse.js";

// 
function parsePortFromArgs(defaultPort: number): number {
  // 支持两种形式：
  // 1) pnpm dev -- --port 4000
  // 2) pnpm dev -- --port=4000
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? "";
    if (arg === "--port" || arg === "-p") {
      const value = args[i + 1];
      const parsed = value ? Number.parseInt(value, 10) : NaN;
      if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
        return parsed;
      }
    } else if (arg.startsWith("--port=")) {
      const value = arg.split("=", 2)[1];
      const parsed = value ? Number.parseInt(value, 10) : NaN;
      if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
        return parsed;
      }
    }
  }
  return defaultPort;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const cliPort = parsePortFromArgs(env.SSE_PORT);
  const host = env.SSE_HOST;

  const store = new SwaggerStore({
    swaggerUrl: env.SWAGGER_URL,
    refreshIntervalMs: env.SWAGGER_REFRESH_INTERVAL_MS,
    requestTimeoutMs: env.SWAGGER_REQUEST_TIMEOUT_MS
  });

  await store.init();
  const sseServer = await startSseServer({
    host,
    port: cliPort,
    store
  });

  console.log(`MCP SSE server listening on http://${host}:${cliPort}/sse`);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down...`);
    await sseServer.close();
    store.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
