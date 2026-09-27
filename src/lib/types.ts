export interface Dealer {
  id: number;
  name: string;
  city: string;
  seller_name: string;
  email: string;
  password_hash: string;
  from_email: string;
  inbound_token: string;
  opening_hours: string;
}

export interface Lead {
  id: number;
  dealer_id: number;
  reply_secret: string;
  status: string;
  qual_label: string;
  qual_reason: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle: string;
  license_plate: string;
  price: string;
  source: string;
  question: string;
  rdw_json: string;
  raw_email: string;
  escalation_reason: string;
  created_at: string;
  updated_at: string;
}

export interface Msg {
  id: number;
  lead_id: number;
  direction: "in" | "out" | "system";
  channel: string;
  subject: string;
  body: string;
  meta: string;
  created_at: string;
}

export interface Followup {
  id: number;
  lead_id: number;
  label: string;
  due_at: string;
  subject: string;
  body: string;
  status: "gepland" | "verzonden" | "geannuleerd";
  sent_at: string | null;
}

export interface RdwInfo {
  merk?: string;
  handelsbenaming?: string;
  apk_tot?: string;
  trekgewicht_geremd?: string;
  trekgewicht_ongeremd?: string;
  brandstof?: string;
  kleur?: string;
  km_stand_oordeel?: string;
}
