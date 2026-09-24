"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredProfileId, setStoredProfileId } from "@/lib/profile";
import { UserProfile } from "@/lib/types";

/**
 * Substitui o login: pergunta "quem é você?" uma única vez por aparelho.
 * O app tem um único casal — o primeiro perfil criado abre o casal e o segundo entra nele.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "pick" | "ready">("loading");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    const { data, error: loadErr } = await supabase.from("users").select("*").order("created_at");
    if (loadErr) {
      setError(loadErr.message);
      setStatus("pick");
      return;
    }
    const list = (data ?? []) as UserProfile[];
    setProfiles(list);
    const stored = getStoredProfileId();
    setStatus(stored && list.some((p) => p.id === stored) ? "ready" : "pick");
  }, [supabase]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  function choose(id: string) {
    setStoredProfileId(id);
    setStatus("ready");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fullName = name.trim();
    if (!fullName) return;
    setBusy(true);
    setError(null);
    try {
      let coupleId = profiles.find((p) => p.couple_id)?.couple_id ?? null;
      if (!coupleId) {
        const { data: couple, error: coupleErr } = await supabase
          .from("couples")
          .insert({ status: "pending" })
          .select()
          .single();
        if (coupleErr) throw coupleErr;
        coupleId = couple.id as string;
      }

      const { data: created, error: userErr } = await supabase
        .from("users")
        .insert({ full_name: fullName, couple_id: coupleId })
        .select()
        .single();
      if (userErr) throw userErr;

      const link =
        profiles.length === 0 ? { user_a_id: created.id } : { user_b_id: created.id, status: "active" };
      await supabase.from("couples").update(link).eq("id", coupleId);

      setStoredProfileId(created.id);
      setName("");
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar perfil.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <div className="p-8 text-center text-slate-400">Carregando...</div>;
  if (status === "ready") return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">💰 Nós Dois & Dinheiro</h1>

        {profiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Quem é você?</p>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => choose(p.id)}
                className="w-full border rounded-lg px-3 py-2 text-sm text-left hover:bg-slate-50"
              >
                Sou {p.full_name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {profiles.length < 2 && (
          <form onSubmit={handleCreate} className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-slate-600">
              {profiles.length === 0 ? "Crie o seu perfil" : "Seu par ainda não está aqui? Crie o seu perfil"}
            </p>
            <input
              required
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Aguarde..." : "Criar perfil"}
            </button>
          </form>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
