import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/lib/config/env";

describe("loadEnv", () => {
  it("loads refresh interval with default value", () => {
    const env = loadEnv({
      SWAGGER_REFRESH_INTERVAL_MS: "1000",
      NODE_ENV: "test"
    } as NodeJS.ProcessEnv);

    expect(env.SWAGGER_REFRESH_INTERVAL_MS).toBe(1000);
  });

  it("uses default refresh interval when not provided", () => {
    const env = loadEnv({ NODE_ENV: "test" } as NodeJS.ProcessEnv);
    expect(env.SWAGGER_REFRESH_INTERVAL_MS).toBe(300_000);
  });

  it("throws config error when refresh interval is invalid", () => {
    expect(() => loadEnv({ SWAGGER_REFRESH_INTERVAL_MS: "invalid", NODE_ENV: "test" } as NodeJS.ProcessEnv)).toThrow("CONFIG_ERROR");
  });
});
