import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { Dealer } from "./types";

const SECRET = () => process.env.AUTH_SECRET || "dev-secret";

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${h}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const calc = crypto.scryptSync(pw, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(calc));
}

function sign(v: string): string {
  return crypto.createHmac("sha256", SECRET()).update(v).digest("hex").slice(0, 32);
}
export function sessionToken(dealerId: number): string {
  const v = String(dealerId);
  return `${v}.${sign(v)}`;
}
export function parseSession(token: string | undefined): number | null {
  if (!token) return null;
  const [v, sig] = token.split(".");
  if (!v || !sig || sign(v) !== sig) return null;
  return Number(v) || null;
}

export async function currentDealer(): Promise<Dealer | null> {
  const jar = await cookies();
  const id = parseSession(jar.get("occ_session")?.value);
  if (!id) return null;
  return (db().prepare("SELECT * FROM dealers WHERE id=?").get(id) as Dealer) ?? null;
}

/** Handtekening voor reply-adressen: lead-<id>-<sig>@domain */
export function replySig(leadId: number, secret: string): string {
  return crypto.createHmac("sha256", SECRET()).update(`${leadId}:${secret}`).digest("hex").slice(0, 10);
}
export function replyAddress(leadId: number, secret: string): string {
  const domain = process.env.INBOUND_DOMAIN || "repright.local";
  return `lead-${leadId}-${replySig(leadId, secret)}@${domain}`;
}
