import {
  type ApiDetail,
  type ApiSummary,
  GetApiDetailInputSchema,
  type HttpMethod,
  ListApiInputSchema,
  SearchApisInputSchema
} from "../schema/api";
import { logger } from "../utils/logger";
import { hashSpec, indexSwagger } from "./indexer";
import { loadAllSpecs } from "./specsLoader";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

type StoreConfig = {
  refreshIntervalMs: number;
};

type ProjectSpec = {
  project: string;
  details: ApiDetail[];
  fetchedAt: string;
  specVersionHash: string;
};

export class SwaggerStore {
  private readonly config: StoreConfig;
  private timer: NodeJS.Timeout | null = null;
  private projects: Map<string, ProjectSpec> = new Map();

  constructor(config: StoreConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    logger.info("Store", `初始化 Store，刷新间隔: ${this.config.refreshIntervalMs}ms`);
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh().catch((error) => {
        logger.error("Store", `定时刷新失败`, {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }, this.config.refreshIntervalMs);
    logger.info("Store", `Store 初始化完成`);
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("Store", `Store 已关闭`);
    }
  }

  async refresh(): Promise<void> {
    logger.info("Store", `开始刷新 Swagger 文档`);
    const startTime = Date.now();

    try {
      const files = await this.loadLocalSpecs();
      this.projects = new Map(files.map((f) => [f.project, f]));

      const duration = Date.now() - startTime;
      const totalApis = files.reduce((sum, f) => sum + f.details.length, 0);

      logger.info("Store", `刷新完成`, {
        duration: `${duration}ms`,
        projects: files.map((f) => f.project),
        totalProjects: files.length,
        totalApis
      });
    } catch (error) {
      logger.error("Store", `刷新失败`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async loadLocalSpecs(): Promise<ProjectSpec[]> {
    logger.debug("Store", `开始加载本地 specs`);
    const specs = await loadAllSpecs();
    logger.debug("Store", `加载到 ${specs.length} 个 spec 文件`);

    return specs.map((spec) => {
      logger.debug("Store", `解析项目`, { project: spec.project, title: spec.title });
      return {
        project: spec.project,
        details: indexSwagger(spec.content, spec.project),
        fetchedAt: new Date().toISOString(),
        specVersionHash: hashSpec(spec.content)
      };
    });
  }

  getProjects(): string[] {
    return Array.from(this.projects.keys());
  }

  private getAllDetails(): ApiDetail[] {
    return Array.from(this.projects.values()).flatMap((p) => p.details);
  }

  private getDetailsByProject(project?: string): ApiDetail[] {
    if (!project) {
      return this.getAllDetails();
    }
    const spec = this.projects.get(project);
    return spec ? spec.details : [];
  }

  listApi(inputRaw: unknown): {
    total: number;
    page: number;
    pageSize: number;
    items: ApiSummary[];
  } {
    const input = ListApiInputSchema.parse(inputRaw ?? {});
    logger.debug("Store", `listApi 调用`, { input });

    let items = this.getDetailsByProject(input.project);
    logger.debug("Store", `项目过滤前`, { project: input.project, count: items.length });

    if (input.tag) {
      items = items.filter((item) => item.tags.includes(input.tag as string));
      logger.debug("Store", `标签过滤后`, { tag: input.tag, count: items.length });
    }
    if (input.method) {
      items = items.filter((item) => item.method === input.method);
      logger.debug("Store", `方法过滤后`, { method: input.method, count: items.length });
    }

    const total = items.length;
    const offset = (input.page - 1) * input.pageSize;
    const paged = items.slice(offset, offset + input.pageSize).map(toSummary);

    logger.info("Store", `listApi 结果`, {
      total,
      page: input.page,
      pageSize: input.pageSize,
      returned: paged.length
    });

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      items: paged
    };
  }

  searchApis(inputRaw: unknown): { total: number; items: ApiSummary[] } {
    const input = SearchApisInputSchema.parse(inputRaw ?? {});
    logger.debug("Store", `searchApis 调用`, { input });

    const query = input.query?.trim().toLowerCase();
    let items = this.getDetailsByProject(input.project);
    logger.debug("Store", `项目过滤前`, { project: input.project, count: items.length });

    if (input.tag) {
      items = items.filter((item) => item.tags.includes(input.tag as string));
      logger.debug("Store", `标签过滤后`, { tag: input.tag, count: items.length });
    }
    if (input.method) {
      items = items.filter((item) => item.method === input.method);
      logger.debug("Store", `方法过滤后`, { method: input.method, count: items.length });
    }
    if (query) {
      const beforeCount = items.length;
      items = items.filter((item) => {
        return (
          item.operationId.toLowerCase().includes(query) ||
          item.path.toLowerCase().includes(query) ||
          (item.summary?.toLowerCase().includes(query) ?? false) ||
          (item.description?.toLowerCase().includes(query) ?? false) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.project.toLowerCase().includes(query)
        );
      });
      logger.debug("Store", `关键词过滤后`, { query, beforeCount, afterCount: items.length });
    }

    const result = items.slice(0, input.limit).map(toSummary);
    logger.info("Store", `searchApis 结果`, {
      total: items.length,
      limit: input.limit,
      returned: result.length
    });

    return {
      total: items.length,
      items: result
    };
  }

  getApiDetail(inputRaw: unknown): ApiDetail {
    const input = GetApiDetailInputSchema.parse(inputRaw ?? {});
    logger.debug("Store", `getApiDetail 调用`, { input });

    const items = this.getDetailsByProject(input.project);
    logger.debug("Store", `项目范围内搜索`, { project: input.project, count: items.length });

    const found = input.operationId
      ? items.find((item) => item.operationId === input.operationId)
      : items.find(
          (item) =>
            item.method === (input.method as HttpMethod) &&
            item.path === input.path
        );

    if (!found) {
      logger.warn("Store", `API 未找到`, {
        project: input.project,
        operationId: input.operationId,
        method: input.method,
        path: input.path
      });
      throw new NotFoundError("NOT_FOUND: API definition not found.");
    }

    logger.info("Store", `API 详情已返回`, {
      project: found.project,
      operationId: found.operationId,
      method: found.method,
      path: found.path
    });

    return found;
  }

  getMeta(project?: string): { projects: string[]; fetchedAt: string; specVersionHash: string } {
    if (project) {
      const spec = this.projects.get(project);
      return {
        projects: project ? [project] : this.getProjects(),
        fetchedAt: spec?.fetchedAt ?? new Date().toISOString(),
        specVersionHash: spec?.specVersionHash ?? ""
      };
    }

    // 合并所有项目的 hash
    const hashes = Array.from(this.projects.values())
      .map((p) => p.specVersionHash)
      .join("|");
    const latestFetched = Array.from(this.projects.values())
      .map((p) => p.fetchedAt)
      .sort()
      .pop() ?? new Date().toISOString();

    return {
      projects: this.getProjects(),
      fetchedAt: latestFetched,
      specVersionHash: hashSpec(hashes)
    };
  }
}

function toSummary(detail: ApiDetail): ApiSummary {
  return {
    operationId: detail.operationId,
    method: detail.method,
    path: detail.path,
    summary: detail.summary,
    description: detail.description,
    tags: detail.tags,
    project: detail.project
  };
}
