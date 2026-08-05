# Seletor de época desportiva na Gestão de Pagamentos

## Problema

A lista de pagamentos do atleta está fixa no intervalo Setembro 2025 – Setembro 2026. Não há forma de ver outras épocas nem de criar os meses de uma nova época sem pedir uma operação manual na base de dados.

## O que vai ser feito

### 1. Seletor de época

- Nova caixa de seleção no topo da área de pagamentos: "Época desportiva" com opções no formato `2025/2026`, `2026/2027`, etc.
- A lista de opções é construída a partir das épocas que já têm registos na base de dados, mais a época atual e a seguinte.
- A época selecionada por defeito é a época atual (Setembro a Agosto: de Setembro em diante conta como a época que começa nesse ano).
- A tabela de pagamentos passa a mostrar Setembro do primeiro ano até Agosto do segundo ano da época escolhida, por ordem cronológica.

### 2. Botão "Gerar época"

- Visível apenas para o perfil **super_admin**, ao lado do seletor.
- Ao carregar, pede confirmação e cria os registos em falta dos 12 meses (Setembro a Agosto) da época selecionada para **todos os atletas activos com plano mensal** (exclui planos `pack...` e `daily`).
- Cada registo novo é criado com valor devido 0, valor pago 0 e estado "Unpaid".
- Meses que já existam não são duplicados.
- No fim, mostra uma mensagem com o número de registos criados e atualiza a lista no ecrã.

### 3. Cartões de resumo

Os cartões de "Em dívida" e "Próximo pagamento" continuam a refletir a realidade atual (mês corrente), independentemente da época selecionada, para não alterar o comportamento financeiro já validado.

## Detalhes técnicos

Ficheiro afetado: `src/pages/admin/PaymentManagement.tsx` (mais chaves de tradução em `pt.json` / `en.json`).

- Novo estado `selectedSeason` (ano de início). Query `athlete-payments` passa a incluir a época na chave para refazer o fetch ao mudar.
- O filtro fixo `Sep 2025 → Sep 2026` é substituído por um intervalo calculado: serial `startYear*12+9` até `(startYear+1)*12+8`.
- Geração: consulta a `atletas` (activos, `plan_type` nulo ou fora de `pack%`/`daily`), consulta os pagamentos existentes da época, calcula o próximo número de `payment_id` a partir do máximo `PAY<n>`, e insere em lote os registos em falta com `supabase.from('payments').insert(...)`.
- O botão só é renderizado quando `userRole === 'super_admin'` (já disponível no componente).
- Após a inserção, invalidar `['athlete-payments', ...]`, `['all-payments-summary']` e as queries de resumo relacionadas.
- Sem alterações de esquema na base de dados.
