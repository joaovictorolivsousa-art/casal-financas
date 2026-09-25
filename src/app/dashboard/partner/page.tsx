"use client";
import { Wallet, PiggyBank, PartyPopper, TrendingDown } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { DistributionSlider } from "@/components/DistributionSlider";
import { ExpenseItemsEditor } from "@/components/ExpenseItemsEditor";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateDistribution } from "@/lib/calculations";

/** "Controle do Par" — mesmo layout do dashboard individual, porém 100% somente leitura. */
export default function PartnerDashboardPage() {
  const { partner, partnerFinance, partnerExpenses, loading } = useFinanceData();

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  if (!partner) {
    return (
      <div>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10 text-center text-slate-500">
          Seu par ainda não criou o perfil. Peça para abrir o app e escolher o perfil dele(a).
        </main>
      </div>
    );
  }

  const finance = partnerFinance ?? { net_salary: 0, extra_income: 0, fixed_expenses: 0, save_percentage: 60, leisure_percentage: 40 };
  const totalIncome = finance.net_salary + (finance.extra_income ?? 0);
  const result = calculateDistribution(totalIncome, finance.fixed_expenses, finance.save_percentage, finance.leisure_percentage);

  const expenseAmounts: Record<string, number> = {};
  for (const item of partnerExpenses) expenseAmounts[item.category] = item.amount;

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Controle de {partner.full_name.split(" ")[0]}</h1>
        </div>

        <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block mb-1 font-medium text-slate-600">Salário Líquido (R$)</span>
              <p className="border rounded-lg px-3 py-2 bg-slate-50">{finance.net_salary.toFixed(2)}</p>
            </div>
            <div>
              <span className="block mb-1 font-medium text-slate-600">Renda Extra (R$)</span>
              <p className="border rounded-lg px-3 py-2 bg-slate-50">{(finance.extra_income ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <ExpenseItemsEditor values={expenseAmounts} onChange={() => {}} paraLazer={result.paraLazer} readOnly />

          <DistributionSlider savePercentage={finance.save_percentage} onChange={() => {}} readOnly />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FinanceCard label="Saldo Livre" value={result.saldoLivre} icon={Wallet} />
          <FinanceCard label="A Guardar / Investir" value={result.aGuardar} icon={PiggyBank} tone="save" />
          <FinanceCard label="Para Lazer" value={result.paraLazer} icon={PartyPopper} tone="leisure" />
          <FinanceCard label="Gastos Fixos" value={finance.fixed_expenses} icon={TrendingDown} />
        </div>
      </main>
    </div>
  );
}
