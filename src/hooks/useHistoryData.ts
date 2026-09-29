"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExpenseItem, IncomeExpense, UserProfile } from "@/lib/types";
import { getStoredProfileId } from "@/lib/profile";

/** Carrega TODOS os meses salvos (lançamentos e gastos por categoria) do perfil ativo e do parceiro. */
export function useHistoryData() {
  const supabase = createClient();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [finances, setFinances] = useState<IncomeExpense[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const myId = getStoredProfileId();
      if (!myId) throw new Error("Perfil não selecionado.");

      const { data: meRow, error: meErr } = await supabase.from("users").select("*").eq("id", myId).single();
      if (meErr) throw meErr;
      setMe(meRow);

      let partnerRow: UserProfile | null = null;
      if (meRow.couple_id) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("couple_id", meRow.couple_id)
          .neq("id", meRow.id)
          .maybeSingle();
        partnerRow = data ?? null;
      }
      setPartner(partnerRow);

      const ids = [meRow.id, partnerRow?.id].filter(Boolean) as string[];

      const { data: financeRows, error: financeErr } = await supabase
        .from("incomes_expenses")
        .select("*")
        .in("user_id", ids)
        .order("reference_month", { ascending: false });
      if (financeErr) throw financeErr;
      setFinances(financeRows ?? []);

      const { data: expenseRows, error: expenseErr } = await supabase
        .from("expense_items")
        .select("*")
        .in("user_id", ids);
      if (expenseErr) throw expenseErr;
      setExpenses(expenseRows ?? []);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Erro ao carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  return { me, partner, finances, expenses, loading, error };
}
