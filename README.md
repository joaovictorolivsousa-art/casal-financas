# 💰 Nós Dois & Dinheiro — Controle Financeiro para Casais

App web para casais gerenciarem finanças com **autonomia individual** e **metas conjuntas**.

## Arquitetura

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + Lucide React + Recharts
- **Backend:** Supabase (Auth + PostgreSQL + Row Level Security)
- **Lógica de negócio:** funções puras em TypeScript (`src/lib/calculations.ts`), sem dependência de framework — fáceis de testar isoladamente

## Estrutura de pastas

```
casal-financas/
├── supabase/schema.sql          # Tabelas, RLS, funções SQL
├── src/
│   ├── app/
│   │   ├── login/page.tsx       # Login/cadastro
│   │   └── dashboard/
│   │       ├── page.tsx         # "Meu Controle" (edição)
│   │       ├── partner/page.tsx # "Controle do Par" (somente leitura)
│   │       └── future/page.tsx  # "Nosso Futuro" (consolidado do casal)
│   ├── components/              # Header, cards, slider, gráfico, convite
│   ├── hooks/useFinanceData.ts  # Hook central de dados (Supabase)
│   ├── lib/calculations.ts      # Motor de distribuição e totais (puro/testável)
│   └── middleware.ts            # Protege rotas /dashboard/*
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
1. Crie a conta do **Usuário A**, vá em "Meu Controle" e gere um **código de convite**.
2. Em uma aba anônima, crie a conta do **Usuário B** e cole o código em "Já tem um código do seu par?".
3. Ambos agora enxergam o painel um do outro (somente leitura) e a aba "Nosso Futuro" soma os dois.

## Motor de distribuição (regra de negócio)

```ts
Saldo Livre = Salário Líquido - Gastos Fixos
A Guardar   = max(Saldo Livre, 0) × (% Guardar / 100)
Para Lazer  = max(Saldo Livre, 0) × (% Lazer / 100)
```

- Padrão: 60% Guardar / 40% Lazer.
- O usuário pode ajustar livremente via slider, desde que a soma seja 100% (validado em `isValidDistribution`).
- Ao salvar o mês, o valor "A Guardar" é automaticamente lançado como aporte (`source: "auto"`) na tabela `savings`, alimentando o total conjunto.

## Segurança (RLS)

- Cada usuário só **edita** seus próprios lançamentos (`incomes_expenses`).
- O parceiro vinculado (`couple_id` igual) tem **select** liberado — visão somente leitura, sem `update`/`delete`.
- A tabela `savings` é visível a ambos os membros do casal e aceita aportes manuais sem dono (`user_id = null`) para o histórico conjunto.

## Próximos passos sugeridos
- Histórico mensal navegável (atualmente mostra só o mês corrente).
- Notificações quando o parceiro atualiza os dados.
- Exportação de relatório em PDF.
