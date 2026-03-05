import { z } from "zod";

const EnvSchema = z.object({
  SWAGGER_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(300_000)
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`CONFIG_ERROR: Invalid environment configuration. ${details}`);
  }

  return parsed.data;
}
