"use client";
import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/calculations";
import { Goal } from "@/lib/types";

interface GoalProgress {
  goal: Goal;
  saved: number;
  remaining: number;
  pct: number;
}

interface GoalsSectionProps {
  progress: GoalProgress[];
  onAdd: (title: string, targetAmount: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** Metas do casal: quanto juntar e para quê. O total guardado enche as metas na ordem de criação. */
export function GoalsSection({ progress, onAdd, onDelete }: GoalsSectionProps) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(target);
    if (!title.trim() || !(value > 0)) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(title.trim(), value);
      setTitle("");
      setTarget("");
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Não foi possível criar a meta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Apagar a meta "${name}"?`)) return;
    try {
      await onDelete(id);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Não foi possível apagar a meta.");
    }
  }

  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-emerald-600" />
        <h2 className="font-semibold">Nossas Metas</h2>
      </div>

      {progress.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma meta ainda. Crie a primeira abaixo, por exemplo &quot;Geladeira&quot;.</p>
      ) : (
        <ul className="space-y-4">
          {progress.map(({ goal, saved, remaining, pct }) => (
            <li key={goal.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm">{goal.title}</span>
                <button
                  onClick={() => handleDelete(goal.id, goal.title)}
                  className="text-slate-400 hover:text-rose-600"
                  aria-label={`Apagar meta ${goal.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-emerald-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {formatBRL(saved)} de {formatBRL(goal.target_amount)} ({pct}%){" "}
                {remaining > 0 ? `· faltam ${formatBRL(remaining)}` : "· meta atingida 🎉"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">Nova meta</p>
        <div className="grid sm:grid-cols-[2fr_1fr_auto] gap-3">
          <input
            type="text"
            placeholder="Para quê? Ex.: Geladeira"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Quanto juntar (R$)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-1 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>
        <p className="text-xs text-slate-400">
          O total guardado pelo casal enche as metas na ordem em que foram criadas.
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
    </div>
  );
}
