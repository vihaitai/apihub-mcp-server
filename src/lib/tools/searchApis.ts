import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchApisInputSchema, SearchApisOutputSchema } from "../schema/api";
import { SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerSearchApisTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "search_apis",
    {
      description: `根据关键字、标签、HTTP 方法等条件搜索匹配的 API。

【功能边界】
✅ 能做什么：
- 根据关键字全文搜索 API（operationId、路径、摘要、描述等）
- 按项目名称搜索 API
- 按标签（tag）搜索 API
- 按 HTTP 方法搜索 API
- 限制返回结果数量（最多 100 条）

❌ 不能做什么：
- 不能分页浏览完整列表（请使用 list_api 工具）
- 不能查看 API 的详细参数定义（请使用 get_api_detail 工具）
- 不能按复杂条件组合搜索
- 搜索结果最多返回 100 条记录

【触发场景】
当用户说以下任一情况时，请使用此工具：
- "搜索包含 [关键词] 的 API 接口"
- "查找 [功能描述] 相关的接口"
- "搜索 [项目名] 中的 API"
- "找出所有 [标签] 类型的接口"
- "查找 [HTTP方法] 方式的接口"

【使用建议】
- 使用具体的功能词汇作为 query 关键字效果更好
- 可以结合 project 参数在特定项目中搜索
- 搜索结果较多时可使用 limit 参数限制数量`,
      inputSchema: SearchApisInputSchema.shape
    },
    async (args) => {
      const startTime = Date.now();
      logger.info("Tool", `search_apis 调用开始`, { args });

      try {
        const data = SearchApisOutputSchema.parse({
          ...store.getMeta(args.project),
          ...store.searchApis(args)
        });

        const duration = Date.now() - startTime;
        logger.info("Tool", `search_apis 调用完成`, { duration: `${duration}ms`, total: data.total });

        return asToolResult(data);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error("Tool", `search_apis 调用失败`, {
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
