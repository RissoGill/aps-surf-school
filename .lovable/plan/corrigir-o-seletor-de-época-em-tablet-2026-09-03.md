# Corrigir o seletor de época em tablet

## Problema confirmado

No cabeçalho da pesquisa de pagamentos, o seletor e o botão passam para a mesma linha a partir de `sm`. O seletor conserva uma largura mínima de 180 px e o botão apresenta o texto completo, fazendo o botão ultrapassar o limite direito do cartão em larguras de tablet.

## Alteração

- Manter o seletor e o botão empilhados em mobile e tablet estreito.
- Passar ambos para a mesma linha apenas quando a largura disponível permitir acomodá-los sem overflow.
- Garantir que o seletor pode encolher corretamente e que o botão permanece totalmente dentro do cartão.
- Manter o botão com ícone e texto nos tamanhos em que caibam; usar a apresentação compacta nos tamanhos inferiores.

## Ficheiro

- `src/pages/admin/PaymentManagement.tsx` — ajustar exclusivamente as classes responsivas do bloco da época e do botão.

## Validação

- Confirmar visualmente em mobile, tablet e desktop que nenhum texto ou controlo sai do cartão.
- Confirmar que seletor e botão continuam funcionais e que o projeto compila sem erros.
