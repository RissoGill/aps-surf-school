

# Plano: Adicionar Ícone Mail ao Botão "Nova Mensagem"

## Objetivo
Substituir o ícone `Plus` pelo ícone `Mail` no botão "Nova mensagem" para maior consistência visual com o tema de mensagens.

## Alteração

### Ficheiro: src/components/coach/CoachMessagesCard.tsx

**Linhas 292-295** - Substituir ícone `Plus` por `Mail`:

```tsx
// De:
<Button size="sm" className="w-full sm:w-auto gap-1">
  <Plus className="h-4 w-4" />
  {t('coach.messages.new')}
</Button>

// Para:
<Button size="sm" className="w-full sm:w-auto gap-1">
  <Mail className="h-4 w-4" />
  {t('coach.messages.new')}
</Button>
```

### Import
O ícone `Mail` já está importado do lucide-react (adicionado na alteração anterior).

## Resultado Visual

| Antes | Depois |
|-------|--------|
| `+ Nova mensagem` | `📧 Nova mensagem` |

## Ficheiros a Modificar

1. **src/components/coach/CoachMessagesCard.tsx** - Linha 293

