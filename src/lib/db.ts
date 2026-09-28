import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "./data/occapilot.db";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS dealers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT DEFAULT '',
    seller_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,          -- login + meldingen
    password_hash TEXT NOT NULL,
    from_email TEXT NOT NULL,            -- afzender richting klant (geverifieerd in Postmark)
    inbound_token TEXT NOT NULL UNIQUE,  -- leads-<token>@INBOUND_DOMAIN
    opening_hours TEXT DEFAULT 'ma–vr 9.00–18.00, za 9.00–17.00',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dealer_id INTEGER NOT NULL REFERENCES dealers(id),
    reply_secret TEXT NOT NULL,          -- voor lead-<id>-<secret>@ reply-adres
    status TEXT NOT NULL DEFAULT 'nieuw',-- nieuw|actief|wacht|afspraak|escalatie|gestopt|gesloten
    qual_label TEXT DEFAULT '',          -- Heet|Warm|Koud
    qual_reason TEXT DEFAULT '',
    customer_name TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    vehicle TEXT DEFAULT '',
    license_plate TEXT DEFAULT '',
    price TEXT DEFAULT '',
    source TEXT DEFAULT '',
    question TEXT DEFAULT '',
    rdw_json TEXT DEFAULT '',            -- opgehaalde RDW-verrijking
    raw_email TEXT NOT NULL,
    escalation_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_leads_dealer ON leads(dealer_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    direction TEXT NOT NULL,             -- in|out|system
    channel TEXT NOT NULL DEFAULT 'email',
    subject TEXT DEFAULT '',
    body TEXT NOT NULL,
    meta TEXT DEFAULT '',                -- bijv. 'dag1', 'escalatie'
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id, created_at);

  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    label TEXT NOT NULL,                 -- dag1|dag3|dag7
    due_at TEXT NOT NULL,                -- ISO, UTC
    subject TEXT DEFAULT '',
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'gepland', -- gepland|verzonden|geannuleerd
    sent_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(status, due_at);
  `);
  // Latere kolommen: veilig toevoegen op bestaande databases
  const cols = (d.prepare("PRAGMA table_info(dealers)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("schedule_json")) d.exec("ALTER TABLE dealers ADD COLUMN schedule_json TEXT DEFAULT ''");
  if (!cols.includes("settings_checked")) d.exec("ALTER TABLE dealers ADD COLUMN settings_checked INTEGER DEFAULT 0");
  if (!cols.includes("stock_live")) d.exec("ALTER TABLE dealers ADD COLUMN stock_live INTEGER DEFAULT 1");
  if (!cols.includes("checklist_hidden")) d.exec("ALTER TABLE dealers ADD COLUMN checklist_hidden INTEGER DEFAULT 0");
}
