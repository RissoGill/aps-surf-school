## Problema

Ao registar no Pro Account "Mensalidade de Janeiro 2026" do Francisco Queimado com `entry_date = 2026-06-16`, o sync usou **Junho 2026** (derivado da data de pagamento) em vez de **Janeiro 2026**. Resultado: a mensalidade de Junho foi marcada como paga e a de Janeiro continua "Unpaid". Além disso, a Gestão de Pagamentos não refresca após o sync.

## Correções

### 1. ProAccountTab — selector explícito de mês/ano de mensalidade
Em `src/components/admin/ProAccountTab.tsx`:
- Quando `formCategory === "monthly_fee"`, mostrar dois novos campos no formulário: **Mês de referência** (Select com 12 meses) e **Ano de referência** (Select), pré-preenchidos com o mês/ano da `entry_date`.
- Passar esses valores explícitos a `syncMonthlyFeePayment` em vez de derivar de `entry_date`.

### 2. `syncMonthlyFeePayment` — assinatura e invalidação
- Alterar assinatura para `(athleteId, billingMonth: string, billingYear: number, amount, t, queryClient)`.
- Remover o `format(parseISO(...), "MMMM")` derivado da data.
- No fim, invalidar a query da Gestão de Pagamentos: `queryClient.invalidateQueries({ queryKey: ['athlete-payments', athleteId] })`.
- Tornar a chamada `await` nos `onSuccess` de `addEntry` e `updateEntry`.

### 3. Traduções em falta
Adicionar em `src/i18n/translations/pt.json` e `en.json` (sob `proAccount`):
- `paymentNotFound` / `paymentSynced`
- Labels novos: `billingMonth`, `billingYear`

### 4. Correção pontual dos dados do Francisco Queimado (A15)
Via tool de dados:
- `PAY0825` (Junho 2026): repor `amount_paid=0`, `status='Unpaid'`, `payment_date=NULL`.
- `PAY0375` (Janeiro 2026): definir `amount_paid=207`, `status='Paid'`, `payment_date='2026-06-16'`.

## Notas técnicas
- Formato do mês na BD: inglês capitalizado ("January"…"December"), compatível com o que a Gestão de Pagamentos já normaliza.
- Sem alterações de schema nem de RLS.
