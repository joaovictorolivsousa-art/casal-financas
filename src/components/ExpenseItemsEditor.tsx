import { FIXED_CATEGORIES, VARIABLE_CATEGORIES } from "@/lib/expense-categories";
import { formatBRL } from "@/lib/calculations";

interface ExpenseItemsEditorProps {
  /** category id -> valor gasto neste mês */
  values: Record<string, number>;
  onChange: (categoryId: string, amount: number) => void;
  /** "Para Lazer" do mês, usado para calcular a sugestão de cada categoria variável. */
  paraLazer: number;
  readOnly?: boolean;
}

/**
 * Edição (ou exibição, se readOnly) dos gastos do mês por categoria, separados em
 * fixos e variáveis. Nas categorias variáveis, mostra quanto seria razoável gastar
 * ali dentro do valor "Para Lazer" do mês, e sinaliza em vermelho quando já passou.
 */
export function ExpenseItemsEditor({ values, onChange, paraLazer, readOnly }: ExpenseItemsEditorProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Gastos Fixos</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {FIXED_CATEGORIES.map((cat) => (
            <label key={cat.id} className="text-sm">
              <span className="block mb-1 text-slate-500">{cat.label}</span>
              {readOnly ? (
                <p className="border rounded-lg px-3 py-2 bg-slate-50">{formatBRL(values[cat.id] ?? 0)}</p>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={values[cat.id] ?? 0}
                  onChange={(e) => onChange(cat.id, Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">Gastos Variáveis / Estilo de Vida</p>
        <p className="text-xs text-slate-400 mb-2">
          Sugestão de quanto gastar em cada categoria, dividindo o valor &quot;Para Lazer&quot; do mês.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {VARIABLE_CATEGORIES.map((cat) => {
            const suggested = Math.round(paraLazer * ((cat.suggestedPercentOfLeisure ?? 0) / 100) * 100) / 100;
            const spent = values[cat.id] ?? 0;
            const over = spent > suggested && suggested > 0;
            return (
              <label key={cat.id} className="text-sm">
                <span className="flex items-baseline justify-between mb-1">
                  <span className="text-slate-500">{cat.label}</span>
                  <span className={`text-xs ${over ? "text-rose-600" : "text-slate-400"}`}>
                    sugerido {formatBRL(suggested)}
                  </span>
                </span>
                {readOnly ? (
                  <p className={`border rounded-lg px-3 py-2 bg-slate-50 ${over ? "text-rose-600" : ""}`}>
                    {formatBRL(spent)}
                  </p>
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={spent}
                    onChange={(e) => onChange(cat.id, Number(e.target.value))}
                    className={`w-full border rounded-lg px-3 py-2 ${over ? "border-rose-300" : ""}`}
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
