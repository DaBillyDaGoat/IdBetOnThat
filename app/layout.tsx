import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "idbetonthat — Settle it with your friends",
    template: "%s · idbetonthat",
  },
  description:
    "Make a friendly wager, share the link, and let the math figure out who owes whom. Honor code. No middleman. No fees.",
  openGraph: {
    title: "idbetonthat — Settle it with your friends",
    description:
      "Make a friendly wager, share the link, and let the math figure out who owes whom.",
    siteName: "idbetonthat",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
