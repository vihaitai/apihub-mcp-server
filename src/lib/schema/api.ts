import { z } from "zod";

export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export const ApiParameterSchema = z.object({
  name: z.string(),
  in: z.string(),
  required: z.boolean().default(false),
  description: z.string().optional(),
  schema: z.record(z.string(), z.unknown()).optional()
});

// 简化的 Schema 属性定义（避免复杂循环引用）
export const SimpleSchemaPropertySchema = z.object({
  type: z.string().optional(),
  format: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
  required: z.array(z.string()).optional(),
  nullable: z.boolean().optional()
});

// 内容 Schema 结构
export const ContentSchemaSchema = z.object({
  schema: z.record(z.string(), z.unknown()).optional() // 使用通用对象存储完整 schema
});

export const ApiRequestBodySchema = z.object({
  required: z.boolean().default(false),
  description: z.string().optional(),
  contentTypes: z.array(z.string()).default([]),
  content: z.record(z.string(), ContentSchemaSchema).optional() // 添加完整的 content 信息
});

export const ApiResponseSchema = z.object({
  statusCode: z.string(),
  description: z.string().optional(),
  contentTypes: z.array(z.string()).default([]),
  content: z.record(z.string(), ContentSchemaSchema).optional() // 添加完整的 content 信息
});

export const ApiSummarySchema = z.object({
  operationId: z.string(),
  method: HttpMethodSchema,
  path: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  project: z.string()
});

export const ApiDetailSchema = ApiSummarySchema.extend({
  parameters: z.array(ApiParameterSchema).default([]),
  requestBody: ApiRequestBodySchema.optional(),
  responses: z.array(ApiResponseSchema).default([])
});

export const BaseMetadataSchema = z.object({
  fetchedAt: z.string(),
  specVersionHash: z.string()
});

export const ListApiInputSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().max(200).default(50).transform((v) => (v < 1 ? 50 : v > 200 ? 200 : v)),
  tag: z.string().min(1).optional(),
  method: HttpMethodSchema.optional(),
  project: z.string().min(1).optional()
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
  project: z.string().min(1).optional(),
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
    path: z.string().min(1).optional(),
    project: z.string().min(1).optional()
  })
  .refine(
    (value) => Boolean(value.operationId) || (Boolean(value.method) && Boolean(value.path)),
    "Provide operationId or method + path."
  );

export const GetApiDetailOutputSchema = BaseMetadataSchema.extend({
  item: ApiDetailSchema
});

export type HttpMethod = z.infer<typeof HttpMethodSchema>;
export type ApiSummary = z.infer<typeof ApiSummarySchema>;
export type ApiDetail = z.infer<typeof ApiDetailSchema>;
