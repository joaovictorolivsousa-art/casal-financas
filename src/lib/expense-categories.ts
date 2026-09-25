import { ExpenseKind } from "./types";

export interface ExpenseCategoryConfig {
  /** Id estável salvo na coluna `category` do banco — não traduzir/renomear depois de já ter dados salvos. */
  id: string;
  label: string;
  kind: ExpenseKind;
  /**
   * Só para categorias variáveis: sugestão de quanto do valor "Para Lazer" do mês
   * é razoável ir para essa categoria. É só uma referência, não trava nada.
   * A soma das categorias variáveis fecha em 100%.
   */
  suggestedPercentOfLeisure?: number;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  // --- Gastos fixos (contas que se repetem todo mês, com valor parecido) ---
  { id: "moradia", label: "Aluguel/Financiamento", kind: "fixed" },
  { id: "contas", label: "Água, Luz e Internet", kind: "fixed" },
  { id: "transporte_fixo", label: "Transporte (combustível/app fixo)", kind: "fixed" },
  { id: "assinaturas", label: "Assinaturas e Streaming", kind: "fixed" },
  { id: "saude", label: "Saúde/Plano", kind: "fixed" },
  { id: "educacao", label: "Educação", kind: "fixed" },
  { id: "outros_fixos", label: "Outros gastos fixos", kind: "fixed" },

  // --- Gastos variáveis / estilo de vida (o que dá pra ajustar mês a mês) ---
  { id: "fast_food", label: "Fast Food/Delivery", kind: "variable", suggestedPercentOfLeisure: 15 },
  { id: "acessorios", label: "Acessórios", kind: "variable", suggestedPercentOfLeisure: 10 },
  { id: "maquiagem", label: "Maquiagem/Beleza", kind: "variable", suggestedPercentOfLeisure: 10 },
  { id: "roupas", label: "Roupas", kind: "variable", suggestedPercentOfLeisure: 15 },
  { id: "saidas", label: "Bares/Cinema/Passeios", kind: "variable", suggestedPercentOfLeisure: 25 },
  { id: "hobbies", label: "Hobbies", kind: "variable", suggestedPercentOfLeisure: 15 },
  { id: "outros_variaveis", label: "Outros gastos variáveis", kind: "variable", suggestedPercentOfLeisure: 10 },
];

export const FIXED_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.kind === "fixed");
export const VARIABLE_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.kind === "variable");

export function categoryLabel(id: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
