# apihub-mcp-server

一个基于 Swagger/OpenAPI 文档的 MCP API 查询服务。  
编程代理（Cursor / Claude Code 等）可以通过 MCP 工具查询 API 列表、搜索 API、获取 API 详情。

## 功能

- 通过环境变量 `SWAGGER_URL` 指向远程 `swagger.json`
- 三个 MCP tools：
  - `list_api`
  - `search_apis`
  - `get_api_detail`
- 所有工具输入/输出使用 Zod 模型
- SSE 访问模式：`/sse` + `/messages`

## 环境变量

- `SWAGGER_URL`（必填）：Swagger/OpenAPI JSON URL，仅支持 `http/https`
- `SWAGGER_REFRESH_INTERVAL_MS`（可选，默认 `300000`）
- `SWAGGER_REQUEST_TIMEOUT_MS`（可选，默认 `10000`）
- `SSE_HOST`（可选，默认 `127.0.0.1`）
- `SSE_PORT`（可选，默认 `3000`）

## 本地运行

```bash
pnpm install
SWAGGER_URL="https://example.com/swagger.json" pnpm dev
```

生产模式：

```bash
pnpm build
SWAGGER_URL="https://example.com/swagger.json" pnpm start
```

健康检查：

```bash
curl "http://127.0.0.1:3000/health"
```

## MCP 连接方式（SSE）

- SSE 入口：`http://127.0.0.1:3000/sse`
- 消息入口：`http://127.0.0.1:3000/messages?sessionId=...`

## Cursor 配置示例

以下为常见的 SSE 型 MCP 配置示例（具体字段名以你当前 Cursor 版本为准）：

```json
{
  "mcpServers": {
    "apihub": {
      "transport": {
        "type": "sse",
        "url": "http://127.0.0.1:3000/sse"
      }
    }
  }
}
```

## Claude Code 配置示例

同样使用 SSE URL 注册 MCP 服务（字段名可能随版本变化）：

```json
{
  "mcpServers": {
    "apihub": {
      "type": "sse",
      "url": "http://127.0.0.1:3000/sse"
    }
  }
}
```

## Tool 说明

### `list_api`

- 用途：分页列出 API 概览
- 输入：
  - `page?`、`pageSize?`
  - `tag?`
  - `method?` (`GET|POST|PUT|PATCH|DELETE`)

### `search_apis`

- 用途：按关键词/标签/方法检索 API
- 输入：
  - `query?`
  - `tag?`
  - `method?`
  - `limit?`（最大 100）

### `get_api_detail`

- 用途：获取完整 API 定义
- 输入：
  - `operationId`，或
  - `method + path`

## 测试

```bash
pnpm test
```
