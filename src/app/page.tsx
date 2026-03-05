import SwaggerViewer from "@/components/SwaggerViewer";
import { loadSpecsList } from "@/lib/swagger/specsLoader";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const specs = await loadSpecsList();

  return (
    <main style={{ height: "100vh" }}>
      <SwaggerViewer specs={specs} />
    </main>
  );
}
