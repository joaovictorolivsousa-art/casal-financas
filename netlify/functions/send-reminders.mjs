// Função agendada do Netlify: manda o lembrete por notificação push.
// Horário (UTC): terça e sexta 00:00 = segunda e quinta 21:00 no horário de Brasília.
// Para mudar a frequência, altere o cron abaixo.
import webpush from "web-push";

export const config = { schedule: "0 0 * * 2,5" };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@example.com";

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const round2 = (v) => Math.round(v * 100) / 100;

/** Mesma regra do app: as metas são preenchidas na ordem de criação pelo total guardado. */
function firstOpenGoal(goals, totalSaved) {
  let pool = totalSaved;
  for (const goal of goals) {
    const target = Number(goal.target_amount);
    const saved = Math.min(pool, target);
    pool = round2(pool - saved);
    if (target - saved > 0) return { title: goal.title, remaining: round2(target - saved) };
  }
  return null;
}

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("Variáveis de ambiente faltando (Supabase ou VAPID).");
    return new Response("config incompleta", { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const month = new Date().toISOString().slice(0, 7) + "-01";

  const [subs, users, finances, expenses, goals, savings] = await Promise.all([
    sb("push_subscriptions?select=*"),
    sb("users?select=id,full_name,couple_id"),
    sb(`incomes_expenses?reference_month=eq.${month}&select=*`),
    sb(`expense_items?reference_month=eq.${month}&kind=eq.variable&select=user_id,amount`),
    sb("goals?select=*&order=created_at.asc"),
    sb("savings?select=couple_id,amount"),
  ]);

  let sent = 0;
  for (const sub of subs) {
    const user = users.find((u) => u.id === sub.user_id);
    const finance = finances.find((f) => f.user_id === sub.user_id);
    const lines = [];

    if (!finance) {
      lines.push("Você ainda não registrou este mês. Abra o app e salve seus valores 👀");
    } else {
      const saldoLivre = Number(finance.net_salary) + Number(finance.extra_income ?? 0) - Number(finance.fixed_expenses);
      const paraLazer = Math.max(saldoLivre, 0) * (Number(finance.leisure_percentage) / 100);
      const gastoVariavel = expenses
        .filter((e) => e.user_id === sub.user_id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const restante = round2(paraLazer - gastoVariavel);
      lines.push(
        restante >= 0
          ? `Você ainda pode gastar ${brl(restante)} com lazer este mês.`
          : `Você passou ${brl(Math.abs(restante))} do lazer previsto este mês.`
      );
    }

    if (user?.couple_id) {
      const totalSaved = savings
        .filter((s) => s.couple_id === user.couple_id)
        .reduce((sum, s) => sum + Number(s.amount), 0);
      const open = firstOpenGoal(goals.filter((g) => g.couple_id === user.couple_id), totalSaved);
      if (open) lines.push(`Meta "${open.title}": faltam ${brl(open.remaining)}.`);
    }

    const payload = JSON.stringify({
      title: user ? `Oi, ${user.full_name.split(" ")[0]}!` : "Nós Dois & Dinheiro",
      body: lines.join(" "),
      url: "/dashboard",
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      // 404/410: o aparelho cancelou a inscrição — remove para não tentar de novo.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
          headers: { ...headers, Prefer: "return=minimal" },
        });
      } else {
        console.error("Falha ao enviar push:", err?.statusCode ?? err);
      }
    }
  }

  return new Response(`enviados: ${sent}/${subs.length}`);
};
