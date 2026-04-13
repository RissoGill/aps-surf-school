

# Despesas Recorrentes Automáticas

## Resumo
Criar uma tabela `recurring_expenses` para definir despesas fixas mensais e uma Edge Function agendada via `pg_cron` que, no dia 1 de cada mês, gera automaticamente as entradas na tabela `expenses`.

## Arquitectura

```text
┌─────────────────────────┐     Dia 1 cada mês (pg_cron)
│  recurring_expenses     │ ──────────────────────────────┐
│  (templates fixos)      │                               ▼
└─────────────────────────┘              ┌──────────────────────┐
                                         │ Edge Function        │
                                         │ generate-recurring   │
                                         │ - Lê templates       │
                                         │ - Verifica duplicados│
                                         │ - Insere em expenses │
                                         └──────────────────────┘
```

## Alterações

### 1. Nova tabela `recurring_expenses` (migração)
```sql
CREATE TABLE recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  subcategory text,
  sub_subcategory text,
  amount numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
-- Mesmas políticas abertas que expenses (anon + authenticated full access)
```

### 2. Edge Function `generate-recurring-expenses`
- Lê todos os registos de `recurring_expenses` onde `is_active = true`
- Para cada um, verifica se já existe em `expenses` no mês/ano corrente (por `name + category + mês`)
- Se não existir, insere com `expense_date` = dia 1 do mês corrente
- Retorna contagem de despesas criadas

### 3. Agendar com `pg_cron` (via insert tool)
- Cron job no dia 1 de cada mês às 06:00 UTC chamando a Edge Function

### 4. UI no `ExpensesCard`
- Novo botão "Gerir Recorrentes" que abre um diálogo com:
  - Lista das despesas recorrentes activas (nome, categoria, valor)
  - Botão para adicionar nova recorrente (reutiliza campos de categoria/subcategoria existentes)
  - Toggle para activar/desactivar cada recorrente
  - Botão para eliminar
- Botão "Gerar Agora" para forçar a geração manual do mês corrente (chama a mesma Edge Function)

### 5. Traduções (`en.json` e `pt.json`)
- `expenses.recurring`: "Despesas Recorrentes" / "Recurring Expenses"
- `expenses.manageRecurring`: "Gerir Recorrentes" / "Manage Recurring"
- `expenses.generateNow`: "Gerar Agora" / "Generate Now"
- `expenses.addRecurring`: "Adicionar Recorrente" / "Add Recurring"
- `expenses.recurringActive`: "Ativa" / "Active"
- `expenses.recurringInactive`: "Inativa" / "Inactive"

## Secção Técnica
- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para inserir nas tabelas
- Verificação de duplicados: query `expenses` filtrando por `name`, `category` e `expense_date` no intervalo do mês corrente
- O cron job usa `pg_net` para chamar a função via HTTP POST
- A UI de gestão de recorrentes é um diálogo separado dentro do `ExpensesCard`, não uma página nova

