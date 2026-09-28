import { Ic } from "@/components/Ic";
import { statusInfo } from "@/lib/status";

export function StatusPill({ status, title }: { status: string; title?: string }) {
  const s = statusInfo(status);
  return <span className={`pill ${s.pill}`} title={title || s.uitleg}><Ic ic={s.icon} size={14} /> {s.label}</span>;
}
