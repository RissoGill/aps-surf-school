
Objetivo: corrigir o layout dos cards de resumo da Conta Corrente Pro, porque o problema já não parece ser o `pt-0`; pela screenshot, o conteúdo está dentro do card mas o card ficou demasiado estreito para o texto.

O que está a causar o problema:
- A página usa `mobile-container`, que em `src/index.css` aplica `max-w-sm`.
- Isso limita a área principal a cerca de 384px mesmo num ecrã mais largo.
- Dentro dessa largura, a grelha continua em `grid-cols-2`, por isso cada card fica muito estreito.
- O texto dos valores e labels parte em demasiadas linhas e dá a sensação de estar “fora” do cartão.

Plano de correção:
1. Ajustar o content width da página `src/pages/admin/ProAccountManagement.tsx`
   - Substituir `mobile-container py-6` por um container mais largo para admin, por exemplo algo como `max-w-6xl mx-auto px-4 py-6`.
   - Isto dá espaço real aos cards e à tabela.

2. Tornar a grelha dos summary cards mais responsiva em `src/components/admin/ProAccountTab.tsx`
   - Trocar `grid grid-cols-2 md:grid-cols-4 gap-4` por uma grelha que só mostre 4 colunas quando houver largura suficiente.
   - Exemplo de abordagem: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
   - Assim, em larguras intermédias os cards não ficam esmagados.

3. Proteger o conteúdo de cada card contra quebra excessiva
   - Aplicar classes de contenção aos valores e labels:
     - valor: reduzir ligeiramente o tamanho em ecrãs pequenos (`text-base sm:text-lg`) e usar `break-words` só se necessário.
     - labels: usar `leading-tight`.
   - No card com data, manter a data numa linha controlada (`text-[11px]`/`whitespace-nowrap` se couber).

4. Garantir consistência visual dos cards
   - Opcionalmente aplicar `h-full` aos `Card` para alinhar alturas.
   - Se necessário, adicionar `overflow-hidden` ao `Card` apenas como proteção visual, mas isto não deve ser a correção principal.

Ficheiros a alterar:
- `src/pages/admin/ProAccountManagement.tsx`
- `src/components/admin/ProAccountTab.tsx`

Detalhes técnicos:
```text
Problema atual
Page width: max-w-sm
-> grid-cols-2
-> cards estreitos
-> texto quebra em 3-4 linhas
-> parece que “sai do cartão”

Correção
Page width maior
+ breakpoints mais conservadores
+ tipografia mais adaptável
= cards legíveis e contidos
```

Validação após implementação:
- Verificar a página `/admin/pro-accounts` no viewport atual.
- Confirmar que os 4 cards ficam com largura suficiente.
- Confirmar que “Previous Balance”, data e valores não ficam partidos de forma estranha.
- Confirmar que a tabela e o formulário continuam alinhados após aumentar a largura do container.
