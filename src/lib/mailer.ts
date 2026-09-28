/** Outbound e-mail via Postmark. */

interface SendArgs {
  from: string;        // geverifieerde afzender van de dealer
  fromName: string;
  to: string;
  replyTo: string;     // lead-<id>-<secret>@INBOUND_DOMAIN
  subject: string;
  text: string;
}

export async function sendEmail(a: SendArgs): Promise<boolean> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    console.warn("[mailer] POSTMARK_SERVER_TOKEN ontbreekt — mail niet verzonden:", a.subject);
    return false;
  }
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: `${a.fromName} <${a.from}>`,
      To: a.to,
      ReplyTo: a.replyTo,
      Subject: a.subject,
      TextBody: a.text,
      MessageStream: "outbound",
    }),
  });
  if (!res.ok) {
    console.error("[mailer] Postmark-fout", res.status, await res.text());
    return false;
  }
  return true;
}

/** Interne melding aan de dealer (escalatie, afspraak). */
export async function notifyDealer(opts: {
  dealerEmail: string;
  subject: string;
  text: string;
}): Promise<void> {
  const domain = process.env.INBOUND_DOMAIN || "repright.local";
  await sendEmail({
    from: `melding@${domain.replace(/^in\./, "")}`,
    fromName: "RepRight",
    to: opts.dealerEmail,
    replyTo: opts.dealerEmail,
    subject: opts.subject,
    text: opts.text,
  }).catch(() => {});
}
