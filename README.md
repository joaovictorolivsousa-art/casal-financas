# 💰 Nós Dois & Dinheiro — Controle Financeiro para Casais

App web para casais gerenciarem finanças com **autonomia individual** e **metas conjuntas**.

## Arquitetura

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + Lucide React + Recharts
- **Backend:** Supabase (PostgreSQL). Sem login: os dois enxergam o controle um do outro
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
1. Abra o app e crie o perfil da **Pessoa A** ("Quem é você?").
2. Em uma aba anônima (ou outro aparelho), abra o app e crie o perfil da **Pessoa B** — ela entra automaticamente no mesmo casal.
3. Ambos enxergam o painel um do outro (somente leitura) e a aba "Nosso Futuro" soma os dois. "Trocar perfil" no cabeçalho volta à escolha.

> Já tinha o banco criado com o login antigo? Rode `supabase/migrate_remove_login.sql` uma vez no SQL Editor.

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
