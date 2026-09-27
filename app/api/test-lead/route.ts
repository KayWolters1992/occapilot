import { NextRequest, NextResponse } from "next/server";
import { currentDealer } from "@/lib/auth";
import { handleNewLead } from "@/lib/pipeline";

export const maxDuration = 120;

/** Test-endpoint: plak een lead-e-mail zonder Postmark (alleen ingelogd). */
export async function POST(req: NextRequest) {
  const dealer = await currentDealer();
  if (!dealer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { raw } = (await req.json()) as { raw?: string };
  if (!raw?.trim()) return NextResponse.json({ error: "raw ontbreekt" }, { status: 400 });
  const id = await handleNewLead(dealer, raw.trim());
  return NextResponse.json({ ok: true, id });
}
