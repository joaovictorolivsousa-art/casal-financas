"use client";
import { useState, useEffect } from "react";
import { Wallet, PiggyBank, PartyPopper, TrendingDown } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { DistributionSlider } from "@/components/DistributionSlider";
import { ExpenseItemsEditor } from "@/components/ExpenseItemsEditor";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateDistribution } from "@/lib/calculations";
import { EXPENSE_CATEGORIES, FIXED_CATEGORIES, VARIABLE_CATEGORIES } from "@/lib/expense-categories";
import { ExpenseKind } from "@/lib/types";

/** "Meu Controle" — painel financeiro individual, com edição completa. */
export default function DashboardPage() {
  const { me, myFinance, myExpenses, saveMyFinance, loading } = useFinanceData();

  const [netSalary, setNetSalary] = useState(0);
  const [extraIncome, setExtraIncome] = useState(0);
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, number>>({});
  const [savePct, setSavePct] = useState(60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (myFinance) {
      setNetSalary(myFinance.net_salary);
      setExtraIncome(myFinance.extra_income ?? 0);
      setSavePct(myFinance.save_percentage);
    }
  }, [myFinance]);

  useEffect(() => {
    const amounts: Record<string, number> = {};
    for (const item of myExpenses) amounts[item.category] = item.amount;
    setExpenseAmounts(amounts);
  }, [myExpenses]);

  const fixedTotal = FIXED_CATEGORIES.reduce((sum, c) => sum + (expenseAmounts[c.id] ?? 0), 0);
  const variableTotal = VARIABLE_CATEGORIES.reduce((sum, c) => sum + (expenseAmounts[c.id] ?? 0), 0);

  const totalIncome = netSalary + extraIncome;
  const result = calculateDistribution(totalIncome, fixedTotal, savePct, 100 - savePct);

  function handleExpenseChange(categoryId: string, amount: number) {
    setExpenseAmounts((prev) => ({ ...prev, [categoryId]: amount }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const items = EXPENSE_CATEGORIES.map((c) => ({
        category: c.id,
        kind: c.kind as ExpenseKind,
        amount: expenseAmounts[c.id] ?? 0,
      }));
      await saveMyFinance(
        {
          net_salary: netSalary,
          extra_income: extraIncome,
          save_percentage: savePct,
          leisure_percentage: 100 - savePct,
        },
        items,
        result.aGuardar
      );
    } finally {
      setSaving(false);
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
              <span className="block mb-1 font-medium text-slate-600">Renda Extra (R$)</span>
              <input
                type="number"
                value={extraIncome}
                onChange={(e) => setExtraIncome(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Freela, bônus, 13º..."
              />
            </label>
          </div>

          <ExpenseItemsEditor values={expenseAmounts} onChange={handleExpenseChange} paraLazer={result.paraLazer} />

          <DistributionSlider savePercentage={savePct} onChange={(s) => setSavePct(s)} />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar mês"}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FinanceCard label="Saldo Livre" value={result.saldoLivre} icon={Wallet} tone={result.saldoLivre < 0 ? "danger" : "neutral"} />
          <FinanceCard label="A Guardar / Investir" value={result.aGuardar} icon={PiggyBank} tone="save" />
          <FinanceCard label="Para Lazer" value={result.paraLazer} icon={PartyPopper} tone="leisure" />
          <FinanceCard label="Gastos Fixos" value={fixedTotal} icon={TrendingDown} tone="neutral" />
          <FinanceCard label="Gastos Variáveis" value={variableTotal} icon={TrendingDown} tone={variableTotal > result.paraLazer ? "danger" : "neutral"} />
        </div>
      </main>
    </div>
  );
}
