import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepRight AI · Je tweede verkoper die nooit slaapt",
  description: "Elke online lead beantwoord en opgevolgd tot er een proefrit staat.",
  icons: { icon: [{ url: "/brand/icon-64.png", type: "image/png" }], apple: "/brand/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
