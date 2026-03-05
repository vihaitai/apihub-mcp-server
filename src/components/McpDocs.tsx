"use client";

import { useState } from "react";

const tools = [
  {
    name: "list_api",
    description: "分页列出 API 概览，支持按项目和标签过滤",
    params: [
      { name: "page", type: "number", required: false, desc: "页码，默认 1" },
      { name: "pageSize", type: "number", required: false, desc: "每页数量，默认 50" },
      { name: "tag", type: "string", required: false, desc: "按标签过滤" },
      { name: "method", type: "enum", required: false, desc: "HTTP 方法 (GET/POST/PUT/PATCH/DELETE)" },
      { name: "project", type: "string", required: false, desc: "项目名称，如 'openapi'" }
    ],
    example: `{
  "project": "openapi",
  "method": "GET",
  "page": 1,
  "pageSize": 20
}`
  },
  {
    name: "search_apis",
    description: "按关键词搜索 API，支持多条件组合",
    params: [
      { name: "query", type: "string", required: false, desc: "搜索关键词" },
      { name: "tag", type: "string", required: false, desc: "按标签过滤" },
      { name: "method", type: "enum", required: false, desc: "HTTP 方法" },
      { name: "project", type: "string", required: false, desc: "项目名称" },
      { name: "limit", type: "number", required: false, desc: "返回数量上限，默认 20" }
    ],
    example: `{
  "query": "user",
  "project": "user-service",
  "limit": 10
}`
  },
  {
    name: "get_api_detail",
    description: "获取 API 完整定义详情",
    params: [
      { name: "operationId", type: "string", required: false, desc: "API 的 operationId" },
      { name: "method", type: "enum", required: false, desc: "HTTP 方法（与 path 一起使用）" },
      { name: "path", type: "string", required: false, desc: "API 路径（与 method 一起使用）" },
      { name: "project", type: "string", required: false, desc: "项目名称" }
    ],
    example: `{
  "operationId": "getUser",
  "project": "user-service"
}

// 或使用 method + path
{
  "method": "GET",
  "path": "/users/{id}",
  "project": "user-service"
}`
  }
];

export default function McpDocs() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "1rem", color: "#333" }}>
        MCP 接入文档
      </h1>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#444" }}>
          服务地址
        </h2>
        <div style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "1rem", 
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 14
        }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>MCP Endpoint:</strong> <code>/api/mcp</code>
          </div>
          <div>
            <strong>Transport:</strong> HTTP Streamable
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#444" }}>
          可用项目
        </h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          将 Swagger/OpenAPI JSON 文件放入 <code>public/specs/</code> 目录，
          文件名（不含 .json）即为项目名称。
        </p>
        <div style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "1rem", 
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 14
        }}>
          public/specs/
          <br />
          ├── openapi.json → project: &quot;openapi&quot;
          <br />
          ├── user-service.json → project: &quot;user-service&quot;
          <br />
          └── order-api.json → project: &quot;order-api&quot;
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#444" }}>
          工具列表
        </h2>
        
        {tools.map((tool) => (
          <div 
            key={tool.name}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              marginBottom: "1rem",
              overflow: "hidden"
            }}
          >
            <button
              onClick={() => setActiveTool(activeTool === tool.name ? null : tool.name)}
              style={{
                width: "100%",
                padding: "1rem",
                textAlign: "left",
                backgroundColor: activeTool === tool.name ? "#e8f0fe" : "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "#1b6ec2" }}>
                  {tool.name}
                </div>
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {tool.description}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#999" }}>
                {activeTool === tool.name ? "▲" : "▼"}
              </span>
            </button>
            
            {activeTool === tool.name && (
              <div style={{ padding: "1rem", backgroundColor: "#fafafa" }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: "0.75rem" }}>
                  参数
                </h4>
                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                      <th style={{ textAlign: "left", padding: "8px" }}>参数</th>
                      <th style={{ textAlign: "left", padding: "8px" }}>类型</th>
                      <th style={{ textAlign: "left", padding: "8px" }}>必填</th>
                      <th style={{ textAlign: "left", padding: "8px" }}>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tool.params.map((param) => (
                      <tr key={param.name} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>{param.name}</td>
                        <td style={{ padding: "8px", color: "#666" }}>{param.type}</td>
                        <td style={{ padding: "8px", color: "#666" }}>
                          {param.required ? "是" : "否"}
                        </td>
                        <td style={{ padding: "8px", color: "#666" }}>{param.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: "1rem", marginBottom: "0.5rem" }}>
                  示例
                </h4>
                <pre style={{ 
                  backgroundColor: "#f5f5f5", 
                  padding: "1rem", 
                  borderRadius: 4,
                  overflow: "auto",
                  fontSize: 13
                }}>
                  <code>{tool.example}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #e0e0e0" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#444" }}>
          Cursor 配置示例
        </h2>
        <pre style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "1rem", 
          borderRadius: 8,
          overflow: "auto",
          fontSize: 13
        }}>
          <code>{`{
  "mcpServers": {
    "apihub": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}`}</code>
        </pre>
      </section>
    </div>
  );
}
