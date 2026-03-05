import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetApiDetailInputSchema, GetApiDetailOutputSchema } from "../schema/api";
import { NotFoundError, SwaggerStore } from "../swagger/store";
import { logger } from "../utils/logger";

export function registerGetApiDetailTool(server: McpServer, store: SwaggerStore): void {
  server.registerTool(
    "get_api_detail",
    {
      description: `获取指定 API 的完整定义详情，包括参数结构、请求体和响应体的完整 schema 信息。

【功能边界】
✅ 能做什么：
- 根据 operationId 精确查找 API 详情
- 根据 method + path 组合查找 API 详情  
- 返回完整的参数定义，包括类型、描述、枚举等详细信息
- 支持按项目过滤查找

❌ 不能做什么：
- 不能模糊搜索 API（请使用 search_apis 工具）
- 不能分页浏览 API 列表（请使用 list_api 工具）
- 不能返回 API 调用示例或代码片段
- 当找不到匹配的 API 时会返回错误

【触发场景】
当用户说以下任一情况时，请使用此工具：
- "查看某个具体 API 的详细参数定义"
- "我想了解 [API名称] 的请求和响应格式"
- "获取 [operationId] 的完整接口文档"
- "需要知道某个接口的具体参数要求"

【使用建议】
- 优先使用 operationId 进行精确查找
- 如果不知道 operationId，可以使用 method + path 组合
- 可以指定 project 参数缩小搜索范围，提高效率`,
      inputSchema: GetApiDetailInputSchema.shape
    },
    async (args) => {
      const startTime = Date.now();
      logger.info("Tool", `get_api_detail 调用开始`, { args });

      try {
        const data = GetApiDetailOutputSchema.parse({
          ...store.getMeta(args.project),
          item: store.getApiDetail(args)
        });

        const duration = Date.now() - startTime;
        logger.info("Tool", `get_api_detail 调用完成`, {
          duration: `${duration}ms`,
          operationId: data.item.operationId,
          project: data.item.project
        });

        return asToolResult(data);
      } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof NotFoundError) {
          logger.warn("Tool", `get_api_detail API 未找到`, {
            duration: `${duration}ms`,
            args
          });
          return {
            content: [{ type: "text", text: error.message }],
            isError: true
          };
        }

        logger.error("Tool", `get_api_detail 调用失败`, {
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
