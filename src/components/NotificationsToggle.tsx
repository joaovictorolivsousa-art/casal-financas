"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getStoredProfileId } from "@/lib/profile";
import { urlBase64ToUint8Array } from "@/lib/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Liga/desliga os lembretes por notificação neste aparelho. A inscrição fica salva
 * junto do perfil ativo (João ou Daya), para o lembrete falar do controle certo.
 * Some se o navegador não suporta push ou se a chave VAPID não foi configurada.
 */
export function NotificationsToggle() {
  const supabase = createClient();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;
    setSupported(ok);
    if (!ok) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permissão negada. Libere as notificações nas configurações do navegador.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        }));

      const json = sub.toJSON();
      const { error: saveErr } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: getStoredProfileId(),
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
        { onConflict: "endpoint" }
      );
      if (saveErr) throw saveErr;

      setSubscribed(true);
      // Notificação local de teste: confirma na hora que tudo funciona neste aparelho.
      await reg.showNotification("Lembretes ativados ✅", {
        body: "Vamos te avisar de vez em quando quanto vocês ainda podem gastar.",
        icon: "/icons/icon-192.png",
      });
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Não foi possível ativar os lembretes.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Não foi possível desativar.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={subscribed ? disable : enable}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"
      >
        {subscribed ? <Bell className="h-4 w-4 text-emerald-600" /> : <BellOff className="h-4 w-4" />}
        {subscribed ? "Lembretes ativos" : "Ativar lembretes"}
      </button>
      {error && <span className="text-xs text-rose-600 max-w-52">{error}</span>}
    </div>
  );
}
