import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nós Dois & Dinheiro",
  description: "Controle financeiro para casais — autonomia individual, metas conjuntas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
