"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredProfileId, setStoredProfileId } from "@/lib/profile";
import { Couple, UserProfile } from "@/lib/types";

/** Os dois únicos perfis do app. Mude aqui se um dia os nomes mudarem. */
const PROFILE_NAMES = ["João", "Daya"] as const;

/**
 * Substitui o login. Não há tela de cadastro: na primeira vez que o app roda,
 * garante no banco que existem um casal e os perfis João e Daya (cria o que
 * faltar). Depois disso só pergunta "quem é você?" uma vez por aparelho.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "pick" | "ready">("loading");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ensureProfiles = useCallback(async (): Promise<UserProfile[]> => {
    // 1. Garante que existe um casal.
    const { data: existingCouple, error: coupleLoadErr } = await supabase
      .from("couples")
      .select("*")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (coupleLoadErr) throw coupleLoadErr;

    let couple = existingCouple as Couple | null;
    if (!couple) {
      const { data: created, error: coupleErr } = await supabase
        .from("couples")
        .insert({ status: "active" })
        .select()
        .single();
      if (coupleErr) throw coupleErr;
      couple = created as Couple;
    }

    // 2. Garante que João e Daya existem, vinculados a esse casal.
    const { data: existingUsers, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .in("full_name", PROFILE_NAMES as unknown as string[]);
    if (usersErr) throw usersErr;

    let all = (existingUsers ?? []) as UserProfile[];
    const missing = PROFILE_NAMES.filter((name) => !all.some((u) => u.full_name === name));
    if (missing.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert(missing.map((full_name) => ({ full_name, couple_id: couple!.id })))
        .select();
      if (insertErr) throw insertErr;
      all = [...all, ...((inserted ?? []) as UserProfile[])];
    }

    // 3. Vincula o casal aos dois perfis, se ainda não estiver.
    const joao = all.find((u) => u.full_name === "João");
    const daya = all.find((u) => u.full_name === "Daya");
    if (joao && daya && (couple.user_a_id !== joao.id || couple.user_b_id !== daya.id || couple.status !== "active")) {
      await supabase
        .from("couples")
        .update({ user_a_id: joao.id, user_b_id: daya.id, status: "active" })
        .eq("id", couple.id);
    }

    return PROFILE_NAMES.map((name) => all.find((u) => u.full_name === name)).filter(
      (u): u is UserProfile => Boolean(u)
    );
  }, [supabase]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await ensureProfiles();
      setProfiles(all);
      const stored = getStoredProfileId();
      setStatus(stored && all.some((p) => p.id === stored) ? "ready" : "pick");
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Erro ao carregar os perfis.");
      setStatus("pick");
    }
  }, [ensureProfiles]);

  useEffect(() => {
    load();
  }, [load]);

  function choose(id: string) {
    setStoredProfileId(id);
    setStatus("ready");
  }

  if (status === "loading") return <div className="p-8 text-center text-slate-400">Carregando...</div>;
  if (status === "ready") return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">💰 Nós Dois & Dinheiro</h1>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Quem é você?</p>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-left hover:bg-slate-50"
            >
              Sou {p.full_name}
            </button>
          ))}
          {profiles.length === 0 && !error && (
            <p className="text-sm text-slate-400">Preparando os perfis...</p>
          )}
        </div>

        {error && (
          <div className="text-xs text-rose-600 space-y-1">
            <p>{error}</p>
            <button onClick={load} className="underline">
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
