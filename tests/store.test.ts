import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { NotFoundError, SwaggerStore } from "../src/lib/swagger/store";

const testSpec = {
  openapi: "3.0.0",
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List users",
        tags: ["users"],
        responses: { "200": { description: "ok" } }
      }
    },
    "/orders": {
      post: {
        operationId: "createOrder",
        summary: "Create order",
        tags: ["orders"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" }
            }
          }
        },
        responses: { "201": { description: "created" } }
      }
    }
  }
};

describe("SwaggerStore", () => {
  const testSpecsDir = join(process.cwd(), "public", "specs");

  beforeEach(async () => {
    // 创建测试用的 specs 目录和文件
    try {
      await mkdir(testSpecsDir, { recursive: true });
      await writeFile(
        join(testSpecsDir, "test-service.json"),
        JSON.stringify(testSpec)
      );
    } catch (error) {
      console.error("Failed to setup test specs:", error);
    }
  });

  afterEach(async () => {
    // 清理测试文件
    try {
      await rm(join(testSpecsDir, "test-service.json"), { force: true });
    } catch {
      // ignore
    }
  });

  it("supports list and search with project filter", async () => {
    const store = new SwaggerStore({
      refreshIntervalMs: 999_999
    });
    await store.init();

    // 按项目过滤 - 只获取测试项目的 API
    const listByProject = store.listApi({ page: 1, pageSize: 10, project: "test-service" });
    expect(listByProject.total).toBe(2);

    // 搜索
    const search = store.searchApis({ query: "order", limit: 10, project: "test-service" });
    expect(search.total).toBe(1);
    expect(search.items[0]?.operationId).toBe("createOrder");
    expect(search.items[0]?.project).toBe("test-service");

    // 搜索项目名称
    const searchByProject = store.searchApis({ query: "test-service", limit: 10 });
    expect(searchByProject.total).toBe(2);

    store.close();
  });

  it("gets detail and throws not found", async () => {
    const store = new SwaggerStore({
      refreshIntervalMs: 999_999
    });
    await store.init();

    const detail = store.getApiDetail({ operationId: "listUsers", project: "test-service" });
    expect(detail.path).toBe("/users");
    expect(detail.project).toBe("test-service");

    expect(() => store.getApiDetail({ operationId: "missing", project: "test-service" })).toThrow(NotFoundError);
    store.close();
  });

  it("returns empty when project not found", async () => {
    const store = new SwaggerStore({
      refreshIntervalMs: 999_999
    });
    await store.init();

    const list = store.listApi({ page: 1, pageSize: 10, project: "non-existent" });
    expect(list.total).toBe(0);

    store.close();
  });
});
