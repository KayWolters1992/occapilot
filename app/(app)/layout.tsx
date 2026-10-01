import { redirect } from "next/navigation";
import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions";
import { SideNav } from "./SideNav";
import { Logo } from "@/components/Logo";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  const c = db()
    .prepare(
      `SELECT SUM(status IN ('escalatie','overgenomen')) jij, SUM(status='afspraak') ritten FROM leads WHERE dealer_id=?`
    )
    .get(dealer.id) as { jij: number | null; ritten: number | null };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="logo"><Logo onDark markSize={28} /></Link>
        <SideNav jij={c.jij ?? 0} ritten={c.ritten ?? 0} />
        <div className="sfoot">
          <div className="sfoot-status"><i />RepRight staat aan</div>
          <div className="sfoot-me">
            <span className="avatar sm">{initials(dealer.seller_name || dealer.name)}</span>
            <div>
              <b>{dealer.seller_name}</b>
              <span>{dealer.name}</span>
            </div>
          </div>
          <form action={logout}><button type="submit">Uitloggen</button></form>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
