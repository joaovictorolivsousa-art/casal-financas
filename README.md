# 💰 Nós Dois & Dinheiro — Controle Financeiro para Casais

App web para casais gerenciarem finanças com **autonomia individual** e **metas conjuntas**.

## Arquitetura

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + Lucide React + Recharts
- **Backend:** Supabase (PostgreSQL). Sem login: os dois enxergam o controle um do outro
- **Gastos:** por categoria (fixos e variáveis), com sugestão de quanto gastar em cada categoria variável — ver `src/lib/expense-categories.ts`
- **Lógica de negócio:** funções puras em TypeScript (`src/lib/calculations.ts`), sem dependência de framework — fáceis de testar isoladamente

## Estrutura de pastas

```
casal-financas/
├── supabase/schema.sql          # Tabelas, RLS, funções SQL
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── layout.tsx       # Escolha de perfil ("Quem é você?") no lugar do login
│   │       ├── page.tsx         # "Meu Controle" (edição)
│   │       ├── partner/page.tsx # "Controle do Par" (somente leitura)
│   │       └── future/page.tsx  # "Nosso Futuro" (consolidado do casal)
│   ├── components/              # Header, cards, slider, gráfico, seletor de perfil
│   ├── hooks/useFinanceData.ts  # Hook central de dados (Supabase)
│   ├── lib/calculations.ts      # Motor de distribuição e totais (puro/testável)
│   └── lib/profile.ts           # Perfil ativo neste aparelho (localStorage)
```

## Como rodar localmente

### 1. Crie um projeto no Supabase
Acesse [supabase.com](https://supabase.com), crie um projeto gratuito e copie a **URL** e a **anon key** (Project Settings → API).

### 2. Rode o schema do banco
No SQL Editor do Supabase, cole e execute o conteúdo de `supabase/schema.sql`.

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
# edite .env.local com sua URL e anon key
```

### 4. Instale as dependências e rode
```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

### 5. Teste o fluxo do casal
1. Abra o app. Na primeira vez, ele cria sozinho o casal e os dois perfis (**João** e **Daya** — nomes fixos em `PROFILE_NAMES`, em `src/components/ProfileGate.tsx`) e mostra "Quem é você?".
2. Escolha um perfil no seu aparelho; em outro aparelho (ou aba anônima), escolha o outro.
3. Ambos enxergam o painel um do outro (somente leitura) e a aba "Nosso Futuro" soma os dois. "Trocar perfil" no cabeçalho volta à escolha.

> Já tinha o banco criado com o login antigo? Rode `supabase/migrate_remove_login.sql` uma vez no SQL Editor. Não é preciso rodar `seed_casal.sql`: o app cria João e Daya sozinho no primeiro acesso — o script fica só como alternativa manual.
> Já tinha o banco criado antes de renda extra e gastos por categoria existirem? Rode `supabase/add_expenses_tracking.sql` uma vez.

## Motor de distribuição (regra de negócio)

```ts
Saldo Livre = Salário Líquido - Gastos Fixos
A Guardar   = max(Saldo Livre, 0) × (% Guardar / 100)
Para Lazer  = max(Saldo Livre, 0) × (% Lazer / 100)
```

- Padrão: 60% Guardar / 40% Lazer.
- O usuário pode ajustar livremente via slider, desde que a soma seja 100% (validado em `isValidDistribution`).
- Ao salvar o mês, o valor "A Guardar" é automaticamente lançado como aporte (`source: "auto"`) na tabela `savings`, alimentando o total conjunto.

## Segurança

- **Não há login.** As tabelas têm RLS ligada com uma política aberta (`anon`), então quem tiver a URL do app e a anon key consegue ler e gravar os dados.
- O modo "somente leitura" do Controle do Par é apenas de interface, não uma barreira no banco.
- Se quiser uma trava leve depois: proteção por senha na hospedagem (ex.: Vercel) ou um PIN compartilhado.
- A tabela `savings` é visível a ambos e aceita aportes manuais sem dono (`user_id = null`) para o histórico conjunto.

## Próximos passos sugeridos
- Histórico mensal navegável (atualmente mostra só o mês corrente).
- Notificações quando o parceiro atualiza os dados.
- Exportação de relatório em PDF.

## Lembretes por notificação (PWA)

O app pode ser instalado na tela inicial e avisa, de vez em quando, quanto ainda dá para gastar com lazer e quanto falta para as metas.

1. Rode `supabase/add_push_and_goals.sql` uma vez no SQL Editor (cria as tabelas de metas e de inscrições).
2. Gere o par de chaves **no seu PC** (a privada não deve passar por chat nem ir para o Git): `npx web-push generate-vapid-keys`
3. No Netlify (Site configuration → Environment variables) crie: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (chave pública), `VAPID_PRIVATE_KEY` (chave privada) e `VAPID_SUBJECT` (ex.: `mailto:seu@email.com`).
4. No `.env.local` coloque só `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
5. Faça um novo deploy (Trigger deploy → Clear cache and deploy site).
6. Em cada aparelho, abra o app, escolha o perfil e toque em **Ativar lembretes**.

Duas funções agendadas rodam com as mesmas variáveis:
- `send-reminders.mjs` — segunda e quinta, 21h (horário de Brasília): quanto ainda dá para gastar com lazer.
- `month-closing.mjs` — dia 1 de cada mês, 9h (horário de Brasília): resumo do mês anterior (renda, gastos, quanto sobrou/guardou e o maior gasto variável).

Os dois compartilham as fórmulas de cálculo em `netlify/functions/_shared/finance.mjs`. No iPhone, as notificações só funcionam com o app adicionado à Tela de Início (iOS 16.4+).
