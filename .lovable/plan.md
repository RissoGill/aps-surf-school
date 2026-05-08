## Situação actual

A categorização já contempla parcialmente o IUC:

- **Categoria** `Carrinhas` → subcategorias (matrículas): `85-QD-72`, `85-QD-73`, `21-XA-53`, `21-XA-61`, `26-DB-02` → sub-subcategoria `IUC` (entre Gasóleo, Oficinas, AdBlue, Leasing, Seguros, Multas).

Ou seja, **hoje já podes lançar o IUC** indo a Despesas → Adicionar:
- Categoria: `Carrinhas`
- Subcategoria: `<matrícula>`
- Sub-subcategoria: `IUC`
- Data: data de pagamento desse ano (1×/ano por carrinha)

## Alteração a fazer

Como pediste a estrutura **Impostos → IUC → matrícula**, adiciono-a em paralelo (sem remover a existente, para não partir despesas já registadas).

**Ficheiro:** `src/components/admin/ExpensesCard.tsx`

1. Em `SUBCATEGORIES["Impostos"]` — acrescentar `"IUC"` à lista actual (`IVA`, `IRS`, `IRC`).
2. Em `SUB_SUBCATEGORIES["Impostos"]` — criar nova entrada com as matrículas existentes:
   ```
   "Impostos": ["85-QD-72", "85-QD-73", "21-XA-53", "21-XA-61", "26-DB-02"]
   ```
   _Nota técnica:_ o sub-sub é hoje indexado pela **categoria** (não pela subcategoria). Isto significa que estas matrículas apareceriam também ao escolher subcategoria `IVA`/`IRS`/`IRC`. Para evitar isso, refino a lógica de render para indexar por `categoria + subcategoria` (mapa `SUB_SUBCATEGORIES_BY_SUB`), e só sob `Impostos > IUC` é que aparecem matrículas. As outras combinações (ex.: `Carrinhas > <matrícula>` → lista de tipos) ficam intactas.

## Como vais usar

Para lançar o IUC anual (manual, 1× por carrinha, por ano):

- Despesas → **Adicionar Despesa**
- Nome: `IUC <matrícula> <ano>` (ex.: `IUC 85-QD-72 2026`)
- Categoria: `Impostos`
- Subcategoria: `IUC`
- Sub-subcategoria: `<matrícula>`
- Data: data do pagamento
- Valor: € do IUC dessa carrinha
- (opcional) anexar comprovativo

Repete para cada uma das 5 carrinhas. Ano seguinte, repetes — não fica recorrente automático (é manual, como pediste).

## Fora do âmbito

- Não mexo nas despesas já existentes em `Carrinhas > matrícula > IUC`.
- Não crio recorrência anual nem secção de frota/alertas de renovação (podemos abordar depois se quiseres).
