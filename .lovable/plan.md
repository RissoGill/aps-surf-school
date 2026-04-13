

# Simplificar Cartões Principais - Apenas Títulos

## Resumo
Transformar os dois cartões agrupados ("Gestão Diária" e "Gestão de Receitas") em cartões colapsáveis que mostram apenas o título na front page. Ao clicar/expandir, revelam os sub-cartões detalhados. Isto reduz drasticamente a informação visível inicialmente.

## Abordagem
Usar o componente `Collapsible` (já existe em `src/components/ui/collapsible.tsx`) para tornar cada secção expansível/colapsável, começando fechada por defeito.

## Alterações

### `src/pages/admin/AdministrationDashboard.tsx`

1. Importar `Collapsible, CollapsibleTrigger, CollapsibleContent` de `@/components/ui/collapsible`
2. Importar `ChevronDown` do lucide-react

3. Para cada cartão agrupado (Gestão Diária e Gestão de Receitas):
   - Envolver com `Collapsible` (defaultOpen={false})
   - O `CardHeader` torna-se `CollapsibleTrigger` clicável com ícone chevron
   - O `CardContent` fica dentro de `CollapsibleContent`

Estrutura resultante:
```tsx
<Collapsible defaultOpen={false}>
  <Card className="shadow-medium mb-6">
    <CollapsibleTrigger asChild>
      <CardHeader className="cursor-pointer">
        <div className="flex items-center justify-between">
          <CardTitle>{t('admin.management.dailyManagement')}</CardTitle>
          <ChevronDown className="h-5 w-5 transition-transform" />
        </div>
      </CardHeader>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <CardContent>
        {/* sub-cartões existentes */}
      </CardContent>
    </CollapsibleContent>
  </Card>
</Collapsible>
```

4. Aplicar o mesmo padrão ao cartão "Gestão de Receitas"

### Sem alterações noutros ficheiros
- O componente `Collapsible` já existe
- Não são necessárias novas traduções

