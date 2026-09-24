"use client";
import { Wallet, PiggyBank, PartyPopper } from "lucide-react";
import { Header } from "@/components/Header";
import { FinanceCard } from "@/components/FinanceCard";
import { DistributionSlider } from "@/components/DistributionSlider";
import { useFinanceData } from "@/hooks/useFinanceData";
import { calculateDistribution } from "@/lib/calculations";

/** "Controle do Par" — mesmo layout do dashboard individual, porém 100% somente leitura. */
export default function PartnerDashboardPage() {
  const { partner, partnerFinance, loading } = useFinanceData();

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

  const finance = partnerFinance ?? { net_salary: 0, fixed_expenses: 0, save_percentage: 60, leisure_percentage: 40 };
  const result = calculateDistribution(finance.net_salary, finance.fixed_expenses, finance.save_percentage, finance.leisure_percentage);

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Controle de {partner.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">Modo somente leitura — você não pode editar estes valores.</p>
        </div>

        <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block mb-1 font-medium text-slate-600">Salário Líquido (R$)</span>
              <p className="border rounded-lg px-3 py-2 bg-slate-50">{finance.net_salary.toFixed(2)}</p>
            </div>
            <div>
              <span className="block mb-1 font-medium text-slate-600">Gastos Fixos Totais (R$)</span>
              <p className="border rounded-lg px-3 py-2 bg-slate-50">{finance.fixed_expenses.toFixed(2)}</p>
            </div>
          </div>

          <DistributionSlider savePercentage={finance.save_percentage} onChange={() => {}} readOnly />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <FinanceCard label="Saldo Livre" value={result.saldoLivre} icon={Wallet} />
          <FinanceCard label="A Guardar / Investir" value={result.aGuardar} icon={PiggyBank} tone="save" />
          <FinanceCard label="Para Lazer" value={result.paraLazer} icon={PartyPopper} tone="leisure" />
        </div>
      </main>
    </div>
  );
}
