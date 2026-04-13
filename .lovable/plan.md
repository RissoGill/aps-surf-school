

# Novo Cartão de Registo de Despesas

## O que será criado

Um novo cartão no dashboard de administração para registar despesas com os campos: Nome (descrição), Data, Valor e upload de scan da factura. As despesas serão guardadas numa nova tabela na base de dados e os ficheiros no storage bucket existente ou num novo.

## Alterações

### 1. Nova tabela `expenses` (migração SQL)
- `id` (uuid, PK)
- `name` (text, NOT NULL) - descrição da despesa
- `expense_date` (date, NOT NULL)
- `amount` (numeric, NOT NULL)
- `invoice_url` (text) - URL do ficheiro no storage
- `created_at` (timestamptz, default now())
- `created_by` (text) - quem registou
- RLS: anon e authenticated com acesso total (seguindo o padrão do projecto)

### 2. Novo storage bucket `expense-invoices` (migração SQL)
- Bucket público para armazenar os scans das facturas

### 3. Novo componente `src/components/admin/ExpensesCard.tsx`
- Lista de despesas registadas (tabela com nome, data, valor, link para factura)
- Botão "Nova Despesa" que abre um dialog
- Dialog com formulário: Nome (input text), Data (datepicker), Valor (input number), Upload de ficheiro (scan da factura)
- Possibilidade de eliminar despesas
- Upload do ficheiro para o bucket `expense-invoices`

### 4. `src/pages/admin/AdministrationDashboard.tsx`
- Importar e adicionar o `ExpensesCard` no dashboard (após o CoachPaymentsCard)

### 5. Traduções (`pt.json` e `en.json`)
- Adicionar chaves para: "Despesas", "Nova Despesa", "Nome", "Data", "Valor", "Factura", "Registar", etc.

## Detalhes Técnicos
- Upload de ficheiros usa `supabase.storage.from('expense-invoices').upload()`
- O componente segue o padrão visual dos cartões existentes (CoachPaymentsCard, AlertsManagementCard)
- Formulário usa react-hook-form + zod para validação
- Datepicker usa o componente Calendar/Popover existente

