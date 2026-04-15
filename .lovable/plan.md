
Objetivo: corrigir definitivamente o fluxo de visualização/download das faturas, porque neste momento há dois problemas ao mesmo tempo.

Diagnóstico
- O screenshot mais recente mostra o texto “Não foi possível pré-visualizar o PDF.”.
- Esse texto já não existe no código atual de `src/pages/InvoiceViewer.tsx`, que agora mostra “Não foi possível carregar a fatura.”.
- Isto indica fortemente que o utilizador está a abrir uma versão antiga em cache do frontend, por isso parte das correções anteriores nem está a ser carregada.
- Além disso, mesmo na versão nova, o viewer ainda depende demasiado do URL público do ficheiro. Para este caso, a abordagem mais robusta é descarregar o ficheiro via Supabase Storage SDK e só depois criar o `blob:` local.

Plano de correção
1. Corrigir cache busting da app
- Atualizar de forma consistente os marcadores de versão em:
  - `index.html` (`/src/main.tsx?v=...`)
  - `src/App.tsx` (`APP_VERSION`)
- Garantir que a nova aba do viewer também recebe sempre a versão atual, para evitar abrir bundles antigos em cache.

2. Tornar a abertura do viewer explícita e estável
- Em `src/components/admin/ExpensesCard.tsx`, abrir o viewer com URL absoluta da própria app e incluir um parâmetro de versão/cache.
- Exemplo lógico: `/invoice-viewer?src=...&v=...`
- Isto evita que a nova aba reutilize um HTML antigo em cache.

3. Refazer o `InvoiceViewer` para usar Supabase Storage download
- Em `src/pages/InvoiceViewer.tsx`, quando o `src` pertencer ao bucket `expense-invoices`, extrair o path do ficheiro e usar:
  - `supabase.storage.from("expense-invoices").download(path)`
- Converter o resultado para `blob:` com `URL.createObjectURL(...)`.
- Usar esse `blob:` tanto para preview como para download.
- Manter `fetch(src)` apenas como fallback para URLs antigas/externas.

4. Corrigir o botão Download
- O botão deve descarregar sempre a partir do Blob local já obtido.
- Se não houver Blob, fazer fallback controlado para abrir o original.
- Isto evita o problema do atributo `download` ser ignorado em links cross-origin.

5. Melhorar o estado de erro
- Mostrar mensagens diferentes para:
  - erro ao obter o ficheiro do storage
  - tipo de ficheiro não suportado
  - ausência de URL
- Assim conseguimos distinguir cache antiga de falha real do ficheiro.

Ficheiros a alterar
- `index.html`
- `src/App.tsx`
- `src/components/admin/ExpensesCard.tsx`
- `src/pages/InvoiceViewer.tsx`

Detalhe técnico
```text
ExpensesCard
  -> abre /invoice-viewer?src=...&v=...

InvoiceViewer
  -> se URL for do bucket expense-invoices:
       supabase.storage.from("expense-invoices").download(path)
     senão:
       fetch(src) como fallback
  -> Blob
  -> URL.createObjectURL(blob)
  -> preview local + download local
```

Validação após implementação
- Confirmar que a nova aba já mostra o texto novo do viewer (prova de que a cache antiga deixou de ser usada).
- Testar uma fatura PDF antiga já existente.
- Testar uma imagem.
- Confirmar:
  - deixa de aparecer página em branco
  - o botão Download funciona
  - o fallback “Abrir original” continua disponível
