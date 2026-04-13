

# Adicionar Subcategorias para Impostos, Seguros e Licenças

## Resumo
Adicionar subcategorias específicas às categorias "Impostos", "Seguros" e "Licenças" no mapa `SUBCATEGORIES` do ExpensesCard.

## Alterações

### 1. `src/components/admin/ExpensesCard.tsx`

Atualizar o mapa `SUBCATEGORIES` (linhas 40-44) para incluir:

```
"Impostos": ["IVA", "IRS", "IRC"]
"Seguros": ["Cascos Marítimos", "Acidentes Pessoais"]
"Licenças": ["CMC", "Capitania", "Federação", "RNNAT"]
```

**Código resultante:**
```typescript
const SUBCATEGORIES: Record<string, string[]> = {
  "Despesas Bancárias": ["Manutenção", "Imposto de Selo", "Avales e Garantias", "Juros"],
  "Salários": ["Nuno Telmo", "David", "Danilo", "Gustavo", "Aaron", "Zé Pinho", "Outro"],
  "Carrinhas": ["85-QD-72", "85-QD-73", "21-XA-53", "21-XA-61", "26-DB-02"],
  "Impostos": ["IVA", "IRS", "IRC"],
  "Seguros": ["Cascos Marítimos", "Acidentes Pessoais"],
  "Licenças": ["CMC", "Capitania", "Federação", "RNNAT"],
};
```

## Notas

- Não requer alterações à base de dados (a coluna `subcategory` já existe).
- O UI já suporta dinamicamente qualquer categoria no mapa `SUBCATEGORIES`.
- Quando selecionares uma destas categorias, o dropdown de subcategoria aparecerá automaticamente.

