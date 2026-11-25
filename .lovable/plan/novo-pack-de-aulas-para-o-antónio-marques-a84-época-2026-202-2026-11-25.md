# Novo pack de aulas para o António Marques (A84) — época 2026/2027

## Situação
- O António está no plano "pack" e não tem nenhum pagamento na época 2026/2027, nem pack registado.
- Na Gestão de Pagamentos, um pack regista-se editando uma linha de pagamento: escolhe-se Pack 1, 5 ou 10, o valor e "Pago". Ao gravar, o pack é criado sozinho.
- Como o António não tem nenhuma linha nesta época, não há onde fazer isso. O "Gerar época" também não cria linhas para atletas de pack.

## O que vou fazer
1. Criar uma linha de pagamento para o António em Novembro 2026, "por pagar", 0€, sem plano escolhido (com o próximo número de pagamento livre).
2. Confirmar que a linha aparece na Gestão de Pagamentos, época 2026/2027.

## O que a Teresa faz depois
- Abrir o António na Gestão de Pagamentos, carregar no lápis da linha de Novembro, escolher o pack (1, 5 ou 10), pôr o valor, a data e "Pago", e gravar.
- O pack fica criado e os treinos passam a ser descontados.
- Para packs seguintes nesta época, digam-me e crio outra linha (ou, se preferir, posso acrescentar depois um botão "Novo pack" para não depender de mim).

## Detalhe técnico
- Inserção em `payments` (athlete_id A84, month Novembro no formato usado pelos outros registos, year 2026, status unpaid, amount_due/amount_paid 0, plan_type nulo) com payment_id sequencial a seguir ao maior PAYxxxx.
- Sem alterações ao código.
