// Função agendada do Netlify: resumo do mês que fechou.
// Horário (UTC): dia 1 às 12:00 = 9h no horário de Brasília.
import webpush from "web-push";
import {
  brl,
  financeForMonth,
  firstOpenGoal,
  greetingName,
  monthLabel,
  previousMonthISO,
  round2,
  sbClient,
} from "./_shared/finance.mjs";

export const config = { schedule: "0 12 1 * *" };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@example.com";

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("Variáveis de ambiente faltando (Supabase ou VAPID).");
    return new Response("config incompleta", { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const sb = sbClient(SUPABASE_URL, SUPABASE_KEY);

  const month = previousMonthISO();
  const label = monthLabel(month);

  const [subs, users, finances, expenses, goals, savings] = await Promise.all([
    sb.get("push_subscriptions?select=*"),
    sb.get("users?select=id,full_name,couple_id"),
    sb.get(`incomes_expenses?reference_month=eq.${month}&select=*`),
    sb.get(`expense_items?reference_month=eq.${month}&select=user_id,category,kind,amount`),
    sb.get("goals?select=*&order=created_at.asc"),
    sb.get("savings?select=couple_id,user_id,amount,source,reference_date"),
  ]);

  let sent = 0;
  for (const sub of subs) {
    const user = users.find((u) => u.id === sub.user_id);
    const finance = finances.find((f) => f.user_id === sub.user_id);
    const lines = [];

    if (!finance) {
      lines.push(`Você não fechou ${label} — sem registro para resumir.`);
    } else {
      const userItems = expenses.filter((e) => e.user_id === sub.user_id);
      const { income, fixed, variable, saldoRestante } = financeForMonth(
        finance,
        userItems.filter((e) => e.kind === "variable")
      );

      const guardado = savings.find(
        (s) => s.user_id === sub.user_id && s.source === "auto" && s.reference_date === month
      );

      lines.push(
        `${label}: renda ${brl(income)}, gastos ${brl(round2(fixed + variable))} (${brl(variable)} em variáveis), sobrou ${brl(saldoRestante)}.`
      );
      if (guardado) lines.push(`Guardado: ${brl(Number(guardado.amount))}.`);

      const topVariable = [...userItems.filter((e) => e.kind === "variable")].sort(
        (a, b) => Number(b.amount) - Number(a.amount)
      )[0];
      if (topVariable) lines.push(`Maior gasto variável: ${brl(Number(topVariable.amount))}.`);
    }

    if (user?.couple_id) {
      const totalSaved = round2(
        savings.filter((s) => s.couple_id === user.couple_id).reduce((sum, s) => sum + Number(s.amount), 0)
      );
      const open = firstOpenGoal(goals.filter((g) => g.couple_id === user.couple_id), totalSaved);
      if (open) lines.push(`Meta "${open.title}": faltam ${brl(open.remaining)}.`);
    }

    const payload = JSON.stringify({
      title: user ? `Fechamos ${label}, ${greetingName(user)}!` : `Fechamos ${label}!`,
      body: lines.join(" "),
      url: "/dashboard/history",
    });

    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      sent++;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await sb.remove(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`);
      } else {
        console.error("Falha ao enviar push:", err?.statusCode ?? err);
      }
    }
  }

  return new Response(`enviados: ${sent}/${subs.length}`);
};
