# Melhorar responsividade do botão "Gerar época"

## Problema

O botão "Gerar época" ("Generate season") no cabeçalho do cartão de pesquisa da Gestão de Pagamentos ainda não se adapta bem a todos os ecrãs. O utilizador reporta que o label continua sem ser responsivo.

## O que vai ser feito

### 1. Diagnóstico visual

- Confirmar o estado atual do botão em mobile (≤640 px), tablet (641-1024 px) e desktop (>1024 px) usando screenshots.
- Verificar se o problema é:
  - texto cortado/overflow em larguras pequenas;
  - label a não alternar entre texto e ícone consoante o ecrã;
  - estado de carregamento a não ser perceptível.

### 2. Ajuste do label responsivo

- Aplicar classes Tailwind para que, em ecrãs pequenos, o botão mostre apenas o ícone do calendário (`<Calendar />`) e guarde o texto num atributo `title` para acessibilidade.
- Em ecrãs maiores (`sm:` em diante), mostrar ícone + texto "Gerar época" / "Generate season".
- Garantir que o estado de carregamento (`A gerar...` / `Generating...`) continua visível em todos os tamanhos, mantendo o spinner/ícone e, quando possível, o texto.

### 3. Ajuste do layout do cabeçalho

- Revisitar o `CardHeader` para que o seletor de época e o botão ocupem o espaço disponível sem esticar o cartão ou quebrar linhas de forma desigual.
- Considerar `flex-col` em mobile e `flex-row` a partir de `sm`, com ajuste de `gap` e `w-full` para o botão quando empilhado.

## Ficheiros afetados

- `src/pages/admin/PaymentManagement.tsx` — ajuste do JSX do botão e do layout do cabeçalho.
- Sem alterações na base de dados ou em novas dependências.

## Critérios de aceitação

- Em mobile, o botão não força o cartão a ter scroll horizontal nem faz overflow.
- Em desktop, o botão mantém o label "Gerar época" / "Generate season" completo ao lado do seletor.
- O estado de carregamento é claramente comunicado quando a geração está em curso.
