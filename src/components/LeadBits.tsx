export function Bars({ label }: { label: string }) {
  const cls = label === "Heet" ? "heet" : label === "Koud" ? "koud" : "warm";
  return (
    <span className={`bars ${cls}`} title={`${label || "Onbekend"}e lead`} aria-label={`${label || "Onbekend"}e lead`}>
      <i /><i /><i />
    </span>
  );
}

export function Plate({ p }: { p: string }) {
  if (!p) return <span className="dim">geen kenteken</span>;
  return <span className="plate"><span className="eu">NL</span><span className="num">{p.toUpperCase()}</span></span>;
}

export function groet() {
  const h = Number(new Intl.DateTimeFormat("nl-NL", { hour: "numeric", hour12: false, timeZone: "Europe/Amsterdam" }).format(new Date()));
  return h < 6 ? "Goedenacht" : h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}

/** "vandaag 09:32", "gisteren 21:47" of "25-09 12:05" (tijden in de database zijn UTC). */
export function wanneer(ts: string) {
  const d = new Date(ts.includes("T") || ts.endsWith("Z") ? ts : ts.replace(" ", "T") + "Z");
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", ...o }).format(d);
  const dag = f({ year: "numeric", month: "2-digit", day: "2-digit" });
  const nu = new Date();
  const vandaag = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(nu);
  const gist = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(nu.getTime() - 86400000));
  const tijd = f({ hour: "2-digit", minute: "2-digit" });
  if (dag === vandaag) return `vandaag ${tijd}`;
  if (dag === gist) return `gisteren ${tijd}`;
  return `${f({ day: "2-digit", month: "2-digit" })} ${tijd}`;
}
