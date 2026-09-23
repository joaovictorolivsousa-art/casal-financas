"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { formatBRL } from "@/lib/calculations";

interface CoupleChartProps {
  data: { month: string; total: number }[];
}

/** Gráfico de evolução do acumulado conjunto ao longo dos meses. */
export function CoupleChart({ data }: CoupleChartProps) {
  // Transforma em série acumulada (soma progressiva)
  let running = 0;
  const cumulative = data.map((d) => {
    running += d.total;
    return { month: d.month, acumulado: running };
  });

  return (
    <div className="h-64 sm:h-80 bg-white rounded-2xl border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cumulative} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBRL(v).replace("R$", "")} width={70} />
          <Tooltip formatter={(v: number) => formatBRL(v)} />
          <Line type="monotone" dataKey="acumulado" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
