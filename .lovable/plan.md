

# Adicionar opção de scan (câmara) no upload da factura

## Contexto
Atualmente o campo de factura no formulário de despesas só aceita upload de ficheiro (`<input type="file">`). O utilizador quer também poder usar a câmara do dispositivo para fazer scan direto.

## Alteração

### `src/components/admin/ExpensesCard.tsx` (linhas 165-168)

Substituir o input de ficheiro simples por dois botões lado a lado:

1. **Botão "Tirar Foto / Scan"** - usa `<input type="file" accept="image/*" capture="environment">` que abre a câmara traseira do dispositivo (em mobile) para fazer scan direto da factura
2. **Botão "Escolher Ficheiro"** - mantém o input atual `<input type="file" accept="image/*,.pdf">` para upload de ficheiro do dispositivo

Ambos os inputs ficam escondidos (`hidden`) e são acionados por botões estilizados com ícones (Camera e Upload). Quando um ficheiro é selecionado por qualquer via, mostra o nome do ficheiro selecionado.

### Traduções (`pt.json` e `en.json`)
- `"expenses.scanInvoice"`: "Tirar Foto" / "Take Photo"
- `"expenses.uploadFile"`: "Escolher Ficheiro" / "Choose File"
- `"expenses.fileSelected"`: "Ficheiro selecionado" / "File selected"

## Detalhe técnico
- O atributo HTML `capture="environment"` instrui o browser mobile a abrir a câmara traseira
- Em desktop, o botão de scan simplesmente abre o seletor de ficheiros (comportamento do browser)
- Dois `<input>` hidden referenciados via `useRef`, acionados pelo `onClick` dos botões

