import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Express } from "express";
import { SwaggerStore } from "../swagger/store.js";
import { createApiMcpServer } from "../mcp/server.js";

type ActiveSession = {
  transport: SSEServerTransport;
  server: McpServer;
};

type StartSseServerOptions = {
  host: string;
  port: number;
  store: SwaggerStore;
};

export async function startSseServer(options: StartSseServerOptions): Promise<{ close: () => Promise<void> }> {
  const app = createMcpExpressApp({ host: options.host });
  const sessions = new Map<string, ActiveSession>();

  registerHealthRoute(app, options.store);
  registerSseRoute(app, options.store, sessions);
  registerMessagesRoute(app, sessions);

  const httpServer = await new Promise<import("node:http").Server>((resolve, reject) => {
    const server = app.listen(options.port, options.host, () => resolve(server));
    server.on("error", reject);
  });

  return {
    close: async () => {
      for (const [sessionId, session] of sessions) {
        try {
          await session.transport.close();
          await session.server.close();
        } finally {
          sessions.delete(sessionId);
        }
      }

      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
}

function registerHealthRoute(app: Express, store: SwaggerStore): void {
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      ...store.getMeta()
    });
  });
}

function registerSseRoute(app: Express, store: SwaggerStore, sessions: Map<string, ActiveSession>): void {
  app.get("/sse", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    const server = createApiMcpServer(store);

    transport.onclose = () => {
      sessions.delete(transport.sessionId);
      void server.close().catch((error) => {
        console.error("SSE_ERROR: failed to close MCP server session", error);
      });
    };

    sessions.set(transport.sessionId, { transport, server });
    await server.connect(transport);
  });
}

function registerMessagesRoute(app: Express, sessions: Map<string, ActiveSession>): void {
  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    if (typeof sessionId !== "string") {
      res.status(400).send("VALIDATION_ERROR: query sessionId is required.");
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).send("NOT_FOUND: No active SSE session.");
      return;
    }

    await session.transport.handlePostMessage(req, res, req.body);
  });
}
