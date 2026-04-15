

## Plano: Mostrar nome do atleta em vez do ID no Select

Alteração simples no `src/components/admin/ProAccountTab.tsx`, linha 310.

Mudar o label do `SelectItem` de:
```
{a.athlete_id} - {a.first_name} {a.last_name}
```
Para:
```
{a.first_name} {a.last_name}
```

A lista já está ordenada por nome. O `value` interno continua a ser `a.athlete_id` (necessário para a lógica), mas o texto visível passa a mostrar apenas o nome.

Ficheiro a alterar: `src/components/admin/ProAccountTab.tsx` (linha 310).

