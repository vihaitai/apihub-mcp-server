import { NextResponse } from "next/server";
import { loadSpecsList } from "@/lib/swagger/specsLoader";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const specs = await loadSpecsList();
  return NextResponse.json(specs);
}
