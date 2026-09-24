export interface UserProfile {
  id: string;
  full_name: string;
  email?: string | null;
  avatar_url?: string | null;
  couple_id?: string | null;
}

export interface Couple {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  invite_code: string;
  status: "pending" | "active";
}

export interface IncomeExpense {
  id: string;
  user_id: string;
  reference_month: string; // ISO date, dia 1 do mês
  net_salary: number;
  fixed_expenses: number;
  save_percentage: number;
  leisure_percentage: number;
}

export interface Saving {
  id: string;
  user_id: string | null;
  couple_id: string;
  amount: number;
  source: "auto" | "manual";
  description?: string | null;
  reference_date: string;
}

export interface DistributionResult {
  saldoLivre: number;
  aGuardar: number;
  paraLazer: number;
  savePercentage: number;
  leisurePercentage: number;
}

export interface CoupleTotals {
  totalUserA: number;
  totalUserB: number;
  totalManual: number;
  totalGeral: number;
}
