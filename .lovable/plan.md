

# Mostrar saldo 0 a vermelho e alerta para comprar novo pack

## Problema

Quando o atleta gasta todas as sessões do pack (saldo = 0), o número aparece a verde e não há alerta. Deveria aparecer a vermelho e com uma mensagem para comprar novo pack.

## Alterações

### 1. `src/pages/athlete/AthleteDashboard.tsx` (~linha 785)

Mudar a condição de cor do saldo restante de `< 0` para `<= 0`:

```typescript
// De:
packBalance.balance < 0 ? 'text-destructive' : 'text-success'
// Para:
packBalance.balance <= 0 ? 'text-destructive' : 'text-success'
```

### 2. `src/components/shared/PackBalanceAlert.tsx`

Alterar a condição de visibilidade para também mostrar quando o saldo é exatamente 0:

```typescript
// De:
if (isLoading || !balance || !balance.isNegative) return null;
// Para:
if (isLoading || !balance || balance.balance > 0) return null;
```

Adicionar mensagem diferenciada para saldo = 0 (pack esgotado) vs saldo negativo (sessões em excesso). Incluir texto a sugerir compra de novo pack.

### 3. `src/utils/packBalance.ts`

Adicionar campo `isExhausted` (balance === 0) ao interface `PackBalance` para distinguir pack esgotado de pack negativo.

### 4. Traduções (`src/i18n/translations/pt.json` e `en.json`)

Adicionar chaves para a mensagem de pack esgotado:
- `shared.packBalance.exhausted` — "Pack Esgotado"
- `shared.packBalance.athleteExhaustedMessage` — "Utilizaste todas as sessões do teu pack. Contacta a administração para adquirir um novo pack."

### 5. Guardian e Coach views

Aplicar a mesma lógica de cor `<= 0` nos componentes que mostram o saldo do pack no dashboard do Guardian e no perfil do Coach (`AthleteProfileCard.tsx`).

