import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createApiMcpServer } from "@/lib/mcp/server";
import { getSwaggerStore, getMcpSessions } from "@/lib/singleton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleMcpRequest(req: Request): Promise<Response> {
  const sessionId = req.headers.get("mcp-session-id");
  const sessions = getMcpSessions();

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    return session.transport.handleRequest(req);
  }

  if (sessionId && !sessions.has(sessionId)) {
    return new Response("Session not found", { status: 404 });
  }

  const store = await getSwaggerStore();

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, server });
    },
    onsessionclosed: (id) => {
      sessions.delete(id);
    }
  });

  const server = createApiMcpServer(store);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export async function POST(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}
