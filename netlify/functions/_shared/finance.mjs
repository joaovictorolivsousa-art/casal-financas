// Helpers compartilhados pelas funções agendadas (send-reminders, month-closing).
// Espelham as fórmulas de src/lib/calculations.ts — se aquele arquivo mudar,
// atualize aqui também.

export function round2(v) {
  return Math.round(v * 100) / 100;
}

export const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Apelidos usados nas notificações no lugar do nome (chave: primeiro nome, minúsculo).
const NICKNAMES = { daya: "amor" };

export function greetingName(user) {
  const first = user.full_name.split(" ")[0];
  return NICKNAMES[first.toLowerCase()] ?? first;
}

export function sbClient(url, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  return {
    async get(path) {
      const res = await fetch(`${url}/rest/v1/${path}`, { headers });
      if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
      return res.json();
    },
    async remove(path) {
      await fetch(`${url}/rest/v1/${path}`, { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" } });
    },
  };
}

/** Renda, gastos e saldo do mês de uma pessoa (mesma fórmula do app). */
export function financeForMonth(finance, variableExpenseItems) {
  const income = round2(Number(finance.net_salary) + Number(finance.extra_income ?? 0));
  const fixed = round2(Number(finance.fixed_expenses));
  const variable = round2(variableExpenseItems.reduce((sum, e) => sum + Number(e.amount), 0));
  const saldoLivre = round2(income - fixed);
  const paraLazer = round2(Math.max(saldoLivre, 0) * (Number(finance.leisure_percentage) / 100));
  const saldoRestante = round2(saldoLivre - variable);
  return { income, fixed, variable, saldoLivre, paraLazer, saldoRestante };
}

/** Mesma regra do app: as metas são preenchidas na ordem de criação pelo total guardado. */
export function firstOpenGoal(goals, totalSaved) {
  let pool = totalSaved;
  for (const goal of goals) {
    const target = Number(goal.target_amount);
    const saved = Math.min(pool, target);
    pool = round2(pool - saved);
    if (target - saved > 0) return { title: goal.title, remaining: round2(target - saved) };
  }
  return null;
}

export function currentMonthISO(base = new Date()) {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export function previousMonthISO(base = new Date()) {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
}

export function monthLabel(isoMonth) {
  const date = new Date(`${isoMonth.slice(0, 7)}-01T12:00:00`);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
