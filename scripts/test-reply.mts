/** Testhulp: simuleert een klantantwoord op een lead, rechtstreeks door de pipeline. */
process.env.DATABASE_PATH = process.env.DATABASE_PATH || "./data/occapilot.db";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "demo-secret-not-for-production";
process.env.INBOUND_DOMAIN = process.env.INBOUND_DOMAIN || "leads.example.com";
process.env.APP_URL = process.env.APP_URL || "http://localhost:3000";

const { db } = await import("../src/lib/db");
const { replySig } = await import("../src/lib/auth");
const { handleCustomerReply } = await import("../src/lib/pipeline");

const leadId = Number(process.argv[2]);
const text = process.argv[3];
if (!leadId || !text) {
  console.log('Gebruik: tsx scripts/test-reply.mts <leadId> "klanttekst"');
  process.exit(1);
}
const lead = db().prepare("SELECT id, reply_secret FROM leads WHERE id=?").get(leadId) as { id: number; reply_secret: string };
await handleCustomerReply(leadId, replySig(leadId, lead.reply_secret), text);
const after = db().prepare("SELECT status, escalation_reason FROM leads WHERE id=?").get(leadId);
console.log(`lead ${leadId} na klantantwoord:`, JSON.stringify(after));
