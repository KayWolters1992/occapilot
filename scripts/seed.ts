/**
 * Eerste dealer aanmaken:
 *   npm run seed -- "Autobedrijf Wolters" "Maastricht" "Kay" "kay@voorbeeld.nl" "wachtwoord" "verkoop@autobedrijf.nl"
 */
import crypto from "node:crypto";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const [name, city, seller, email, password, fromEmail] = process.argv.slice(2);
if (!name || !seller || !email || !password || !fromEmail) {
  console.log(
    'Gebruik: npm run seed -- "Bedrijfsnaam" "Plaats" "Verkoper" "login@email" "wachtwoord" "afzender@dealerdomein.nl"'
  );
  process.exit(1);
}

const token = crypto.randomBytes(5).toString("hex");
db()
  .prepare(
    "INSERT INTO dealers (name, city, seller_name, email, password_hash, from_email, inbound_token) VALUES (?,?,?,?,?,?,?)"
  )
  .run(name, city ?? "", seller, email.toLowerCase(), hashPassword(password), fromEmail, token);

console.log(`✓ Dealer aangemaakt.`);
console.log(`  Login:        ${email}`);
console.log(`  Inbound:      leads-${token}@${process.env.INBOUND_DOMAIN ?? "<INBOUND_DOMAIN>"}`);
