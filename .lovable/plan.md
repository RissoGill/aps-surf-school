
Diagnóstico:
- O screenshot mostra que a nova rota `/invoice-viewer` abriu corretamente, mas o `<object data={src}>` falhou a renderização do PDF remoto.
- O botão Download também falha porque hoje usa um `<a download>` direto para um URL cross-origin do Supabase; muitos browsers ignoram `download` nesse cenário.
- Ou seja: o problema já não é a navegação. O problema está em continuar a depender do URL remoto diretamente para preview e download.

Plano de correção:
1. Refazer o `InvoiceViewer` para carregar o ficheiro por `fetch()`
- Buscar o `src` remoto no `useEffect`.
- Converter a resposta em `Blob`.
- Criar um `blob:` URL local com `URL.createObjectURL(blob)`.
- Guardar também o `content-type` real devolvido pela resposta.

2. Usar o `blob:` URL local para a pré-visualização
- PDF: renderizar com `<iframe>` ou `<object>` usando o `blob:` URL local, não o URL remoto.
- Imagem: renderizar `<img src={blobUrl}>`.
- Isto contorna limitações de embedding e headers do ficheiro remoto.

3. Corrigir o Download
- O botão Download deve descarregar o `Blob` já obtido por `fetch`, criando um `<a href={blobUrl} download="nome-do-ficheiro">`.
- Se o fetch falhar, fazer fallback para abrir o original.
- Extrair o nome do ficheiro a partir do URL ou usar um nome seguro por defeito.

4. Adicionar estados claros no viewer
- Estado “a carregar ficheiro”
- Estado de erro “não foi possível carregar a fatura”
- Manter botões “Abrir original” e “Download” como fallback visível

5. Melhorar uploads futuros em `ExpensesCard`
- No `uploadFile`, enviar `contentType: fileToUpload.type` explicitamente no `.upload(...)`.
- Isto ajuda o Supabase a servir PDFs/imagens com metadata correta nas próximas faturas carregadas.

6. Traduções
- Se necessário, adicionar chaves i18n para:
  - “A carregar fatura…”
  - “Não foi possível carregar a fatura.”
  - “Abrir original”
  - “Download”
- Reutilizar chaves existentes onde fizer sentido para evitar duplicação.

Ficheiros a alterar:
- `src/pages/InvoiceViewer.tsx`
- `src/components/admin/ExpensesCard.tsx`
- opcionalmente `src/i18n/translations/pt.json`
- opcionalmente `src/i18n/translations/en.json`

Detalhe técnico:
- O viewer atual ainda usa o URL remoto diretamente:
  - preview: `<object data={src}>`
  - download: `<a href={src} download>`
- A correção passa por este fluxo:
```text
URL público do Supabase
  -> fetch()
  -> Blob
  -> URL.createObjectURL(blob)
  -> preview local + download local
```
- Também vou limpar o `blob:` URL com `URL.revokeObjectURL(...)` no cleanup para evitar leaks.

Resultado esperado:
- PDFs antigos já carregados passam a abrir no viewer sem depender do embedding direto do Supabase.
- O botão Download passa a funcionar mesmo em browsers que ignoram `download` em links cross-origin.
- Novas faturas ficam melhor servidas por causa do `contentType` explícito no upload.
