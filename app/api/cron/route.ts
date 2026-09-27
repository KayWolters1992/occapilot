import { NextRequest, NextResponse } from "next/server";
import { sendDueFollowups } from "@/lib/pipeline";

export const maxDuration = 120;

/**
 * Verstuurt vervallen opvolgingen binnen het verzendvenster (08.00–20.30 NL).
 * Aanroepen per cron, elke 15 min:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron
 * (Vercel: vercel.json cron; VPS: crontab.)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sent = await sendDueFollowups();
  return NextResponse.json({ ok: true, sent });
}
