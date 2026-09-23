"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check } from "lucide-react";

interface InviteLinkProps {
  coupleId: string | null;
  inviteCode: string | null;
  onCreateInvite: () => Promise<void>;
}

/** Bloco de vínculo/convite: gera um código para o parceiro se conectar. */
export function InviteLink({ coupleId, inviteCode, onCreateInvite }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleCopy() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error("Não autenticado.");

      const { data: couple, error: findErr } = await supabase
        .from("couples")
        .select("*")
        .eq("invite_code", joinCode.trim())
        .eq("status", "pending")
        .single();
      if (findErr || !couple) throw new Error("Código inválido ou já utilizado.");

      await supabase.from("couples").update({ user_b_id: authUser.user.id, status: "active" }).eq("id", couple.id);
      await supabase.from("users").update({ couple_id: couple.id }).eq("id", authUser.user.id);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao vincular.");
    } finally {
      setJoining(false);
    }
  }

  if (coupleId) {
    return <p className="text-sm text-emerald-700">✓ Perfil vinculado ao seu par.</p>;
  }

  return (
    <div className="rounded-2xl border p-4 bg-slate-50 space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Convide seu par</p>
        {inviteCode ? (
          <div className="flex items-center gap-2">
            <code className="bg-white border rounded-lg px-3 py-1.5 text-sm">{inviteCode}</code>
            <button onClick={handleCopy} className="p-2 rounded-lg border hover:bg-white">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <button onClick={onCreateInvite} className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg">
            Gerar código de convite
          </button>
        )}
      </div>

      <div className="border-t pt-3">
        <p className="text-sm font-medium mb-2">Já tem um código do seu par?</p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Ex: a1b2c3d4"
            className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleJoin}
            disabled={joining || !joinCode}
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Vincular
          </button>
        </div>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
