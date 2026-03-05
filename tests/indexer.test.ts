import { describe, expect, it } from "vitest";
import { hashSpec, indexSwagger } from "../src/lib/swagger/indexer";

const spec = {
  swagger: "2.0",
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List users",
        tags: ["users"],
        parameters: [{ name: "page", in: "query", required: false, type: "integer" }],
        responses: {
          "200": { description: "ok" }
        }
      }
    },
    "/users/{id}": {
      get: {
        operationId: "getUser",
        summary: "Get user",
        tags: ["users"],
        responses: {
          "200": { description: "ok" },
          "404": { description: "not found" }
        }
      }
    }
  }
};

describe("indexSwagger", () => {
  it("flattens paths to api details", () => {
    const details = indexSwagger(spec);
    expect(details).toHaveLength(2);
    expect(details[0]?.operationId).toBe("listUsers");
    expect(details[0]?.method).toBe("GET");
  });

  it("generates stable hash", () => {
    const hash1 = hashSpec(spec);
    const hash2 = hashSpec(spec);
    expect(hash1).toBe(hash2);
  });
});
