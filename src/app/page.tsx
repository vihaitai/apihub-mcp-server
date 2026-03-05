import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import SwaggerViewer from "@/components/SwaggerViewer";

type SpecEntry = {
  filename: string;
  title: string;
  version: string;
  description: string;
  url: string;
};

async function getSpecs(): Promise<SpecEntry[]> {
  const specsDir = join(process.cwd(), "public", "specs");

  let files: string[];
  try {
    files = await readdir(specsDir);
  } catch {
    return [];
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const specs: SpecEntry[] = [];

  for (const filename of jsonFiles) {
    try {
      const content = await readFile(join(specsDir, filename), "utf-8");
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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const specs = await getSpecs();

  return (
    <main style={{ height: "100vh" }}>
      <SwaggerViewer specs={specs} />
    </main>
  );
}
