import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

describe("loadEnv", () => {
  it("loads required and optional envs", () => {
    const env = loadEnv({
      SWAGGER_URL: "https://example.com/swagger.json",
      SWAGGER_REFRESH_INTERVAL_MS: "1000",
      SWAGGER_REQUEST_TIMEOUT_MS: "2000",
      SSE_HOST: "0.0.0.0",
      SSE_PORT: "4000"
    });

    expect(env.SWAGGER_URL).toBe("https://example.com/swagger.json");
    expect(env.SWAGGER_REFRESH_INTERVAL_MS).toBe(1000);
    expect(env.SWAGGER_REQUEST_TIMEOUT_MS).toBe(2000);
    expect(env.SSE_HOST).toBe("0.0.0.0");
    expect(env.SSE_PORT).toBe(4000);
  });

  it("throws config error when SWAGGER_URL missing", () => {
    expect(() => loadEnv({})).toThrow("CONFIG_ERROR");
  });
});
