import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export type SpecInfo = {
  filename: string;
  project: string;
  title: string;
  version: string;
  description: string;
  url: string;
  content: unknown;
};

const SPECS_DIR = join(process.cwd(), "public", "specs");

export async function loadSpecsList(): Promise<
  Array<{
    filename: string;
    title: string;
    version: string;
    description: string;
    url: string;
  }>
> {
  let files: string[];
  try {
    files = await readdir(SPECS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const specs = [];

  for (const filename of jsonFiles) {
    try {
      const content = await readFile(join(SPECS_DIR, filename), "utf-8");
      const parsed = JSON.parse(content);
      const info = parsed?.info ?? {};
      specs.push({
        filename,
        title: typeof info.title === "string" ? info.title : filename,
        version: typeof info.version === "string" ? info.version : "",
        description: typeof info.description === "string" ? info.description : "",
        url: `/specs/${filename}`
      });
    } catch {
      // skip invalid files
    }
  }

  return specs;
}

export async function loadAllSpecs(): Promise<SpecInfo[]> {
  let files: string[];
  try {
    files = await readdir(SPECS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const specs: SpecInfo[] = [];

  for (const filename of jsonFiles) {
    try {
      const fileContent = await readFile(join(SPECS_DIR, filename), "utf-8");
      const parsed = JSON.parse(fileContent);
      const info = parsed?.info ?? {};
      const project = filename.replace(/\.json$/, "");

      specs.push({
        filename,
        project,
        title: typeof info.title === "string" ? info.title : filename,
        version: typeof info.version === "string" ? info.version : "",
        description: typeof info.description === "string" ? info.description : "",
        url: `/specs/${filename}`,
        content: parsed
      });
    } catch (error) {
      console.error(`Failed to load spec ${filename}:`, error);
    }
  }

  return specs;
}
