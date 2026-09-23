"use client";
import { useState, useEffect } from "react";
import { Wallet, PiggyBank, PartyPopper, TrendingDown } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { DistributionSlider } from "@/components/DistributionSlider";
import { InviteLink } from "@/components/InviteLink";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateDistribution } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";

/** "Meu Controle" — painel financeiro individual, com edição completa. */
export default function DashboardPage() {
  const { me, myFinance, saveMyFinance, loading, reload } = useFinanceData();
  const supabase = createClient();

  const [netSalary, setNetSalary] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [savePct, setSavePct] = useState(60);
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    if (myFinance) {
      setNetSalary(myFinance.net_salary);
      setFixedExpenses(myFinance.fixed_expenses);
      setSavePct(myFinance.save_percentage);
    }
  }, [myFinance]);

  const result = calculateDistribution(netSalary, fixedExpenses, savePct, 100 - savePct);

  async function handleSave() {
    setSaving(true);
    try {
      await saveMyFinance({
        net_salary: netSalary,
        fixed_expenses: fixedExpenses,
        save_percentage: savePct,
        leisure_percentage: 100 - savePct,
      });
      // Registra automaticamente o valor "a guardar" como aporte do mês
      if (me?.couple_id) {
        await supabase.from("savings").insert({
          user_id: me.id,
          couple_id: me.couple_id,
          amount: result.aGuardar,
          source: "auto",
          description: "Distribuição automática do mês",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInvite() {
    if (!me) return;
    const { data } = await supabase
      .from("couples")
      .insert({ user_a_id: me.id })
      .select()
      .single();
    if (data) {
      await supabase.from("users").update({ couple_id: data.id }).eq("id", me.id);
      setInviteCode(data.invite_code);
      await reload();
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Olá, {me?.full_name?.split(" ")[0] ?? "você"} 👋</h1>
          <p className="text-sm text-slate-500">Este é o seu controle financeiro deste mês.</p>
        </div>

        <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block mb-1 font-medium text-slate-600">Salário Líquido (R$)</span>
              <input
                type="number"
                value={netSalary}
                onChange={(e) => setNetSalary(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 font-medium text-slate-600">Gastos Fixos Totais (R$)</span>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <DistributionSlider savePercentage={savePct} onChange={(s) => setSavePct(s)} />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar mês"}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FinanceCard label="Saldo Livre" value={result.saldoLivre} icon={Wallet} tone={result.saldoLivre < 0 ? "danger" : "neutral"} />
          <FinanceCard label="A Guardar / Investir" value={result.aGuardar} icon={PiggyBank} tone="save" />
          <FinanceCard label="Para Lazer" value={result.paraLazer} icon={PartyPopper} tone="leisure" />
          <FinanceCard label="Gastos Fixos" value={fixedExpenses} icon={TrendingDown} tone="neutral" />
        </div>

        <InviteLink coupleId={me?.couple_id ?? null} inviteCode={inviteCode} onCreateInvite={handleCreateInvite} />
      </main>
    </div>
  );
}
