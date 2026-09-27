"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode; badge?: number; badgeTone?: "alert" | "ok"; match?: string };

const I = {
  dash: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  leads: <path d="M4 5h16v11H8l-4 4z" />,
  rit: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4" /></>,
  rooster: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>,
};

export function SideNav({ jij, ritten }: { jij: number; ritten: number }) {
  const pathname = usePathname();
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Werk",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: I.dash },
        { href: "/leads", label: "Leads", icon: I.leads, badge: jij, badgeTone: "alert" },
        { href: "/proefritten", label: "Proefritten", icon: I.rit, badge: ritten, badgeTone: "ok" },
      ],
    },
    {
      title: "Instellen",
      items: [
        { href: "/instellingen#rooster", label: "Proefritrooster", icon: I.rooster, match: "#rooster" },
        { href: "/instellingen", label: "Instellingen", icon: I.settings },
        { href: "/handleiding", label: "Hulp & uitleg", icon: I.help },
      ],
    },
  ];

  const isActive = (it: Item) => {
    const base = it.href.split("#")[0];
    if (it.match) return false; // anker-link: nooit als actieve pagina tonen
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <nav className="snav">
      {groups.map((g) => (
        <div key={g.title} className="snav-group">
          <span className="snav-title">{g.title}</span>
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} className={isActive(it) ? "active" : ""}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {it.icon}
              </svg>
              <span className="snav-label">{it.label}</span>
              {!!it.badge && <span className={`snav-badge ${it.badgeTone}`}>{it.badge}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
