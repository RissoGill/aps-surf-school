# Completar a época 2026/2027 nos pagamentos

## Situação atual

Na base de dados já existem registos de mensalidade para todos os meses de **Setembro 2026 a Junho 2027** (88 registos por mês). Faltam apenas:

- **Julho 2027**
- **Agosto 2027**

## O que vai ser feito

Criar os registos de pagamento em falta (Julho e Agosto de 2027) para os atletas activos com plano mensal, ficando a época completa de Setembro 2026 a Agosto 2027 visível na Gestão de Pagamentos.

Cada novo registo é criado com:
- Valor devido: 0
- Valor pago: 0
- Estado: Unpaid

Atletas com plano `pack...` ou `daily` são excluídos, tal como na geração automática existente.

## Detalhes técnicos

- Inserção de dados em `public.payments` (sem alterações de estrutura).
- `payment_id` gerado sequencialmente a partir do máximo actual (`PAY<n>`).
- Protecção com `NOT EXISTS` sobre (`athlete_id`, `month`, `year`) para não duplicar caso algum registo já exista.
- Conjunto de atletas: `atletas` com `is_active` diferente de falso e `plan_type` nulo ou fora de `pack%`/`daily`.
