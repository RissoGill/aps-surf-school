

# Conta Corrente para Atletas de Competição

## Resumo

Nova secção no painel admin para gerir a conta corrente de atletas com `surf_level = 'Competition'`. Regista prize money (crédito) e deduz despesas de acompanhamento, alojamento, avião e mensalidades (débito), mostrando saldo atualizado.

**Não se adiciona coluna `is_professional`** — usa-se o campo existente `surf_level = 'Competition'` para filtrar os atletas elegíveis.

## 1. Base de dados — nova tabela `pro_account_entries`

```sql
CREATE TABLE public.pro_account_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id text NOT NULL,
  entry_date date NOT NULL,
  type text NOT NULL,          -- 'prize_money' | 'expense'
  category text NOT NULL,      -- 'prize','coaching','accommodation','flights','monthly_fee','other'
  description text,            -- etapa/evento ou descrição
  amount numeric NOT NULL,     -- sempre positivo
  invoice_number text,         -- nº da factura
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE public.pro_account_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access pro_account_entries"
  ON public.pro_account_entries FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access pro_account_entries"
  ON public.pro_account_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

## 2. Frontend — novos ficheiros

### `src/pages/admin/ProAccountManagement.tsx`
- Página com header, seletor de atleta (Competition apenas), resumo de saldo, tabela de movimentos e formulário de adição.

### `src/components/admin/ProAccountTab.tsx`
- Componente principal com:
  - **Seletor de atleta** filtrado por `surf_level = 'Competition'`
  - **Cards de resumo**: Total Prize Money (verde), Total Despesas (vermelho), Saldo (azul)
  - **Tabela de movimentos**: Data, Tipo, Categoria, Descrição/Etapa, Valor, Nº Factura, Ações (editar/eliminar)
  - **Formulário**: Tipo (Prize Money/Despesa), Data, Categoria (dropdown), Descrição, Valor, Nº Factura
  - Prize money aparece a verde, despesas a vermelho

## 3. Integração

- **`src/App.tsx`**: adicionar rota `/admin/pro-accounts`
- **`src/pages/admin/AdministrationDashboard.tsx`**: adicionar card "Conta Corrente Pro" com ícone e navegação
- **`src/i18n/translations/pt.json`** e **`en.json`**: traduções para títulos, categorias e labels

## 4. Categorias de despesa

| Chave | PT | EN |
|-------|----|----|
| prize | Prize Money | Prize Money |
| coaching | Acompanhamento | Coaching |
| accommodation | Alojamento | Accommodation |
| flights | Avião | Flights |
| monthly_fee | Mensalidade | Monthly Fee |
| other | Outro | Other |

## Ficheiros a criar/alterar

1. **Migração SQL** — `pro_account_entries` + RLS
2. **`src/components/admin/ProAccountTab.tsx`** (novo)
3. **`src/pages/admin/ProAccountManagement.tsx`** (novo)
4. **`src/App.tsx`** — nova rota
5. **`src/pages/admin/AdministrationDashboard.tsx`** — card de acesso
6. **`src/i18n/translations/pt.json`** e **`en.json`** — traduções

