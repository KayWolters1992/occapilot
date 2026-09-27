import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleNewLead, handleCustomerReply } from "@/lib/pipeline";
import type { Dealer } from "@/lib/types";

export const maxDuration = 120;

/**
 * Postmark inbound webhook.
 * - Nieuwe portaal-lead:  aan  leads-<inbound_token>@INBOUND_DOMAIN
 * - Klantantwoord:        aan  lead-<id>-<sig>@INBOUND_DOMAIN
 * De URL bevat een token als extra bescherming: /api/inbound/<CRON_SECRET>
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as {
    ToFull?: { Email: string }[];
    To?: string;
    From?: string;
    Subject?: string;
    TextBody?: string;
    StrippedTextReply?: string;
    HtmlBody?: string;
  };

  const recipients = (payload.ToFull?.map((t) => t.Email) ?? [payload.To ?? ""])
    .map((e) => e.toLowerCase());
  const text = payload.StrippedTextReply || payload.TextBody || stripHtml(payload.HtmlBody ?? "");

  for (const rcpt of recipients) {
    const local = rcpt.split("@")[0] ?? "";

    // Klantantwoord op een lead
    const m = local.match(/^lead-(\d+)-([a-f0-9]{10})$/);
    if (m) {
      await handleCustomerReply(Number(m[1]), m[2], text.trim());
      return NextResponse.json({ ok: true, type: "reply" });
    }

    // Nieuwe lead voor een dealer
    const t = local.match(/^leads-([a-z0-9]+)$/);
    if (t) {
      const dealer = db()
        .prepare("SELECT * FROM dealers WHERE inbound_token=?")
        .get(t[1]) as Dealer | undefined;
      if (dealer) {
        const raw = [
          payload.From ? `Van: ${payload.From}` : "",
          payload.Subject ? `Onderwerp: ${payload.Subject}` : "",
          "",
          text,
        ]
          .filter(Boolean)
          .join("\n");
        const id = await handleNewLead(dealer, raw);
        return NextResponse.json({ ok: true, type: "lead", id });
      }
    }
  }

  // Onbekende ontvanger: 200 teruggeven zodat Postmark niet blijft retryen
  return NextResponse.json({ ok: true, type: "ignored" });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
