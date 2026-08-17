# Corrigir erro "Gerar época" (RLS na tabela payments)

## Causa confirmada

A tabela `payments` só permite inserções ao papel `authenticated`:
política `Authenticated can insert payments` (INSERT, roles: `authenticated`).
A aplicação usa a autenticação legada em localStorage, pelo que os pedidos vão como `anon` — logo qualquer inserção é bloqueada com "new row violates row-level security policy".

## Solução proposta

Criar uma edge function `generate-season` que faz a geração com a chave de serviço (mesmo padrão já usado em `create-pack`), em vez de abrir inserções anónimas na tabela de pagamentos.

### Edge function `generate-season`
- Recebe: ano de início da época e o identificador do administrador que fez o pedido.
- Valida no servidor que esse administrador existe e tem perfil `super_admin` (leitura na base de dados, como nas outras funções).
- Busca os atletas activos com plano mensal (exclui `pack...` e `daily`).
- Lê os pagamentos já existentes dos 12 meses da época (Setembro → Agosto).
- Calcula o próximo número de `payment_id` a partir do máximo `PAY<n>` e insere apenas os meses em falta, com valor devido 0, pago 0 e estado `Unpaid`.
- Devolve o número de registos criados.
- Registada em `supabase/config.toml` com `verify_jwt = false`.

### Frontend
- Em `src/pages/admin/PaymentManagement.tsx`, a função `handleGenerateSeason` deixa de inserir directamente e passa a chamar `supabase.functions.invoke('generate-season', ...)`.
- Mensagem de sucesso com o número de registos criados; mensagem de erro clara se a validação de perfil falhar.
- Invalidação das queries de pagamentos mantém-se igual.

## Notas
- Sem alterações ao esquema da base de dados nem às políticas RLS existentes (mantém-se o bloqueio de escrita anónima, que é o comportamento seguro).
