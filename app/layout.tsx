import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Occapilot",
  description: "Elke online lead beantwoord en opgevolgd tot er een proefrit staat.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Exo+2:ital,wght@1,800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
