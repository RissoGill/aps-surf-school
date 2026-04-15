

## Diagnóstico

O utilizador confirma que já consegue **ver** a fatura (o PDF.js canvas viewer funciona). O problema restante é apenas o **download**.

A causa mais provável: em mobile Safari/WebKit, o `navigator.canShare({ files: [...] })` retorna `true`, mas o `navigator.share()` falha silenciosamente ou é bloqueado pelo browser quando chamado a partir de uma nova aba. O código atual tenta o Web Share API primeiro e só faz fallback para o `<a>` click se o share falhar — mas em certos cenários o share "consome" a ação sem resultado visível.

Além disso, o clique programático num `<a download>` com blob URL dentro de uma aba aberta por `window.open` é frequentemente bloqueado em Safari.

## Plano de correção

### 1. Reordenar a lógica de download em `InvoiceViewer.tsx`

- **Primeiro tentar o `<a download>` direto** (funciona na maioria dos browsers desktop e Android).
- **Só tentar Web Share API como fallback** se o `<a>` não funcionar (detectável por user agent ou por tentativa).
- **Fallback final**: `window.open(blobUrl)` — abre o blob num novo tab, onde o utilizador pode guardar manualmente. Isto funciona sempre.

### 2. Adicionar botão "Guardar" mais visível

- Tornar o botão Download mais proeminente no header do viewer (cor primária em vez de outline).
- Adicionar texto de ajuda se o download falhar: "Mantenha premido na imagem para guardar" (para mobile).

### 3. Mudança concreta no `handleDownload`

```text
handleDownload:
  1. Criar <a href=blobUrl download=filename>, appendChild, click, remove
  2. Se falhar ou se estiver em iOS → navigator.share({ files })
  3. Se tudo falhar → window.open(blobUrl) como último recurso
```

### Ficheiro a alterar
- `src/pages/InvoiceViewer.tsx` — lógica do `handleDownload` e estilo do botão

