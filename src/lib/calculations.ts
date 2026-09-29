/**
 * Funções puras de cálculo financeiro.
 * Sem efeitos colaterais, sem chamadas de rede — 100% testáveis isoladamente.
 */
import { DistributionResult, CoupleTotals, ExpenseItem, ExpenseKind, Goal, IncomeExpense, MonthSummary, Saving } from "./types";

/** Saldo Livre = Salário Líquido - Gastos Fixos. Nunca retorna valor negativo oculto: o sinal é preservado. */
export function calculateSaldoLivre(netSalary: number, fixedExpenses: number): number {
  return round2(netSalary - fixedExpenses);
}

/**
 * Saldo Livre "de verdade" do mês: o que sobra depois dos gastos fixos E dos variáveis.
 * A divisão guardar/lazer continua sendo calculada sobre (renda - fixos), como um plano;
 * os variáveis saem do saldo à medida que são lançados.
 */
export function calculateSaldoRestante(saldoLivre: number, variableExpenses: number): number {
  return round2(saldoLivre - variableExpenses);
}

/** Valida se duas porcentagens somam exatamente 100 (com tolerância de arredondamento). */
export function isValidDistribution(savePct: number, leisurePct: number): boolean {
  return Math.abs(savePct + leisurePct - 100) < 0.01 && savePct >= 0 && leisurePct >= 0;
}

/**
 * Motor de distribuição dinâmica.
 * Padrão: 60% Guardar / 40% Lazer. Aceita qualquer split customizado que some 100%.
 */
export function calculateDistribution(
  netSalary: number,
  fixedExpenses: number,
  savePercentage: number = 60,
  leisurePercentage: number = 40
): DistributionResult {
  if (!isValidDistribution(savePercentage, leisurePercentage)) {
    throw new Error("A soma das porcentagens de distribuição deve ser 100%.");
  }

  const saldoLivre = calculateSaldoLivre(netSalary, fixedExpenses);
  // Se o saldo livre for negativo, não faz sentido "distribuir" — zera as duas pontas.
  const base = Math.max(saldoLivre, 0);

  return {
    saldoLivre,
    aGuardar: round2(base * (savePercentage / 100)),
    paraLazer: round2(base * (leisurePercentage / 100)),
    savePercentage,
    leisurePercentage,
  };
}

/**
 * Soma o total guardado por cada membro do casal + aportes manuais registrados
 * diretamente na conta conjunta.
 */
export function calculateCoupleTotals(savings: Saving[], userAId: string, userBId?: string | null): CoupleTotals {
  let totalUserA = 0;
  let totalUserB = 0;
  let totalManual = 0;

  for (const s of savings) {
    if (s.user_id === userAId) totalUserA += s.amount;
    else if (userBId && s.user_id === userBId) totalUserB += s.amount;
    else if (s.user_id === null) totalManual += s.amount;
  }

  return {
    totalUserA: round2(totalUserA),
    totalUserB: round2(totalUserB),
    totalManual: round2(totalManual),
    totalGeral: round2(totalUserA + totalUserB + totalManual),
  };
}

/** Agrupa aportes por mês (YYYY-MM) para alimentar o gráfico de evolução conjunta. */
export function groupSavingsByMonth(savings: Saving[]): { month: string; total: number }[] {
  const map = new Map<string, number>();

  for (const s of savings) {
    const month = s.reference_date.slice(0, 7); // "YYYY-MM"
    map.set(month, round2((map.get(month) ?? 0) + s.amount));
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

/** Soma os itens de gasto de um determinado tipo (fixo ou variável). */
export function sumExpensesByKind(items: ExpenseItem[], kind: ExpenseKind): number {
  return round2(items.filter((i) => i.kind === kind).reduce((sum, i) => sum + i.amount, 0));
}

/**
 * Distribui o total guardado pelas metas, na ordem de criação: a primeira meta
 * enche antes de a segunda começar a receber.
 */
export function allocateToGoals(
  goals: Goal[],
  totalSaved: number
): { goal: Goal; saved: number; remaining: number; pct: number }[] {
  let pool = Math.max(totalSaved, 0);
  return goals.map((goal) => {
    const saved = round2(Math.min(pool, goal.target_amount));
    pool = round2(pool - saved);
    const remaining = round2(goal.target_amount - saved);
    const pct = goal.target_amount > 0 ? Math.min(100, Math.round((saved / goal.target_amount) * 100)) : 0;
    return { goal, saved, remaining, pct };
  });
}

/** Monta o resumo de cada mês salvo (mais recente primeiro) a partir dos lançamentos e gastos por categoria. */
export function buildMonthlyHistory(finances: IncomeExpense[], expenses: ExpenseItem[]): MonthSummary[] {
  return finances
    .map((f) => {
      const items = expenses.filter((e) => e.user_id === f.user_id && e.reference_month === f.reference_month);
      const income = round2(Number(f.net_salary) + Number(f.extra_income ?? 0));
      const fixed = round2(Number(f.fixed_expenses));
      const variable = sumExpensesByKind(items, "variable");
      const saldoLivre = calculateSaldoLivre(income, fixed);
      return {
        month: f.reference_month,
        income,
        fixed,
        variable,
        saldoRestante: calculateSaldoRestante(saldoLivre, variable),
        aGuardar: round2(Math.max(saldoLivre, 0) * (Number(f.save_percentage) / 100)),
        byCategory: items
          .filter((i) => Number(i.amount) > 0)
          .map((i) => ({ category: i.category, kind: i.kind, amount: Number(i.amount) })),
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));
}

/** "2026-09-01" -> "Setembro de 2026" (long) ou "set/26" (short). */
export function formatMonth(isoMonth: string, style: "long" | "short" = "long"): string {
  const date = new Date(`${isoMonth.slice(0, 7)}-01T12:00:00`);
  if (style === "short") {
    const m = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return `${m}/${String(date.getFullYear()).slice(2)}`;
  }
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Formata número para BRL. */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
