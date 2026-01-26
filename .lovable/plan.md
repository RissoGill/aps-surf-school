
# Plano de Correção: Alinhamento do Cartão de Mensagens

## Problema Identificado

O cabeçalho do cartão de mensagens tem problemas de layout quando o conteúdo é largo demais:
- O título "Messages to Administration" + badge "1 Pending" + botão "New Message" estão todos na mesma linha
- Em ecrãs mais pequenos ou com texto mais longo, o conteúdo sai do cartão

## Solução

Aplicar o padrão de layout já usado noutros cartões (ex: CoachPaymentsCard, AdministrationDashboard cards):
- Separar o conteúdo (ícone + texto + badge) do botão
- Colocar o botão numa linha separada em dispositivos móveis
- Adicionar classes de overflow e min-width para controlar o texto

## Alterações no Ficheiro

**Ficheiro:** `src/components/coach/CoachMessagesCard.tsx`

### Estrutura Atual (Linhas 248-308)

```text
CardHeader
└── div (flex items-center justify-between) ← problema: tudo numa linha
    ├── div (flex items-center gap-2)
    │   ├── Icon
    │   ├── CardTitle
    │   └── Badge
    └── Dialog (botão)
```

### Nova Estrutura

```text
CardHeader
├── div (flex items-start gap-4)         ← conteúdo principal
│   ├── Icon (shrink-0)
│   └── div (flex-1 min-w-0)             ← container de texto com overflow control
│       ├── div (flex flex-wrap gap-2)   ← título + badge com wrap
│       │   ├── CardTitle
│       │   └── Badge
│       └── CardDescription
└── div (mt-4 flex justify-end)          ← botão em linha separada
    └── Button (w-full sm:w-auto)        ← responsivo
```

## Detalhes Técnicos

1. **Adicionar `shrink-0`** ao ícone para não encolher
2. **Adicionar `flex-1 min-w-0`** ao container de texto para controlar overflow
3. **Adicionar `flex-wrap`** na linha do título + badge para quebrar em ecrãs pequenos
4. **Mover o botão** para um container separado abaixo do conteúdo
5. **Adicionar `w-full sm:w-auto`** ao botão para ser full-width em mobile

## Código a Modificar

Substituir linhas 248-309 com a nova estrutura de CardHeader que separa o conteúdo do botão, seguindo o mesmo padrão documentado para outros cartões do sistema.
