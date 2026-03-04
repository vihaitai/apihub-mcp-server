import { z } from "zod";
export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
export const ApiParameterSchema = z.object({
    name: z.string(),
    in: z.string(),
    required: z.boolean().default(false),
    description: z.string().optional(),
    schema: z.record(z.string(), z.unknown()).optional()
});
export const ApiRequestBodySchema = z.object({
    required: z.boolean().default(false),
    description: z.string().optional(),
    contentTypes: z.array(z.string()).default([])
});
export const ApiResponseSchema = z.object({
    statusCode: z.string(),
    description: z.string().optional(),
    contentTypes: z.array(z.string()).default([])
});
export const ApiSummarySchema = z.object({
    operationId: z.string(),
    method: HttpMethodSchema,
    path: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([])
});
export const ApiDetailSchema = ApiSummarySchema.extend({
    parameters: z.array(ApiParameterSchema).default([]),
    requestBody: ApiRequestBodySchema.optional(),
    responses: z.array(ApiResponseSchema).default([])
});
export const BaseMetadataSchema = z.object({
    sourceSwaggerUrl: z.string(),
    fetchedAt: z.string(),
    specVersionHash: z.string()
});
export const ListApiInputSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(200).default(50),
    tag: z.string().min(1).optional(),
    method: HttpMethodSchema.optional()
});
export const ListApiOutputSchema = BaseMetadataSchema.extend({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    items: z.array(ApiSummarySchema)
});
export const SearchApisInputSchema = z.object({
    query: z.string().min(1).optional(),
    tag: z.string().min(1).optional(),
    method: HttpMethodSchema.optional(),
    limit: z.number().int().positive().max(100).default(20)
});
export const SearchApisOutputSchema = BaseMetadataSchema.extend({
    total: z.number().int().nonnegative(),
    items: z.array(ApiSummarySchema)
});
export const GetApiDetailInputSchema = z
    .object({
    operationId: z.string().min(1).optional(),
    method: HttpMethodSchema.optional(),
    path: z.string().min(1).optional()
})
    .refine((value) => Boolean(value.operationId) || (Boolean(value.method) && Boolean(value.path)), "Provide operationId or method + path.");
export const GetApiDetailOutputSchema = BaseMetadataSchema.extend({
    item: ApiDetailSchema
});
