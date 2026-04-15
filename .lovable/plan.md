

# Corrigir visualização de faturas (página em branco)

## Problema
O link da fatura abre um novo separador com `target="_blank"`, mas o browser mostra uma página em branco. Isto acontece porque muitos browsers (especialmente móveis) não renderizam PDFs diretamente via URL de storage, ou o sandbox do iframe bloqueia a abertura.

## Solução
Em vez de abrir o URL diretamente, fazer **download direto** do ficheiro usando `window.location.href` ou criar um botão de download. Para PDFs, podemos também abrir numa página HTML intermédia com um `<iframe>` ou `<embed>` que mostre o PDF.

A abordagem mais fiável (e consistente com o padrão já usado no projeto para PDFs - ver memória `pdf-view-handling`):

1. **Para PDFs**: abrir novo separador e escrever HTML com um `<iframe>` a apontar para o URL do ficheiro
2. **Para imagens**: abrir novo separador com a imagem directamente
3. **Fallback**: botão de download direto

### Alterações em `ExpensesCard.tsx`
- Criar função `handleViewInvoice(url)` que:
  - Deteta se é PDF (pela extensão no URL)
  - Se PDF: abre novo tab com `window.open()` e escreve HTML contendo `<iframe src="url" width="100%" height="100%">`
  - Se imagem: abre directamente com `window.open(url)`
- Substituir os 2 links `<a href={url} target="_blank">` por `<button onClick={() => handleViewInvoice(url)}>`

1 ficheiro a editar.
