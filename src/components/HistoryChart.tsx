"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { formatBRL, formatMonth } from "@/lib/calculations";
import { MonthSummary } from "@/lib/types";

/** Barras por mês: renda, gastos (fixos + variáveis) e o quanto ficou de saldo. */
export function HistoryChart({ months }: { months: MonthSummary[] }) {
  const data = [...months]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      mes: formatMonth(m.month, "short"),
      Renda: m.income,
      Gastos: Math.round((m.fixed + m.variable) * 100) / 100,
      Saldo: m.saldoRestante,
    }));

  return (
    <div className="h-64 sm:h-80 bg-white rounded-2xl border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBRL(v).replace("R$", "")} width={70} />
          <Tooltip formatter={(v: number) => formatBRL(v)} />
          <Legend />
          <Bar dataKey="Renda" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Saldo" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
