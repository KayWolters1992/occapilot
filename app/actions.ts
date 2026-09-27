"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, sessionToken, currentDealer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cancelFollowups, sendDealerReply } from "@/lib/pipeline";
import type { Dealer, Lead } from "@/lib/types";
import { parseSchedule, scheduleSummary } from "@/lib/schedule";

export async function register(_prev: { error?: string }, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const sellerName = String(form.get("seller_name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");

  if (!name || !sellerName || !email || !password) {
    return { error: "Vul alle verplichte velden in." };
  }
  if (password.length < 8) {
    return { error: "Kies een wachtwoord van minstens 8 tekens." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Vul een geldig e-mailadres in." };
  }

  const d = db();
  const exists = d.prepare("SELECT id FROM dealers WHERE email=?").get(email);
  if (exists) {
    return { error: "Er bestaat al een account met dit e-mailadres. Log in plaats daarvan in." };
  }

  const token = crypto.randomBytes(5).toString("hex");
  const info = d
    .prepare(
      "INSERT INTO dealers (name, city, seller_name, email, password_hash, from_email, inbound_token) VALUES (?,?,?,?,?,?,?)"
    )
    .run(name, city, sellerName, email, hashPassword(password), email, token);

  const jar = await cookies();
  jar.set("occ_session", sessionToken(Number(info.lastInsertRowid)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/leads?welkom=1");
}

export async function login(_prev: { error?: string }, form: FormData) {
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const dealer = db().prepare("SELECT * FROM dealers WHERE email=?").get(email) as Dealer | undefined;
  if (!dealer || !verifyPassword(password, dealer.password_hash)) {
    return { error: "Onjuiste inloggegevens." };
  }
  const jar = await cookies();
  jar.set("occ_session", sessionToken(dealer.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/leads");
}

export async function logout() {
  const jar = await cookies();
  jar.delete("occ_session");
  redirect("/login");
}

export async function updateSettings(form: FormData) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  db()
    .prepare(
      "UPDATE dealers SET name=?, city=?, seller_name=?, from_email=?, settings_checked=1 WHERE id=?"
    )
    .run(
      String(form.get("name") ?? dealer.name),
      String(form.get("city") ?? dealer.city),
      String(form.get("seller_name") ?? dealer.seller_name),
      String(form.get("from_email") ?? dealer.from_email),
      dealer.id
    );
  redirect("/instellingen?opgeslagen=1");
}

export async function closeLead(form: FormData) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  const id = Number(form.get("id"));
  const raw = String(form.get("status") ?? "gesloten");
  const status = ["gesloten", "wacht"].includes(raw) ? raw : "gesloten";
  db()
    .prepare("UPDATE leads SET status=?, escalation_reason='', updated_at=datetime('now') WHERE id=? AND dealer_id=?")
    .run(status, id, dealer.id);
  if (status === "gesloten") cancelFollowups(id);
  redirect(`/leads/${id}`);
}

export async function replyToLead(form: FormData) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  const id = Number(form.get("id"));
  const text = String(form.get("text") ?? "").trim();
  const handBack = form.get("handback") === "1";
  const lead = db().prepare("SELECT * FROM leads WHERE id=? AND dealer_id=?").get(id, dealer.id) as Lead | undefined;
  if (!lead || !text) redirect(`/leads/${id}`);
  await sendDealerReply(dealer, lead, text, handBack);
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?verzonden=1`);
}

export async function updateSchedule(form: FormData) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  const schedule = parseSchedule(String(form.get("schedule_json") ?? ""));
  db()
    .prepare("UPDATE dealers SET schedule_json=?, opening_hours=?, settings_checked=1 WHERE id=?")
    .run(JSON.stringify(schedule), scheduleSummary(schedule), dealer.id);
  redirect("/instellingen?opgeslagen=rooster#rooster");
}
