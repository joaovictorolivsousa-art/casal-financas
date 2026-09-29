"use client";
import { useState } from "react";
import { History } from "lucide-react";
import { Header } from "@/components/Header";
import { HistoryChart } from "@/components/HistoryChart";
import { useHistoryData } from "@/hooks/useHistoryData";
import { buildMonthlyHistory, formatBRL, formatMonth } from "@/lib/calculations";
import { categoryLabel } from "@/lib/expense-categories";

/** "Histórico" — todos os meses salvos, de cada um do casal. */
export default function HistoryPage() {
  const { me, partner, finances, expenses, loading, error } = useHistoryData();
  const [viewing, setViewing] = useState<"me" | "partner">("me");

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  const person = viewing === "partner" && partner ? partner : me;
  const months = buildMonthlyHistory(
    finances.filter((f) => f.user_id === person?.id),
    expenses
  );

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <h1 className="text-xl font-semibold">Histórico</h1>
          </div>

          {partner && (
            <div className="flex gap-1 sm:ml-auto bg-slate-100 rounded-xl p-1">
              {(["me", "partner"] as const).map((key) => {
                const p = key === "me" ? me : partner;
                return (
                  <button
                    key={key}
                    onClick={() => setViewing(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      viewing === key ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500"
                    }`}
                  >
                    {p?.full_name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {months.length === 0 ? (
          <p className="text-sm text-slate-400">
            Ainda não há meses salvos. Cada vez que você toca em &quot;Salvar mês&quot;, o mês aparece aqui.
          </p>
        ) : (
          <>
            <HistoryChart months={months} />

            <div className="space-y-3">
              {months.map((m) => (
                <details key={m.month} className="bg-white border rounded-2xl group">
                  <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none">
                    <span className="font-medium">{formatMonth(m.month)}</span>
                    <span className={`text-sm ${m.saldoRestante < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      Saldo {formatBRL(m.saldoRestante)}
                    </span>
                  </summary>

                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <Stat label="Renda" value={m.income} />
                      <Stat label="Gastos fixos" value={m.fixed} />
                      <Stat label="Gastos variáveis" value={m.variable} />
                      <Stat label="Plano de guardar" value={m.aGuardar} />
                    </div>

                    {m.byCategory.length > 0 && (
                      <ul className="text-sm divide-y">
                        {m.byCategory.map((c) => (
                          <li key={c.category} className="flex justify-between py-1.5">
                            <span className="text-slate-600">
                              {categoryLabel(c.category)}{" "}
                              <span className="text-xs text-slate-400">
                                ({c.kind === "fixed" ? "fixo" : "variável"})
                              </span>
                            </span>
                            <span>{formatBRL(c.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium">{formatBRL(value)}</p>
    </div>
  );
}
