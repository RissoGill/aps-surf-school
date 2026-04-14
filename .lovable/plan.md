
# Corrigir texto sobreposto no cartão de Mensagens dos Treinadores

## Problema
No `CoachMessagesManagementCard.tsx`, o `CardDescription` está colocado após o div dos botões (linha 368), e o layout do header não segue o padrão correto com `flex-1 min-w-0` para o texto, causando sobreposição.

## Solução

**`src/components/admin/CoachMessagesManagementCard.tsx`** — Reestruturar o CardHeader (linhas 334-368) para seguir o mesmo padrão do AlertsManagementCard corrigido:

```tsx
<CardHeader>
  <div className="flex items-start gap-3">
    <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-1" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <CardTitle className="text-xl">{t('admin.coachMessages.title')}</CardTitle>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount}</Badge>
        )}
      </div>
      <CardDescription className="mt-1">{t('admin.coachMessages.description')}</CardDescription>
    </div>
  </div>
  <div className="flex justify-end gap-2 mt-2 flex-wrap">
    {/* History, New Message, Refresh buttons - unchanged */}
  </div>
  ...
</CardHeader>
```

Mudanças: mover `CardDescription` para dentro do bloco de texto, adicionar `shrink-0` ao ícone, usar `flex-1 min-w-0` no container do texto. 1 ficheiro.
