import { LucideIcon } from "lucide-react";
import { formatBRL } from "@/lib/calculations";

interface FinanceCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "save" | "leisure" | "neutral" | "danger";
}

const toneStyles: Record<NonNullable<FinanceCardProps["tone"]>, string> = {
  save: "bg-emerald-50 text-emerald-700 border-emerald-200",
  leisure: "bg-amber-50 text-amber-700 border-amber-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

/** Card simples de resultado financeiro, usado no dashboard individual e do parceiro. */
export function FinanceCard({ label, value, icon: Icon, tone = "neutral" }: FinanceCardProps) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex items-center gap-4 ${toneStyles[tone]}`}>
      <div className="shrink-0 rounded-xl bg-white/60 p-2.5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
        <p className="text-lg sm:text-2xl font-semibold truncate">{formatBRL(value)}</p>
      </div>
    </div>
  );
}
