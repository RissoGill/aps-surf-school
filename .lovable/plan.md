
Objetivo: resolver de forma fiável a visualização e o download das faturas, sem depender do viewer nativo de PDF do browser.

Diagnóstico
- O `InvoiceViewer.tsx` já faz `download()`/`fetch()` e cria `blobUrl`, por isso o ficheiro está provavelmente a ser obtido com sucesso.
- O problema restante está na etapa final:
  - preview PDF via `<iframe src={blobUrl}>`
  - download via clique programático num `<a>`
- Em mobile/Safari/WebKit este fluxo continua a falhar frequentemente: o PDF pode ficar em branco e o download pode ser ignorado.

Correção proposta
1. Deixar de depender da renderização nativa do PDF no browser
- Substituir o preview PDF atual por uma abordagem baseada em PDF.js dentro da app.
- Assim o PDF é desenhado em HTML/canvas, evitando a “página branca” do `<iframe>`/`<object>`.

2. Tornar o download realmente utilizável
- Manter o Blob local, mas reforçar o fluxo de download.
- Adicionar uma ação alternativa visível quando o browser bloquear o download:
  - “Abrir ficheiro”
  - “Download”
  - fallback explícito para o URL original
- Se necessário, abrir o Blob num novo tab como fallback manual em vez de depender só do `download`.

3. Melhorar o `InvoiceViewer`
- Distinguir claramente 3 casos:
  - PDF: render com PDF.js
  - imagem: `<img>` responsiva
  - ficheiro não suportado: interface com ações claras
- Mostrar erro útil se o Blob vier vazio ou com content-type inesperado.

4. Ajustar o fluxo em `ExpensesCard`
- Manter o botão “Ver”, mas garantir que o viewer abre sempre com URL absoluta e parâmetro de versão.
- Adicionar também botão/ação de download direto junto ao “Ver” para redundância funcional.

5. Validação após implementação
- Testar uma fatura PDF existente.
- Testar uma imagem.
- Confirmar:
  - deixa de haver página branca
  - o utilizador consegue ver o PDF dentro da app
  - o download funciona ou, no pior caso, existe fallback manual funcional

Ficheiros a alterar
- `src/pages/InvoiceViewer.tsx`
- `src/components/admin/ExpensesCard.tsx`
- `package.json` (para adicionar a dependência de PDF.js)
- opcionalmente `src/i18n/translations/pt.json`
- opcionalmente `src/i18n/translations/en.json`

Detalhe técnico
```text
Supabase Storage URL
  -> download/fetch
  -> Blob
  -> PDF.js render (PDF) / img src blob (imagem)
  -> ações visíveis: Download / Abrir original / Abrir ficheiro
```

Porque esta abordagem
- As tentativas anteriores já corrigiram rota, cache e obtenção do ficheiro.
- O ponto frágil que sobra é o viewer nativo do browser.
- Para garantir “tem que existir possibilidade de ver e fazer download”, a solução mais robusta agora é tirar a renderização PDF das mãos do browser e fazê-la diretamente na app.
