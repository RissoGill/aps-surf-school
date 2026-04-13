

# Converter foto capturada para PDF antes de upload

## Contexto
Quando o utilizador usa "Tirar Foto" (câmara), a imagem capturada é enviada tal como está. O pedido é converter essa imagem para PDF antes de fazer upload.

## Alteração

### `src/components/admin/ExpensesCard.tsx`

1. Criar uma função `convertImageToPdf(imageFile: File): Promise<File>` que:
   - Lê a imagem capturada como Data URL
   - Cria um canvas, desenha a imagem
   - Usa `canvas.toBlob()` para obter os dados
   - Gera um PDF com a biblioteca `jspdf` (já disponível ou a instalar) contendo a imagem em página inteira
   - Retorna um novo `File` com extensão `.pdf`

2. Alterar o `handleFileChange` do input de scan (câmara) para um handler separado `handleScanChange` que:
   - Recebe o ficheiro de imagem
   - Chama `convertImageToPdf()` 
   - Faz `setFile()` com o PDF resultante

3. O input de upload normal (`fileInputRef`) mantém o comportamento atual.

### Dependência
- Instalar `jspdf` (`npm install jspdf`) — biblioteca leve para gerar PDFs no browser. Versão fixada em 2.5.2 (segura).

