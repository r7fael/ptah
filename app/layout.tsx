import type { Metadata } from "next";
import "./globals.css";
import "./map.css";
import "./design-v2.css";

export const metadata: Metadata = {
  title: "PTAH Recife — Inteligência urbana",
  description: "Plataforma de comunicação e inteligência urbana para a Prefeitura do Recife.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
