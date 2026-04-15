
Diagnóstico:
- O problema já não parece ser o upload; a falha está na forma de abrir a fatura.
- O `ExpensesCard.tsx` usa `window.open('', '_blank')` + `document.write()` + `<iframe src="URL-do-PDF">`.
- Esse padrão funciona para HTML gerado internamente, mas continua frágil para PDFs remotos do Supabase, sobretudo em Safari/WebKit. O screenshot (“A problem repeatedly occurred…”) é compatível com esse crash.

Plano de correção:
1. Substituir a abertura atual por um viewer dedicado dentro da app
- Criar uma nova página/rota de visualização de faturas.
- Em vez de injetar HTML com `document.write`, o botão “Ver” abre algo como `/invoice-viewer?src=...`.
- Isto evita o fluxo atual com nova janela vazia + escrita manual de HTML.

2. Fazer o viewer tratar PDF e imagem de forma diferente
- PDF: mostrar um viewer em ecrã completo com `<object>` ou `<iframe>` dentro da própria página.
- Imagem: mostrar `<img>` responsiva.
- Em ambos os casos, incluir fallback visível:
  - botão “Abrir original”
  - botão “Descarregar”
- Assim, mesmo que o browser não renderize inline, o utilizador deixa de ficar preso numa página branca.

3. Tornar a deteção do tipo de ficheiro mais robusta
- Em vez de só usar `url.includes('.pdf')`, analisar o pathname do URL com mais segurança.
- Preparar fallback para links sem extensão clara.

4. Melhorar a UX nos links de fatura
- Manter “Ver” a abrir o viewer dedicado.
- Adicionar também ação de download direto ao lado de “Ver”, para não depender apenas da pré-visualização.

5. QA focado no cenário real
- Testar com uma fatura PDF já carregada.
- Testar também uma imagem.
- Confirmar:
  - deixa de aparecer página branca/crash
  - o PDF abre no viewer ou, no pior caso, o download funciona
  - o fluxo funciona em desktop e Safari/mobile

Ficheiros a alterar:
- `src/components/admin/ExpensesCard.tsx`
- `src/App.tsx`
- novo ficheiro tipo `src/pages/InvoiceViewer.tsx`
- `src/i18n/translations/pt.json`
- `src/i18n/translations/en.json`

Detalhe técnico:
- Não vou reutilizar `document.write()` para PDFs remotos.
- O viewer passa a ser uma rota React normal, com layout estável e fallback explícito.
- Se o motor do browser falhar ao embutir PDF, o utilizador verá a interface de fallback em vez de uma página em branco.
