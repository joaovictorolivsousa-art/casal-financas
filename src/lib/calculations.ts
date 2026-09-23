/**
 * Funções puras de cálculo financeiro.
 * Sem efeitos colaterais, sem chamadas de rede — 100% testáveis isoladamente.
 */
import { DistributionResult, CoupleTotals, Saving } from "./types";

/** Saldo Livre = Salário Líquido - Gastos Fixos. Nunca retorna valor negativo oculto: o sinal é preservado. */
export function calculateSaldoLivre(netSalary: number, fixedExpenses: number): number {
  return round2(netSalary - fixedExpenses);
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

/** Formata número para BRL. */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
