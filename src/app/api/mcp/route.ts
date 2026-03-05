import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createApiMcpServer } from "@/lib/mcp/server";
import { getSwaggerStore, getMcpSessions } from "@/lib/singleton";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleMcpRequest(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const method = req.method;
  const sessionId = req.headers.get("mcp-session-id");
  const sessions = getMcpSessions();

  logger.info("MCP", `收到请求`, {
    requestId,
    method,
    sessionId: sessionId ?? "none",
    userAgent: req.headers.get("user-agent") ?? "unknown"
  });

  // 现有会话
  if (sessionId && sessions.has(sessionId)) {
    logger.debug("MCP", `使用现有会话`, { requestId, sessionId });
    const session = sessions.get(sessionId)!;
    try {
      const response = await session.transport.handleRequest(req);
      logger.info("MCP", `请求处理完成`, { requestId, sessionId, status: response.status });
      return response;
    } catch (error) {
      logger.error("MCP", `请求处理失败`, {
        requestId,
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 会话不存在
  if (sessionId && !sessions.has(sessionId)) {
    logger.warn("MCP", `会话不存在`, { requestId, sessionId });
    return new Response("Session not found", { status: 404 });
  }

  // 创建新会话
  logger.info("MCP", `创建新会话`, { requestId });

  let store;
  try {
    store = await getSwaggerStore();
    logger.debug("MCP", `Store 初始化完成`, { requestId, projects: store.getProjects() });
  } catch (error) {
    logger.error("MCP", `Store 初始化失败`, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      logger.info("MCP", `会话初始化完成`, { requestId, newSessionId: id });
      sessions.set(id, { transport, server });
    },
    onsessionclosed: (id) => {
      logger.info("MCP", `会话关闭`, { requestId, sessionId: id });
      sessions.delete(id);
    }
  });

  const server = createApiMcpServer(store);

  transport.onclose = () => {
    if (transport.sessionId) {
      logger.debug("MCP", `Transport 关闭`, { requestId, sessionId: transport.sessionId });
      sessions.delete(transport.sessionId);
    }
  };

  try {
    await server.connect(transport);
    logger.info("MCP", `MCP 服务器连接成功`, { requestId });
  } catch (error) {
    logger.error("MCP", `MCP 服务器连接失败`, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }

  try {
    const response = await transport.handleRequest(req);
    logger.info("MCP", `请求处理完成`, { requestId, status: response.status });
    return response;
  } catch (error) {
    logger.error("MCP", `请求处理失败`, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
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
