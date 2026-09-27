"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ITEMS = [
  {
    href: "/leads",
    label: "Leads",
    icon: <path d="M4 4h16v12H7l-3 3z" />,
  },
  {
    href: "/instellingen",
    label: "Instellingen",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      </>
    ),
  },
  {
    href: "/handleiding",
    label: "Handleiding",
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
  },
];

const LEAD_FILTERS = [
  { status: "", label: "Alle leads" },
  { status: "escalatie", label: "Actie nodig" },
  { status: "afspraak", label: "Afspraken" },
];

export function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") || "";
  const onLeads = pathname.startsWith("/leads");

  return (
    <nav className="snav">
      {ITEMS.map((it) => (
        <div key={it.href}>
          <Link href={it.href} className={pathname.startsWith(it.href) ? "active" : ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {it.icon}
            </svg>
            {it.label}
          </Link>
          {it.href === "/leads" && onLeads && (
            <div className="subnav">
              {LEAD_FILTERS.map((f) => (
                <Link
                  key={f.label}
                  href={f.status ? `/leads?status=${f.status}` : "/leads"}
                  className={activeStatus === f.status ? "active" : ""}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
