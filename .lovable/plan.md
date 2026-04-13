

# Tornar o Saldo Anterior editável e adicionar campo de referência

## O que muda
No cartão "Saldo Anterior" (PriorBalanceCard) dentro da página de pagamentos dos atletas:
1. Adicionar um botão de edição para alterar diretamente o valor do saldo anterior
2. Adicionar um campo "Referência" para indicar ao que se refere o saldo

## Ficheiros a alterar

### 1. `src/components/admin/PriorBalanceCard.tsx`
- Adicionar estado e dialog para editar o valor do `prior_balance` diretamente (com botão de lápis/editar junto ao valor)
- O dialog terá: campo para o novo valor do saldo, campo de texto "Referência" para descrever ao que se refere
- Ao guardar, atualiza o `prior_balance` na tabela `atletas` e chama `onBalanceUpdated()`
- Apenas admins podem editar (não `reports_viewer`)

### 2. Traduções (`src/i18n/translations/pt.json` e `en.json`)
- Adicionar chaves para: "Editar saldo" / "Edit balance", "Referência" / "Reference", "Ao que se refere" / "What it refers to"

## Notas
- O campo "referência" do saldo será guardado como nota/descrição - não requer nova coluna na base de dados, pode usar o campo `notes` já existente no registo de pagamento, ou alternativamente podemos adicionar um campo visual apenas no dialog de edição
- A edição direta do saldo funciona como já funciona no AthleteManagement, mas agora acessível diretamente no cartão de pagamentos
- Mantém o padrão de segurança existente: buscar sempre o valor atual da BD antes de atualizar

