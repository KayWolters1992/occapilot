"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, sessionToken, currentDealer } from "@/lib/auth";
import { cancelFollowups } from "@/lib/pipeline";
import type { Dealer } from "@/lib/types";

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
      "UPDATE dealers SET name=?, city=?, seller_name=?, from_email=?, opening_hours=? WHERE id=?"
    )
    .run(
      String(form.get("name") ?? dealer.name),
      String(form.get("city") ?? dealer.city),
      String(form.get("seller_name") ?? dealer.seller_name),
      String(form.get("from_email") ?? dealer.from_email),
      String(form.get("opening_hours") ?? dealer.opening_hours),
      dealer.id
    );
  redirect("/instellingen?opgeslagen=1");
}

export async function closeLead(form: FormData) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "gesloten");
  db()
    .prepare("UPDATE leads SET status=?, updated_at=datetime('now') WHERE id=? AND dealer_id=?")
    .run(status, id, dealer.id);
  cancelFollowups(id);
  redirect(`/leads/${id}`);
}
