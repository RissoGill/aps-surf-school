# Saldo anterior a zero no A63 (26/27)

## O que foi verificado

Abri a ficha do Tiago Alegria (A63) na aplicação a correr agora, época 2026/2027, e o cartão mostra:

- Saldo anterior: **€414,00** ("€0,00 histórico + €414,00 de épocas anteriores")
- Total em dívida: **€414,00**

Ou seja, com o código atual o valor já é o correto (Junho + Agosto de 2026 por pagar). No ecrã da Teresa aparece 0 no saldo anterior, o que aponta para o navegador ainda estar a usar uma versão antiga da página em memória.

## Passos

1. Confirmar com um recarregamento forçado da página de Gestão de Pagamentos (fechar e reabrir a página, ou recarregar ignorando a cópia guardada) e voltar a escolher o atleta e a época 26/27.
2. Se o valor passar a €414, não é preciso mexer em nada — fica só a confirmação.
3. Se continuar a zero, aplicar uma correção de robustez na página de pagamentos:
   - garantir que os dados de todos os pagamentos do atleta são recarregados sempre que se muda de atleta ou de época (chave de consulta a incluir a época e sem reaproveitar resultados antigos);
   - forçar o recálculo do saldo anterior acumulado quando a época muda.
4. Voltar a validar A63 nas épocas 25/26 (€414 no total em dívida, €0 de saldo anterior) e 26/27 (€414 de saldo anterior).

## Detalhes técnicos

`src/pages/admin/PaymentManagement.tsx`
- Consulta `athlete-all-payments`: acrescentar `selectedSeason` à `queryKey` e definir `staleTime: 0` / `refetchOnMount: 'always'` para eliminar leituras de cache antigas.
- `calculatePreSeasonOutstanding()` já está correta (soma `max(amount_due - amount_paid, 0)` de todos os registos com serial anterior a Setembro da época escolhida) — passa apenas a ser memorizada com dependência em `selectedSeason` e `allAthletePayments`.

Sem alterações à base de dados.
