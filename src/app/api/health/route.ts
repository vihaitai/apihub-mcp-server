import { NextResponse } from "next/server";
import { getSwaggerStore } from "@/lib/singleton";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const store = await getSwaggerStore();
  return NextResponse.json({
    status: "ok",
    ...store.getMeta()
  });
}
