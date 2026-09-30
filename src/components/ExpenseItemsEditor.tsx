import { useState } from "react";
import { Plus } from "lucide-react";
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
          {FIXED_CATEGORIES.map((cat) => {
            const current = values[cat.id] ?? 0;
            return (
              <label key={cat.id} className="text-sm">
                <span className="block mb-1 text-slate-500">{cat.label}</span>
                {readOnly ? (
                  <p className="border rounded-lg px-3 py-2 bg-slate-50">{formatBRL(current)}</p>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={current}
                      onChange={(e) => onChange(cat.id, Number(e.target.value))}
                      className="w-full min-w-0 border rounded-lg px-3 py-2"
                    />
                    <QuickAdd onAdd={(delta) => onChange(cat.id, current + delta)} />
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">Gastos Variáveis / Estilo de Vida</p>
        <p className="text-xs text-slate-400 mb-2">
          Sugestão de quanto gastar em cada categoria, dividindo o valor &quot;Para Lazer&quot; do mês. Use o{" "}
          <Plus className="h-3 w-3 inline -mt-0.5" /> para somar uma nova despesa sem calcular o total na mão.
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
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={spent}
                      onChange={(e) => onChange(cat.id, Number(e.target.value))}
                      className={`w-full min-w-0 border rounded-lg px-3 py-2 ${over ? "border-rose-300" : ""}`}
                    />
                    <QuickAdd onAdd={(delta) => onChange(cat.id, spent + delta)} />
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Campinho "+ valor": soma ao total da categoria ao confirmar, em vez de substituir. */
function QuickAdd({ onAdd }: { onAdd: (delta: number) => void }) {
  const [value, setValue] = useState("");

  function commit() {
    const delta = Number(value);
    if (delta > 0) {
      onAdd(Math.round(delta * 100) / 100);
    }
    setValue("");
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="number"
        min={0}
        placeholder="+"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className="w-14 border rounded-lg px-2 py-2 text-center"
        aria-label="Somar valor a esta categoria"
      />
      <button
        type="button"
        onClick={commit}
        className="shrink-0 border rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        aria-label="Somar"
        title="Somar ao valor já lançado"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
