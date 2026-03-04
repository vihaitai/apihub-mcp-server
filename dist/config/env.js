import { z } from "zod";
const EnvSchema = z.object({
    SWAGGER_URL: z.url().refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
        message: "SWAGGER_URL must start with http:// or https://"
    }),
    SWAGGER_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(300_000),
    SWAGGER_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    SSE_HOST: z.string().default("127.0.0.1"),
    SSE_PORT: z.coerce.number().int().positive().max(65535).default(3000)
});
export function loadEnv(source = process.env) {
    const parsed = EnvSchema.safeParse(source);
    if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
        throw new Error(`CONFIG_ERROR: Invalid environment configuration. ${details}`);
    }
    return parsed.data;
}
