"use client";
import { useState, useEffect } from "react";
import { Wallet, PiggyBank, PartyPopper, TrendingDown, History } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { DistributionSlider } from "@/components/DistributionSlider";
import { ExpenseItemsEditor } from "@/components/ExpenseItemsEditor";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateDistribution, calculateSaldoRestante, formatBRL } from "@/lib/calculations";
import { EXPENSE_CATEGORIES, FIXED_CATEGORIES, VARIABLE_CATEGORIES } from "@/lib/expense-categories";
import { ExpenseKind } from "@/lib/types";

/** "Meu Controle" — painel financeiro individual, com edição completa. */
export default function DashboardPage() {
  const { me, myFinance, myExpenses, saveMyFinance, loadPreviousMonth, loading } = useFinanceData();

  const [netSalary, setNetSalary] = useState(0);
  const [extraIncome, setExtraIncome] = useState(0);
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, number>>({});
  const [savePct, setSavePct] = useState(60);
  const [saving, setSaving] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [previousMessage, setPreviousMessage] = useState<string | null>(null);

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
  const saldoRestante = calculateSaldoRestante(result.saldoLivre, variableTotal);
  const lazerRestante = Math.round((result.paraLazer - variableTotal) * 100) / 100;

  function handleExpenseChange(categoryId: string, amount: number) {
    setExpenseAmounts((prev) => ({ ...prev, [categoryId]: amount }));
  }

  async function handleUsePreviousMonth() {
    const hasData = netSalary > 0 || FIXED_CATEGORIES.some((c) => (expenseAmounts[c.id] ?? 0) > 0);
    if (hasData && !window.confirm("Isso substitui o Salário Líquido e os Gastos Fixos atuais pelos valores do último mês salvo. Continuar?")) {
      return;
    }
    setLoadingPrevious(true);
    setPreviousMessage(null);
    try {
      const previous = await loadPreviousMonth();
      if (!previous) {
        setPreviousMessage("Ainda não há um mês anterior salvo.");
        return;
      }
      setNetSalary(previous.netSalary);
      setExpenseAmounts((prev) => {
        const next = { ...prev };
        for (const cat of FIXED_CATEGORIES) next[cat.id] = previous.fixedByCategory[cat.id] ?? 0;
        return next;
      });
    } catch (e) {
      setPreviousMessage((e as { message?: string })?.message ?? "Não foi possível buscar o mês anterior.");
    } finally {
      setLoadingPrevious(false);
    }
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-600">Este mês</p>
            <div className="flex flex-col items-end">
              <button
                type="button"
                onClick={handleUsePreviousMonth}
                disabled={loadingPrevious}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                <History className="h-3.5 w-3.5" />
                {loadingPrevious ? "Buscando..." : "Usar valores do mês anterior"}
              </button>
              {previousMessage && <span className="text-xs text-slate-400">{previousMessage}</span>}
            </div>
          </div>

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
          <FinanceCard label="Saldo Livre" value={saldoRestante} icon={Wallet} tone={saldoRestante < 0 ? "danger" : "neutral"} />
          <FinanceCard label="A Guardar / Investir" value={result.aGuardar} icon={PiggyBank} tone="save" />
          <FinanceCard
            label="Para Lazer (restante)"
            value={lazerRestante}
            icon={PartyPopper}
            tone={lazerRestante < 0 ? "danger" : "leisure"}
            hint={`de ${formatBRL(result.paraLazer)} planejado`}
          />
          <FinanceCard label="Gastos Fixos" value={fixedTotal} icon={TrendingDown} tone="neutral" />
          <FinanceCard label="Gastos Variáveis" value={variableTotal} icon={TrendingDown} tone={variableTotal > result.paraLazer ? "danger" : "neutral"} />
        </div>
      </main>
    </div>
  );
}
