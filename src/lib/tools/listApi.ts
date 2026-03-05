import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListApiInputSchema, ListApiOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerListApiTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "list_api",
    {
      description: `分页列出 API 概览信息，支持按项目、标签、HTTP 方法等条件过滤。

【功能边界】
✅ 能做什么：
- 分页浏览所有可用的 API 列表
- 按项目名称过滤 API
- 按标签（tag）过滤 API
- 按 HTTP 方法（GET/POST/PUT/PATCH/DELETE）过滤 API
- 获取项目列表和基本信息

❌ 不能做什么：
- 不能查看 API 的详细参数定义（请使用 get_api_detail 工具）
- 不能进行关键字搜索（请使用 search_apis 工具）
- 不能获取完整的请求/响应体结构
- pageSize 最大限制为 200

【触发场景】
当用户说以下任一情况时，请使用此工具：
- "列出所有的 API 接口"
- "浏览 API 列表，每页显示 [数量]"
- "查看 [项目名] 下有哪些 API"
- "筛选出所有 GET/POST 方法的接口"
- "按标签 [tag] 查看相关 API"

【使用建议】
- 首次调用建议不带 project 参数，获取所有项目列表
- 然后指定具体 project 查看该项目下的 API
- 可结合 tag 或 method 参数进一步筛选`,
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
