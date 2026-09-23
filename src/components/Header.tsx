"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Users, Heart } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Meu Controle", icon: Wallet },
  { href: "/dashboard/partner", label: "Controle do Par", icon: Users },
  { href: "/dashboard/future", label: "Nosso Futuro", icon: Heart },
];

/** Cabeçalho com o toggle entre as 3 visões da aplicação. */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="font-semibold text-slate-900">💰 Nós Dois & Dinheiro</span>

        <nav className="flex gap-1 sm:ml-auto bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
                  active ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
