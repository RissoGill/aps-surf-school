
Objetivo: fazer o download funcionar de forma fiável, agora que a visualização já funciona.

Diagnóstico
- O problema já não está no carregamento do ficheiro nem no PDF.js.
- O ponto frágil atual é o fluxo de download:
  1. no `ExpensesCard`, o botão “Download” abre uma nova aba com `download=1`
  2. nessa nova aba o download é disparado automaticamente no `useEffect`
- Esse auto-download perde o contexto de gesto do utilizador e muitos browsers bloqueiam ou ignoram esse trigger.
- Mesmo dentro do `InvoiceViewer`, o download ainda depende de clique programático num `<a>`, que é menos fiável do que um link real clicável pelo utilizador.

Plano de correção
1. Remover o auto-download em nova aba
- Em `src/components/admin/ExpensesCard.tsx`, o botão “Download” deixa de abrir `/invoice-viewer?download=1`.
- Em vez disso, passa a descarregar diretamente a partir do clique do utilizador no próprio dashboard.

2. Extrair uma função partilhada para obter o ficheiro
- Criar uma utility para:
  - extrair o path do bucket `expense-invoices`
  - fazer `supabase.storage.from(...).download(path)`
  - fallback para `fetch(src)` se necessário
  - devolver `blob`, `blobUrl`, `contentType` e nome final
- Isto evita duplicação entre `ExpensesCard` e `InvoiceViewer`.

3. Tornar o download do dashboard realmente direto
- No `ExpensesCard`, ao clicar em “Download”:
  - obter o Blob
  - criar um `<a href=blobUrl download=...>` temporário
  - clicar no mesmo ciclo do gesto do utilizador
  - fallback para `navigator.share()` em iOS
  - fallback final para abrir o ficheiro/manual save
- Resultado: o utilizador consegue descarregar sem passar por uma nova aba intermédia.

4. Tornar o botão do viewer mais robusto
- Em `src/pages/InvoiceViewer.tsx`, substituir a ação principal de download por uma abordagem mais explícita:
  - preferir um link real com `href={blobUrl}` + `download={resolvedFileName}` quando possível
  - manter botão secundário de fallback para `share/open`
- Assim, dentro do viewer o browser recebe um download iniciado por interação real do utilizador.

5. Remover dependência do parâmetro `download=1`
- Eliminar o auto-trigger por `useEffect`, porque é a parte mais provável de estar a ser bloqueada.
- O viewer continua a servir para ver e para descarregar manualmente, mas não para “forçar” download ao abrir.

Ficheiros a alterar
- `src/components/admin/ExpensesCard.tsx`
- `src/pages/InvoiceViewer.tsx`
- novo util partilhado, por exemplo:
  - `src/utils/invoiceFile.ts`

Resultado esperado
- “Ver” continua a abrir o viewer.
- “Download” no dashboard passa a descarregar diretamente.
- “Download” dentro do viewer passa a ser mais fiável.
- Mesmo quando o browser bloquear download automático, continua a existir fallback manual funcional.

Validação após implementação
- Testar o botão “Download” diretamente em `ExpensesCard`.
- Testar o botão “Download” dentro do `InvoiceViewer`.
- Confirmar em PDF e imagem que:
  - visualiza corretamente
  - descarrega sem abrir página branca
  - existe fallback manual utilizável se o browser bloquear o download
