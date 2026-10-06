# Remover meses duplicados criados pelo "Gerar época" 2026/2027

## O que aconteceu (confirmado nos dados)
- O "Gerar época" criou 680 meses novos. Nenhum deles tem valor, data de pagamento ou nota.
- 652 desses meses repetem meses que os atletas já tinham. A duplicação afeta cerca de 110 atletas, não só a Constança.
- 15 meses novos estão certos e ficam:
  - Constança Maria Semedo (A128): setembro de 2026 a agosto de 2027, 12 meses. Alguns destes meses foram criados duas vezes; fica só uma cópia de cada.
  - Setembro de 2026 que faltava aos atletas A122, A124, A125, A126 e A127.
- Causa: o botão só lia os primeiros 1000 pagamentos da época, mas a época tem mais de 2000. Por isso não "via" muitos dos meses já existentes e criou-os outra vez.

## O que vou fazer
1. Apagar só as cópias criadas agora, que estão todas vazias. Os meses originais de cada atleta, com os pagamentos já registados, ficam iguais.
2. Corrigir o botão "Gerar época" para ler todos os pagamentos da época. Assim, só cria os meses que faltam mesmo e pode voltar a ser usado sem duplicar.
3. Confirmar que no fim cada atleta tem um único registo por mês na época 2026/2027.

## Nota
- Já havia 3 meses duplicados antigos, de antes de hoje. Não lhes vou mexer. Se quiser, posso mostrá-los depois para decidir o que fazer.

## Detalhes técnicos
- Apagar os pagamentos com número acima de PAY2501 que repetem atleta + mês + ano de um registo mais antigo. Dentro dos novos, fica o de número mais baixo.
- Na função de gerar época, ler os pagamentos já existentes por páginas de 1000 até ao fim. É a mesma correção já feita para o cálculo do próximo número.
- Voltar a publicar a função e confirmar, numa consulta, que não ficam grupos duplicados acima de PAY2501.
