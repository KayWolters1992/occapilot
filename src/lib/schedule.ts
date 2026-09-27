/** Proefritrooster van een dealer: weekrooster + regels, en daaruit concrete vrije momenten. */

export interface DaySlot { open: boolean; van: string; tot: string }
export interface Schedule {
  days: DaySlot[]; // index 0 = maandag … 6 = zondag
  duur: number; // minuten per proefrit
  vooraf: number; // minimaal aantal uren tussen aanvraag en afspraak
  gesloten: string; // vrije dagen / uitzonderingen, vrije tekst
  notitie: string; // extra info voor de klant (bijv. rijbewijs meenemen)
}

export const DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const DAG_KORT = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const MAAND_KORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export const DEFAULT_SCHEDULE: Schedule = {
  days: [
    { open: true, van: "09:00", tot: "18:00" },
    { open: true, van: "09:00", tot: "18:00" },
    { open: true, van: "09:00", tot: "18:00" },
    { open: true, van: "09:00", tot: "18:00" },
    { open: true, van: "09:00", tot: "18:00" },
    { open: true, van: "09:00", tot: "17:00" },
    { open: false, van: "10:00", tot: "16:00" },
  ],
  duur: 45,
  vooraf: 2,
  gesloten: "",
  notitie: "",
};

export function parseSchedule(json: string | null | undefined): Schedule {
  if (!json) return DEFAULT_SCHEDULE;
  try {
    const s = JSON.parse(json) as Partial<Schedule>;
    if (!Array.isArray(s.days) || s.days.length !== 7) return DEFAULT_SCHEDULE;
    return { ...DEFAULT_SCHEDULE, ...s } as Schedule;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const nl = (t: string) => t.replace(":", ".");

/** Korte samenvatting, bijv. "ma–vr 09.00–18.00, za 09.00–17.00, zo gesloten". */
export function scheduleSummary(s: Schedule): string {
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    const d = s.days[i];
    let j = i;
    while (j + 1 < 7 && s.days[j + 1].open === d.open && s.days[j + 1].van === d.van && s.days[j + 1].tot === d.tot) j++;
    const label = i === j ? DAG_KORT[i] : `${DAG_KORT[i]}–${DAG_KORT[j]}`;
    parts.push(d.open ? `${label} ${nl(d.van)}–${nl(d.tot)}` : `${label} gesloten`);
    i = j + 1;
  }
  return parts.join(", ");
}

/** Huidige tijd als "Amsterdamse wandklok" (gecodeerd als UTC, zodat rekenen simpel blijft). */
function amsterdamNow(now: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(now).map((x) => [x.type, x.value])
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
}

export interface Moment { label: string; dag: string }

/** Concrete vrije momenten in de komende dagen, verspreid (max. 2 per dag: ochtend en middag). */
export function nextSlots(s: Schedule, count = 6, now = new Date()): Moment[] {
  const nowLocal = amsterdamNow(now);
  const earliest = nowLocal + s.vooraf * 3600_000;
  const base = new Date(nowLocal);
  const out: Moment[] = [];
  for (let off = 0; off < 14 && out.length < count; off++) {
    const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + off));
    const idx = (day.getUTCDay() + 6) % 7; // 0 = maandag
    const d = s.days[idx];
    if (!d.open) continue;
    const start = toMin(d.van), end = toMin(d.tot) - s.duur;
    if (end < start) continue;
    const kandidaten: number[] = [];
    for (let m = Math.ceil(start / 60) * 60; m <= end; m += 60) kandidaten.push(m);
    if (!kandidaten.length) kandidaten.push(start);
    const ochtend = kandidaten.find((m) => m >= 600 && m < 720 && day.getTime() + m * 60000 >= earliest)
      ?? kandidaten.find((m) => m < 720 && day.getTime() + m * 60000 >= earliest);
    const middag = kandidaten.find((m) => m >= 900 && day.getTime() + m * 60000 >= earliest)
      ?? kandidaten.find((m) => m >= 780 && day.getTime() + m * 60000 >= earliest);
    for (const m of [ochtend, middag]) {
      if (m === undefined || out.length >= count) continue;
      const label = `${DAG_KORT[idx]} ${day.getUTCDate()} ${MAAND_KORT[day.getUTCMonth()]} ${nl(fmt(m))}`;
      out.push({ label, dag: DAGEN[idx] });
    }
  }
  return out;
}

/** Tekst voor de AI: vandaag, rooster, regels en concrete vrije momenten. */
export function planningForAI(s: Schedule, now = new Date()): string {
  const vandaag = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(now);
  const slots = nextSlots(s, 6, now).map((m) => m.label).join("; ");
  return [
    `Het is nu ${vandaag}.`,
    `Proefritrooster: ${scheduleSummary(s)}. Een proefrit duurt ongeveer ${s.duur} minuten.`,
    `Stel NOOIT een moment voor binnen ${s.vooraf} uur vanaf nu of buiten het rooster.`,
    s.gesloten.trim() ? `Gesloten of niet beschikbaar: ${s.gesloten.trim().replace(/[.!]+$/, "")}.` : "",
    slots ? `Stel bij voorkeur twee van deze vrije momenten voor (één ochtend, één middag als dat kan): ${slots}.` : "Er zijn geen vrije momenten bekend; stel alleen dagdelen voor.",
    s.notitie.trim() ? `Vermeld bij een afspraak kort: ${s.notitie.trim().replace(/[.!]+$/, "")}.` : "",
  ].filter(Boolean).join("\n");
}
