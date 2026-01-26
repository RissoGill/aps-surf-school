

# Plano: Resolver Cache do Navegador - Ícone Mail não Aparece

## Diagnóstico

Após verificação do código, confirmei que as alterações estão **corretas em ambos os ficheiros**:

| Ficheiro | Import Mail | Uso no Botão |
|----------|-------------|--------------|
| `CoachMessagesCard.tsx` | ✓ Linha 2 | ✓ Linha 293 |
| `CoachMessagesManagementCard.tsx` | ✓ Linha 2 | ✓ Linha 345 |

## Problema Identificado

O navegador está a usar uma versão em **cache** do JavaScript antigo, que não inclui as alterações recentes.

## Solução

### Opção 1: Limpar Cache do Navegador (Recomendado)

1. **No computador**: Pressionar `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac) para fazer um "hard refresh"

2. **Alternativa**: Abrir DevTools (F12) → Separador Network → Marcar "Disable cache" → Recarregar a página

### Opção 2: Limpar Dados do Site

1. Clicar no cadeado na barra de endereços
2. Seleccionar "Definições do site"
3. Clicar em "Limpar dados"
4. Recarregar a página

### Opção 3: Modo Incógnito

Abrir o site numa janela de navegação privada/incógnito para testar sem cache.

## Verificação

Após limpar o cache, o botão "Nova Mensagem" deve aparecer assim:

| Painel | Resultado Esperado |
|--------|-------------------|
| Treinador | 📧 Nova mensagem |
| Administração | 📧 Nova Mensagem |

## Nota Técnica

O código está correto e as alterações foram aplicadas. Este é um problema comum de cache do navegador após actualizações de código.

