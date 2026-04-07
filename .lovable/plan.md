
Corrigir o seletor do relatório “Conta Corrente Pro” em `src/components/admin/ReportsCard.tsx`.

1. Ajustar a query dos atletas Pro
- O problema mais provável está no filtro rígido `.eq("surf_level", "Competition")`.
- Noutras partes do projeto já existe uso de `ilike("surf_level", "competition")`, o que indica que os dados podem não estar sempre guardados exatamente com a mesma capitalização/formato.
- Vou alinhar o relatório com essa lógica mais tolerante para garantir que a lista de atletas Pro é realmente carregada.

2. Tornar o dropdown robusto para seleção
- Rever o `Select` do bloco `reportType === "pro_account"` para garantir que:
  - recebe uma lista não vazia quando existirem atletas Pro,
  - usa `athlete_id` válido como `value`,
  - mantém corretamente o estado `selectedAthlete`,
  - não fica preso por conflito entre valor vazio `""` e opção `"all"`.

3. Limpar o estado ao trocar de tipo de relatório
- Garantir que ao mudar para `pro_account`, o valor anterior de atleta não interfere com a nova lista.
- Se necessário, normalizar o estado para usar `"all"` como valor por defeito em vez de `""`, para ficar consistente com os `SelectItem`.

4. Validar o impacto na geração do relatório
- Confirmar que `generateReport` continua a filtrar corretamente:
  - todos os atletas quando o valor for `"all"`,
  - apenas um atleta quando houver seleção.
- Manter o comportamento atual do relatório sem alterar o layout.

5. Pequena melhoria opcional no mesmo ajuste
- Se a lista vier vazia, mostrar texto claro no seletor ou ajuda visual indicando que não há atletas Pro ativos elegíveis, em vez de parecer que o campo está “avariado”.

Detalhes técnicos
- Ficheiro principal: `src/components/admin/ReportsCard.tsx`
- Causa provável identificada no código:
  - carregamento inicial usa `.eq("surf_level", "Competition")`
  - no `ProAccountTab` a app usa `.ilike("surf_level", "competition")`
- Isto explica o cenário em que o dropdown aparece mas não deixa escolher porque a lista pode estar vazia ou inconsistente.
- As traduções `shared.reports.proAccount` já existem em `pt.json` e `en.json`, por isso agora o foco deve ser só o comportamento do seletor.
