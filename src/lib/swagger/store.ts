import {
  type ApiDetail,
  type ApiSummary,
  GetApiDetailInputSchema,
  type HttpMethod,
  ListApiInputSchema,
  SearchApisInputSchema
} from "../schema/api";
import { hashSpec, indexSwagger } from "./indexer";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

type StoreConfig = {
  swaggerUrl: string;
  refreshIntervalMs: number;
  requestTimeoutMs: number;
};

export class SwaggerStore {
  private readonly config: StoreConfig;
  private timer: NodeJS.Timeout | null = null;
  private details: ApiDetail[] = [];
  private fetchedAt = "";
  private specVersionHash = "";

  constructor(config: StoreConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh().catch((error) => {
        console.error("FETCH_ERROR: Failed to refresh swagger spec", error);
      });
    }, this.config.refreshIntervalMs);
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async refresh(): Promise<void> {
    const spec = await this.fetchSwaggerJson();
    this.details = indexSwagger(spec);
    this.fetchedAt = new Date().toISOString();
    this.specVersionHash = hashSpec(spec);
  }

  listApi(inputRaw: unknown): {
    total: number;
    page: number;
    pageSize: number;
    items: ApiSummary[];
  } {
    const input = ListApiInputSchema.parse(inputRaw ?? {});
    let items = this.details;

    if (input.tag) {
      items = items.filter((item) => item.tags.includes(input.tag as string));
    }
    if (input.method) {
      items = items.filter((item) => item.method === input.method);
    }

    const total = items.length;
    const offset = (input.page - 1) * input.pageSize;
    const paged = items.slice(offset, offset + input.pageSize).map(toSummary);

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      items: paged
    };
  }

  searchApis(inputRaw: unknown): { total: number; items: ApiSummary[] } {
    const input = SearchApisInputSchema.parse(inputRaw ?? {});
    const query = input.query?.trim().toLowerCase();

    let items = this.details;
    if (input.tag) {
      items = items.filter((item) => item.tags.includes(input.tag as string));
    }
    if (input.method) {
      items = items.filter((item) => item.method === input.method);
    }
    if (query) {
      items = items.filter((item) => {
        return (
          item.operationId.toLowerCase().includes(query) ||
          item.path.toLowerCase().includes(query) ||
          (item.summary?.toLowerCase().includes(query) ?? false) ||
          (item.description?.toLowerCase().includes(query) ?? false) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    return {
      total: items.length,
      items: items.slice(0, input.limit).map(toSummary)
    };
  }

  getApiDetail(inputRaw: unknown): ApiDetail {
    const input = GetApiDetailInputSchema.parse(inputRaw ?? {});
    const found =
      input.operationId
        ? this.details.find((item) => item.operationId === input.operationId)
        : this.details.find(
            (item) =>
              item.method === (input.method as HttpMethod) &&
              item.path === input.path
          );

    if (!found) {
      throw new NotFoundError("NOT_FOUND: API definition not found.");
    }
    return found;
  }

  getMeta(): { sourceSwaggerUrl: string; fetchedAt: string; specVersionHash: string } {
    return {
      sourceSwaggerUrl: this.config.swaggerUrl,
      fetchedAt: this.fetchedAt,
      specVersionHash: this.specVersionHash
    };
  }

  private async fetchSwaggerJson(): Promise<unknown> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(this.config.swaggerUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`FETCH_ERROR: Received ${response.status} from SWAGGER_URL`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toSummary(detail: ApiDetail): ApiSummary {
  return {
    operationId: detail.operationId,
    method: detail.method,
    path: detail.path,
    summary: detail.summary,
    description: detail.description,
    tags: detail.tags
  };
}
