import { NextRequest, NextResponse } from "next/server";
import { tick } from "@/lib/pipeline";

export const maxDuration = 120;

/**
 * Handmatige trigger voor de planner (draait normaal vanzelf via instrumentation.ts):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await tick();
  return NextResponse.json({ ok: true, ...r });
}
