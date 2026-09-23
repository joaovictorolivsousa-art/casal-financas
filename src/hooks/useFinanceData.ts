"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IncomeExpense, Saving, UserProfile } from "@/lib/types";

/**
 * Hook central de dados financeiros. Busca:
 * - o perfil do usuário logado e do parceiro (se vinculado)
 * - os lançamentos do mês corrente de ambos
 * - todos os aportes ("savings") visíveis ao casal
 *
 * Reaproveitado pelas 3 visões: "Meu Controle", "Controle do Par", "Nosso Futuro".
 */
export function useFinanceData() {
  const supabase = createClient();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [myFinance, setMyFinance] = useState<IncomeExpense | null>(null);
  const [partnerFinance, setPartnerFinance] = useState<IncomeExpense | null>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error("Não autenticado.");

      const { data: meRow, error: meErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.user.id)
        .single();
      if (meErr) throw meErr;
      setMe(meRow);

      // Parceiro: qualquer usuário do mesmo couple_id que não seja eu
      if (meRow.couple_id) {
        const { data: partnerRow } = await supabase
          .from("users")
          .select("*")
          .eq("couple_id", meRow.couple_id)
          .neq("id", meRow.id)
          .maybeSingle();
        setPartner(partnerRow ?? null);

        const { data: savingsRows } = await supabase
          .from("savings")
          .select("*")
          .eq("couple_id", meRow.couple_id)
          .order("reference_date", { ascending: true });
        setSavings(savingsRows ?? []);

        if (partnerRow) {
          const { data: pf } = await supabase
            .from("incomes_expenses")
            .select("*")
            .eq("user_id", partnerRow.id)
            .eq("reference_month", currentMonth)
            .maybeSingle();
          setPartnerFinance(pf ?? null);
        }
      }

      const { data: mf } = await supabase
        .from("incomes_expenses")
        .select("*")
        .eq("user_id", meRow.id)
        .eq("reference_month", currentMonth)
        .maybeSingle();
      setMyFinance(mf ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [supabase, currentMonth]);

  useEffect(() => {
    load();
  }, [load]);

  /** Upsert dos dados financeiros do mês corrente do usuário logado. */
  const saveMyFinance = useCallback(
    async (input: Pick<IncomeExpense, "net_salary" | "fixed_expenses" | "save_percentage" | "leisure_percentage">) => {
      if (!me) return;
      const { error: upsertErr } = await supabase
        .from("incomes_expenses")
        .upsert(
          { user_id: me.id, reference_month: currentMonth, ...input },
          { onConflict: "user_id,reference_month" }
        );
      if (upsertErr) throw upsertErr;
      await load();
    },
    [supabase, me, currentMonth, load]
  );

  /** Registra um aporte manual na conta conjunta (visível aos dois). */
  const addManualSaving = useCallback(
    async (amount: number, description?: string) => {
      if (!me?.couple_id) throw new Error("Vincule-se a um parceiro primeiro.");
      const { error: insertErr } = await supabase.from("savings").insert({
        user_id: null,
        couple_id: me.couple_id,
        amount,
        source: "manual",
        description,
      });
      if (insertErr) throw insertErr;
      await load();
    },
    [supabase, me, load]
  );

  return { me, partner, myFinance, partnerFinance, savings, loading, error, saveMyFinance, addManualSaving, reload: load };
}
