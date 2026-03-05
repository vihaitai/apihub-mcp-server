import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, SwaggerStore } from "../src/lib/swagger/store";

const spec = {
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
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => spec
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("supports list and search", async () => {
    const store = new SwaggerStore({
      swaggerUrl: "https://example.com/swagger.json",
      refreshIntervalMs: 999_999,
      requestTimeoutMs: 5_000
    });
    await store.init();

    const list = store.listApi({ page: 1, pageSize: 10 });
    expect(list.total).toBe(2);

    const search = store.searchApis({ query: "order", limit: 10 });
    expect(search.total).toBe(1);
    expect(search.items[0]?.operationId).toBe("createOrder");

    store.close();
  });

  it("gets detail and throws not found", async () => {
    const store = new SwaggerStore({
      swaggerUrl: "https://example.com/swagger.json",
      refreshIntervalMs: 999_999,
      requestTimeoutMs: 5_000
    });
    await store.init();

    const detail = store.getApiDetail({ operationId: "listUsers" });
    expect(detail.path).toBe("/users");

    expect(() => store.getApiDetail({ operationId: "missing" })).toThrow(NotFoundError);
    store.close();
  });
});
