"use client";

import { useEffect, useRef, useState } from "react";

/** Schuift een blok zachtjes in beeld zodra het zichtbaar wordt. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`rv ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Telt op van 0 naar `to` zodra het getal in beeld komt. */
export function CountUp({ to, suffix = "", prefix = "", duration = 1400 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("nl-NL")}
      {suffix}
    </span>
  );
}

const CHANNELS = [
  {
    name: "AutoScout24",
    desc: "Leads uit je AutoScout24-advertenties worden binnen 2 minuten persoonlijk beantwoord, met de juiste auto en prijs erbij.",
    klant: "Mark Jansen",
    auto: "BMW 3-Serie 320i Touring",
    vraag: "Is deze auto nog beschikbaar? En wat is het trekgewicht?",
    antwoord: "Hoi Mark, ja, de 320i Touring staat nog bij ons. Het trekgewicht is 1.600 kg (geremd), volgens de RDW. Zullen we een proefrit plannen? Zaterdag 11:00 of maandag 16:30 kan.",
  },
  {
    name: "AutoTrack",
    desc: "Ook AutoTrack-leads komen automatisch binnen en krijgen hetzelfde snelle, persoonlijke antwoord.",
    klant: "Linda Bakker",
    auto: "Toyota Yaris 1.5 Hybrid",
    vraag: "Wanneer moet deze Yaris weer APK?",
    antwoord: "Hoi Linda, de APK van deze Yaris loopt tot maart 2027, volgens de RDW. Wil je hem een keer komen bekijken? Donderdagmiddag of zaterdagochtend kan bij ons.",
  },
  {
    name: "Marktplaats",
    desc: "Marktplaats-reacties worden netjes opgepakt, ook als de klant maar één zinnetje stuurt.",
    klant: "Sanne de Vries",
    auto: "VW Passat Variant 2.0 TDI",
    vraag: "Nog te koop?",
    antwoord: "Hoi Sanne, ja, de Passat Variant is nog te koop. Hij is net binnen en staat klaar voor een proefrit. Past vrijdag 15:00 of zaterdag 10:30 je?",
  },
  {
    name: "Eigen website",
    desc: "Contactformulieren van je eigen site gaan direct naar RepRight. Geen lead valt meer tussen wal en schip.",
    klant: "Ahmed El Idrissi",
    auto: "Audi A4 Avant 40 TDI",
    vraag: "Kan ik deze week een proefrit maken?",
    antwoord: "Hoi Ahmed, zeker! Ik heb woensdag 17:00 of zaterdag 11:00 voor je vrij. Welk moment past het beste? Dan zet ik de Audi voor je klaar.",
  },
];

/** Kanalen-tabs links, rechts een mock van de lead + een AI-antwoord dat zich uittypt. */
export function ChannelTabs() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const c = CHANNELS[idx];

  useEffect(() => {
    setTyped("");
    let i = 0;
    const full = c.antwoord;
    const t = setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [c.antwoord]);

  const done = typed.length >= c.antwoord.length;

  return (
    <div className="x-tabs">
      <div className="x-tablist" role="tablist">
        {CHANNELS.map((ch, i) => (
          <button
            key={ch.name}
            role="tab"
            aria-selected={i === idx}
            className={`x-tab ${i === idx ? "on" : ""}`}
            onClick={() => setIdx(i)}
          >
            <b>{ch.name}</b>
            {i === idx && <span>{ch.desc}</span>}
          </button>
        ))}
      </div>

      <div className="x-mock">
        <div className="x-mock-head">
          <span className="x-live"><i />Live</span>
          <span className="x-mock-src">Nieuwe lead via {c.name}</span>
        </div>
        <div className="x-mail">
          <div className="x-mail-meta">
            <b>{c.klant}</b>
            <span>{c.auto}</span>
          </div>
          <p>{c.vraag}</p>
        </div>
        <div className="x-reply">
          <span className="x-reply-who">RepRight antwoordt namens jou</span>
          <p>
            {typed}
            {!done && <i className="x-caret" />}
          </p>
        </div>
        <div className={`x-sent ${done ? "on" : ""}`}>✓ Verzonden in 1 min 42 sec</div>
      </div>
    </div>
  );
}
