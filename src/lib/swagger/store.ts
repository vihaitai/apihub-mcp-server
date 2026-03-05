import {
  type ApiDetail,
  type ApiSummary,
  GetApiDetailInputSchema,
  type HttpMethod,
  ListApiInputSchema,
  SearchApisInputSchema
} from "../schema/api";
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
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh().catch((error) => {
        console.error("FETCH_ERROR: Failed to refresh swagger specs", error);
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
    const files = await this.loadLocalSpecs();
    this.projects = new Map(files.map((f) => [f.project, f]));
  }

  private async loadLocalSpecs(): Promise<ProjectSpec[]> {
    const specs = await loadAllSpecs();

    return specs.map((spec) => ({
      project: spec.project,
      details: indexSwagger(spec.content, spec.project),
      fetchedAt: new Date().toISOString(),
      specVersionHash: hashSpec(spec.content)
    }));
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
    let items = this.getDetailsByProject(input.project);

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

    let items = this.getDetailsByProject(input.project);
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
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.project.toLowerCase().includes(query)
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
    const items = this.getDetailsByProject(input.project);

    const found = input.operationId
      ? items.find((item) => item.operationId === input.operationId)
      : items.find(
          (item) =>
            item.method === (input.method as HttpMethod) &&
            item.path === input.path
        );

    if (!found) {
      throw new NotFoundError("NOT_FOUND: API definition not found.");
    }
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
