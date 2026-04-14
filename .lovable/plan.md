

# Corrigir texto sobreposto nos cartões de Alertas e Mensagens

## Problema
Os headers dos cartões usam `flex justify-between` mas não permitem wrap adequado, causando sobreposição de texto com os botões em viewports médios.

## Solução

### 1. `AlertsManagementCard.tsx` (linha 278)
- Mudar o div do header de `flex items-center justify-between` para `flex items-start justify-between flex-wrap gap-3`
- Mover os botões ("Show History" + "New Alert") para um container separado abaixo do título/descrição em vez de inline, usando layout empilhado

### 2. `CoachMessagesManagementCard.tsx` (linha 335)
- O wrapper já tem `flex-wrap gap-2` mas os botões competem com o título
- Mover os botões ("Show History", "New Message", Refresh) para uma linha separada abaixo do título

## Detalhe técnico
Em ambos os cartões, separar o bloco de título/descrição do bloco de botões em divs distintos com `flex-wrap`, garantindo que os botões passem para uma nova linha em vez de sobrepor o texto. Usar `w-full` ou layout em coluna no CardHeader para forçar a separação.

2 ficheiros a editar.

