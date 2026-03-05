import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/lib/config/env";

describe("loadEnv", () => {
  it("loads required and optional envs", () => {
    const env = loadEnv({
      SWAGGER_URL: "https://example.com/swagger.json",
      SWAGGER_REFRESH_INTERVAL_MS: "1000",
      SWAGGER_REQUEST_TIMEOUT_MS: "2000"
    });

    expect(env.SWAGGER_URL).toBe("https://example.com/swagger.json");
    expect(env.SWAGGER_REFRESH_INTERVAL_MS).toBe(1000);
    expect(env.SWAGGER_REQUEST_TIMEOUT_MS).toBe(2000);
  });

  it("throws config error when SWAGGER_URL missing", () => {
    expect(() => loadEnv({})).toThrow("CONFIG_ERROR");
  });
});
