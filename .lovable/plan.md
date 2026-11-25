# Botão "Novo pagamento" na Gestão de Pagamentos

## O que vai mudar
Quando abre um atleta na Gestão de Pagamentos, aparece um botão "Novo pagamento" junto à lista de meses.

Ao carregar, abre uma janela com:
- Mês (Setembro a Agosto da época escolhida no seletor de época)
- Plano (Mensalidade, Pack 1, Pack 5, Pack 10, Diário), opcional

Ao gravar, cria uma linha nova "por pagar" com 0€ nesse mês. Depois edita-a no lápis como já faz hoje: valor, data, "Pago". Se for pack, o pack é criado ao gravar, como agora.

Regras:
- Se esse atleta já tiver uma linha nesse mês com o mesmo plano, aparece um aviso e não cria duplicado (packs podem ter várias linhas no mesmo mês se forem planos diferentes; se quiser permitir 2 packs iguais no mesmo mês, diga).
- Disponível para os mesmos perfis que podem editar pagamentos (administração e super admin).
- O número do pagamento é atribuído sozinho, a seguir ao último.

Assim já não precisa de me pedir para acrescentar meses como no caso do Simão, do Patrício, da Helena ou do António.

## Detalhe técnico
- Nova edge function `create-payment` (verify_jwt = false): valida a sessão de admin na tabela `users` (admin_role admin/super_admin), verifica duplicado (athlete_id + month + year + plan_type), calcula o próximo PAYxxxx paginando, insere com service role. Necessária porque a RLS bloqueia inserts em `payments` a partir do browser.
- `PaymentManagement.tsx`: botão + Dialog (Select de mês da época, Select de plano), invoca a função, invalida `athlete-payments`, `athlete-all-payments`, `all-payments-summary`.
- Traduções novas em pt.json e en.json (chaves iguais).
