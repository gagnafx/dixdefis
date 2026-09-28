import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TogoMarket · Les défis d'Aného",
  description: "Les défis hebdomadaires de TogoMarket, depuis Aného."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}