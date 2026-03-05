import { createHash } from "node:crypto";
import { ApiDetailSchema, type ApiDetail, type HttpMethod } from "../schema/api";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function parseRequestBody(operation: JsonRecord): ApiDetail["requestBody"] {
  const requestBody = asRecord(operation.requestBody);
  if (Object.keys(requestBody).length > 0) {
    const content = asRecord(requestBody.content);
    return {
      required: Boolean(requestBody.required),
      description: typeof requestBody.description === "string" ? requestBody.description : undefined,
      contentTypes: Object.keys(content)
    };
  }

  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  const bodyParam = parameters.find((item) => {
    const record = asRecord(item);
    return record.in === "body";
  });

  if (!bodyParam) {
    return undefined;
  }

  const record = asRecord(bodyParam);
  return {
    required: Boolean(record.required),
    description: typeof record.description === "string" ? record.description : undefined,
    contentTypes: ["application/json"]
  };
}

function parseResponses(operation: JsonRecord): ApiDetail["responses"] {
  const responses = asRecord(operation.responses);

  return Object.entries(responses).map(([statusCode, raw]) => {
    const record = asRecord(raw);
    const content = asRecord(record.content);
    return {
      statusCode,
      description: typeof record.description === "string" ? record.description : undefined,
      contentTypes: Object.keys(content)
    };
  });
}

function parseParameters(pathItem: JsonRecord, operation: JsonRecord): ApiDetail["parameters"] {
  const combined = [...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
  const seen = new Set<string>();

  return combined.flatMap((item) => {
    const record = asRecord(item);
    const name = typeof record.name === "string" ? record.name : "";
    const location = typeof record.in === "string" ? record.in : "";

    if (!name || !location) {
      return [];
    }

    const key = `${name}:${location}`;
    if (seen.has(key)) {
      return [];
    }
    seen.add(key);

    const schema = asRecord(record.schema);
    return [
      {
        name,
        in: location,
        required: Boolean(record.required),
        description: typeof record.description === "string" ? record.description : undefined,
        schema: Object.keys(schema).length > 0 ? schema : undefined
      }
    ];
  });
}

export function indexSwagger(spec: unknown): ApiDetail[] {
  const specRecord = asRecord(spec);
  const paths = asRecord(specRecord.paths);

  const details: ApiDetail[] = [];

  for (const [path, pathItemRaw] of Object.entries(paths)) {
    const pathItem = asRecord(pathItemRaw);

    for (const method of HTTP_METHODS) {
      const operation = asRecord(pathItem[method.toLowerCase()]);
      if (Object.keys(operation).length === 0) {
        continue;
      }

      const operationIdCandidate = operation.operationId;
      const operationId =
        typeof operationIdCandidate === "string" && operationIdCandidate.trim().length > 0
          ? operationIdCandidate
          : `${method}_${path}`.replace(/[^a-zA-Z0-9_]/g, "_");

      const raw = {
        operationId,
        method,
        path,
        summary: typeof operation.summary === "string" ? operation.summary : undefined,
        description: typeof operation.description === "string" ? operation.description : undefined,
        tags: toStringArray(operation.tags),
        parameters: parseParameters(pathItem, operation),
        requestBody: parseRequestBody(operation),
        responses: parseResponses(operation)
      };

      details.push(ApiDetailSchema.parse(raw));
    }
  }

  return details;
}

export function hashSpec(spec: unknown): string {
  const serialized = JSON.stringify(spec);
  return createHash("sha256").update(serialized).digest("hex");
}
