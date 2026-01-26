
# Plano: Corrigir Botão de Adicionar Atleta a um Treino

## Problema Identificado

O botão "Adicionar Atleta" (`UserPlus`) está **dentro** do `CollapsibleTrigger`, que renderiza como um `<button>`. Isto viola as regras do DOM HTML (`<button>` não pode estar dentro de outro `<button>`) e causa:
- Warning na consola: "validateDOMNesting(...): `<button>` cannot appear as a descendant of `<button>`"
- Cliques podem não ser registados correctamente
- Comportamento inconsistente entre navegadores

## Localização do Problema

**Ficheiro:** `src/components/admin/CoachTrainingManagement.tsx`

**Linhas 446-499:** O `CollapsibleTrigger` envolve todo o conteúdo, incluindo o botão de adicionar atleta:
```tsx
<Collapsible key={sessionKey} ...>
  <CollapsibleTrigger className="w-full">  {/* ← É um <button> */}
    <div className="flex items-center justify-between ...">
      ...
      <Button onClick={...}>  {/* ❌ Botão dentro de botão */}
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  </CollapsibleTrigger>
  ...
</Collapsible>
```

## Solução

Reestruturar o layout para que o botão "Adicionar Atleta" fique **fora** do `CollapsibleTrigger`:

```tsx
<Collapsible key={sessionKey} ...>
  <div className="flex items-center gap-2">
    <CollapsibleTrigger className="flex-1">
      <div className="flex items-center justify-between p-3 rounded-lg border ...">
        <div className="flex items-center gap-3">
          {/* Conteúdo esquerdo: chevron, ícone, data, badge turno, praia */}
        </div>
        <Badge variant="outline">
          <Users className="h-3 w-3" /> {records.length}
        </Badge>
      </div>
    </CollapsibleTrigger>
    
    {/* ✅ Botão FORA do trigger */}
    {!isReportsViewer && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAddAthlete(date, shift, attendanceData.coachId)}
        className="h-12 px-3"
      >
        <UserPlus className="h-4 w-4" />
      </Button>
    )}
  </div>
  
  <CollapsibleContent>...</CollapsibleContent>
</Collapsible>
```

## Alterações Técnicas

### Ficheiro: `src/components/admin/CoachTrainingManagement.tsx`

**Linhas 446-499** - Reestruturar o Collapsible:

1. Envolver `CollapsibleTrigger` e o botão num `div` flex
2. Remover o botão de dentro do `CollapsibleTrigger`
3. Aplicar estilos apropriados para manter o visual coeso
4. Remover `e.stopPropagation()` que já não é necessário

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Warning na consola | Sem warnings |
| Clique no `+` às vezes falha | Clique sempre funciona |
| Botão dentro de botão | Estrutura HTML válida |

## Visual Final

```text
┌──────────────────────────────────────────────────┬─────┐
│ ▸ ☀ Sáb, 25 Jan  [Manhã]  📍Carcavelos  │3👥│ │ + │
└──────────────────────────────────────────────────┴─────┘
         ↑ CollapsibleTrigger (clicável)              ↑ Botão separado
```

## Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/admin/CoachTrainingManagement.tsx` | Reestruturar linhas 446-499 para mover botão para fora do CollapsibleTrigger |
