# apihub-mcp-server

一个基于 Swagger/OpenAPI 文档的 MCP API 查询服务。
编程代理（Cursor / Claude Code / Cline 等）可以通过 MCP 工具查询 API 列表、搜索 API、获取 API 详情。

## 功能特性

- **多项目管理**：支持同时加载多个 Swagger/OpenAPI 文档，按项目名称区分管理
- **自动刷新**：定时自动刷新 Swagger 文档，保持数据同步
- **三个 MCP 工具**：
  - `list_api` - 分页浏览 API 列表
  - `search_apis` - 关键词搜索 API
  - `get_api_detail` - 获取 API 完整详情
- **类型安全**：所有工具输入/输出使用 Zod 模型验证
- **Streamable HTTP 传输**：基于 MCP SDK 的 HTTP 流式传输协议

## 项目结构

```
public/specs/           # 放置 Swagger/OpenAPI JSON 文件
src/
  ├── app/api/mcp/      # MCP HTTP 端点
  ├── lib/
  │   ├── mcp/          # MCP 服务器实现
  │   ├── swagger/      # Swagger 文档加载与索引
  │   ├── tools/        # MCP 工具注册
  │   └── schema/       # Zod 数据模型
  └── components/       # Web UI 组件
```

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `SWAGGER_REFRESH_INTERVAL_MS` | 否 | `300000` | Swagger 文档自动刷新间隔（毫秒） |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 添加 Swagger 文档

将 Swagger/OpenAPI JSON 文件放入 `public/specs/` 目录：

```bash
# 示例
cp your-api-docs.json public/specs/my-api.json
```

支持多个文档，每个文档会以其 `info.title` 作为项目名称。

### 3. 本地开发

```bash
pnpm dev
```

服务默认运行在 `http://127.0.0.1:8006`

### 4. 生产部署

```bash
pnpm build
pnpm start
```

### 5. 健康检查

```bash
curl "http://127.0.0.1:8006/api/health"
```

## MCP 连接配置

### Cursor 配置

在 Cursor 设置中添加 MCP 服务器：

```json
{
  "mcpServers": {
    "apihub": {
      "url": "http://127.0.0.1:8006/api/mcp"
    }
  }
}
```

## MCP 工具详解

### `list_api`

分页列出 API 概览信息，支持按项目、标签、HTTP 方法过滤。

**输入参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 50 | 每页数量（50-200） |
| `project` | string | 否 | - | 项目名称过滤 |
| `tag` | string | 否 | - | 标签过滤 |
| `method` | enum | 否 | - | HTTP 方法过滤（GET/POST/PUT/PATCH/DELETE） |

**使用场景：**
- 列出所有 API 接口
- 浏览 API 列表，分页查看
- 查看特定项目下的 API
- 按标签或方法筛选接口

### `search_apis`

根据关键字、标签、HTTP 方法等条件搜索 API。

**输入参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 否 | - | 搜索关键词（匹配 operationId、路径、摘要、描述等） |
| `project` | string | 否 | - | 项目名称过滤 |
| `tag` | string | 否 | - | 标签过滤 |
| `method` | enum | 否 | - | HTTP 方法过滤 |
| `limit` | number | 否 | 20 | 返回结果数量限制（最大 100） |

**使用场景：**
- 搜索包含特定关键词的 API
- 查找功能相关的接口
- 在特定项目中搜索 API

### `get_api_detail`

获取指定 API 的完整定义详情，包括参数结构、请求体和响应体的完整 schema。

**输入参数（至少提供一种查找方式）：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `operationId` | string | 条件 | API 的 operationId（优先使用） |
| `method` | enum | 条件 | HTTP 方法 |
| `path` | string | 条件 | API 路径（需与 method 一起使用） |
| `project` | string | 否 | 项目名称过滤 |

**使用场景：**
- 查看具体 API 的详细参数定义
- 了解请求和响应格式
- 获取接口的完整文档

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET/POST/DELETE /api/mcp` | MCP 协议端点 |
| `GET /api/specs` | 获取所有 Swagger 文档列表 |

## 测试

```bash
pnpm test
```

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocol
- [Zod](https://zod.dev/) - 类型验证
- [Swagger UI React](https://github.com/swagger-api/swagger-ui) - API 文档可视化
- [Vitest](https://vitest.dev/) - 测试框架

## 许可证

ISC
