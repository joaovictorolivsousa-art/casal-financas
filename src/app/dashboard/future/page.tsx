"use client";
import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { CoupleChart } from "@/components/CoupleChart";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateCoupleTotals, groupSavingsByMonth } from "@/lib/calculations";

/** "Nosso Futuro" — visão consolidada do patrimônio acumulado pelo casal. */
export default function FutureDashboardPage() {
  const { me, partner, savings, loading, addManualSaving } = useFinanceData();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  const totals = calculateCoupleTotals(savings, me?.id ?? "", partner?.id);
  const evolution = groupSavingsByMonth(savings);

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    try {
      await addManualSaving(Number(amount), description || undefined);
      setAmount("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h1 className="text-xl font-semibold">Patrimônio do Casal</h1>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FinanceCard label="Total Guardado (Geral)" value={totals.totalGeral} icon={Heart} tone="save" />
          <FinanceCard label={me?.full_name?.split(" ")[0] ?? "Você"} value={totals.totalUserA} icon={Heart} />
          <FinanceCard label={partner?.full_name?.split(" ")[0] ?? "Parceiro(a)"} value={totals.totalUserB} icon={Heart} />
          <FinanceCard label="Aportes Manuais" value={totals.totalManual} icon={Heart} tone="leisure" />
        </div>

        <CoupleChart data={evolution} />

        <form onSubmit={handleAddManual} className="bg-white border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium">Registrar aporte manual / histórico</p>
          <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3">
            <input
              type="number"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
