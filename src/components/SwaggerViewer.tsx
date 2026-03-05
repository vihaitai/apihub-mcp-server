"use client";

import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type SpecEntry = {
  filename: string;
  title: string;
  version: string;
  description: string;
  url: string;
};

export default function SwaggerViewer({ specs }: { specs: SpecEntry[] }) {
  const [selectedUrl, setSelectedUrl] = useState(specs[0]?.url ?? "");
  const [collapsed, setCollapsed] = useState(false);

  if (specs.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        No OpenAPI specs found. Place <code>.json</code> files in the{" "}
        <code>public/specs/</code> directory.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left sidebar */}
      <aside
        style={{
          width: collapsed ? 48 : 260,
          minWidth: collapsed ? 48 : 260,
          borderRight: "1px solid #e0e0e0",
          backgroundColor: "#f7f7f8",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s, min-width 0.2s",
          overflow: "hidden"
        }}
      >
        {/* Header with toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "12px 0" : "12px 16px",
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#fff",
            height: 48,
            boxSizing: "border-box"
          }}
        >
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 15, color: "#333", whiteSpace: "nowrap" }}>
              API Hub
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "展开菜单" : "折叠菜单"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#666",
              padding: "2px 6px",
              borderRadius: 4,
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Menu items */}
        {!collapsed && (
          <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {specs.map((spec) => {
              const isActive = spec.url === selectedUrl;
              return (
                <button
                  key={spec.filename}
                  onClick={() => setSelectedUrl(spec.url)}
                  title={spec.description || spec.title}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: 1.4,
                    color: isActive ? "#1b6ec2" : "#333",
                    backgroundColor: isActive ? "#e8f0fe" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? "3px solid #1b6ec2" : "3px solid transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "background-color 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "#eee";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {spec.title}
                </button>
              );
            })}
          </nav>
        )}
      </aside>

      {/* Right content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <SwaggerUI url={selectedUrl} />
      </div>
    </div>
  );
}
