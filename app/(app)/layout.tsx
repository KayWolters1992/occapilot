import { redirect } from "next/navigation";
import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { logout } from "../actions";
import { SideNav } from "./SideNav";
import { Logo } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const dealer = await currentDealer();
  if (!dealer) redirect("/login");
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/leads" className="logo"><Logo onDark markSize={36} wordHeight={19} /></Link>
        <SideNav />
        <div className="sfoot">
          <b>{dealer.name}</b>
          <span>{dealer.city || "—"} · {dealer.seller_name}</span>
          <form action={logout}><button type="submit">Uitloggen</button></form>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
