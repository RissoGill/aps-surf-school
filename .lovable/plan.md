
## Diagnóstico

O problema não é específico do T04 nem da password `123GU`. **A API da Supabase deste projeto (`bzzzecvzoahauqrhkvds`) está a devolver 404 para TODAS as tabelas**, com o código `PGRST205 — Could not find the table 'public.coach' in the schema cache`. Testei também `athlete`, `payments`, `users` — todas 404. Já o contexto Supabase carregado no início da conversa reportou também `Connection terminated due to connection timeout` a ler metadados.

Consequência prática: neste momento **ninguém consegue fazer login** (nem treinadores, nem atletas, nem admin) porque o frontend consulta as tabelas via PostgREST e recebe 404. A password `123GU` está provavelmente correta — só que a query nunca chega à tabela.

## Causas possíveis (por ordem de probabilidade)

1. **Cache de schema da PostgREST desatualizado.** Aconteceu alguma alteração na DB e a PostgREST não recarregou. Solução: `NOTIFY pgrst, 'reload schema';` no SQL Editor da Supabase.
2. **Projeto Supabase em pause / restore / a arrancar.** O ref `bzzzecvzoahauqrhkvds` responde (HTTP 404 com header `sb-gateway-version`) mas a DB pode estar indisponível.
3. **Schema `public` reset acidentalmente** (drop schema, restore de backup vazio, migração destrutiva). Neste caso os dados podem ter sido perdidos e é preciso restore de backup na dashboard Supabase.

## Passos a executar (por esta ordem, param assim que o login voltar)

1. Abrir o Supabase Dashboard e verificar o estado do projeto (Home → banner de status; Database → Health).
2. Ir a SQL Editor e correr `NOTIFY pgrst, 'reload schema';` — resolve o caso 1 imediatamente.
3. Se continuar a 404, correr `SELECT COUNT(*) FROM public.coach;` no SQL Editor:
   - Se devolver linhas → é problema de PostgREST/cache; pedir reboot da API na dashboard (Settings → Infrastructure → Restart project) ou aguardar propagação.
   - Se der `relation does not exist` → o schema `public` foi perdido; recorrer a **Database → Backups** e restaurar o backup diário mais recente.
4. Depois de a API responder às tabelas, testar novamente o login do T04 com `123GU`. Se ainda falhar (agora sim seria específico do utilizador), confirmar o registo com `SELECT coach_id, coach_user_id, coach_password FROM coach WHERE coach_user_id = 'T04';` — o login faz match exato em `coach_user_id` + `coach_password` (case-sensitive, sem trim na password).

## O que não vou fazer

- Não vou tocar em código de login nem em RLS — o código está a funcionar como sempre; o problema é infraestrutura Supabase.
- Não vou correr migrações destrutivas.

## Ajuda que preciso de ti

Confirma o estado do projeto na dashboard Supabase (link abaixo) e diz-me o que vês (projeto ativo? erros? tabelas visíveis no Table Editor?). Com essa informação passo diretamente ao passo certo.

<presentation-actions>
<presentation-link url="https://supabase.com/dashboard/project/bzzzecvzoahauqrhkvds">Abrir dashboard Supabase</presentation-link>
<presentation-link url="https://supabase.com/dashboard/project/bzzzecvzoahauqrhkvds/sql/new">SQL Editor (para o NOTIFY pgrst)</presentation-link>
<presentation-link url="https://supabase.com/dashboard/project/bzzzecvzoahauqrhkvds/database/backups">Backups</presentation-link>
</presentation-actions>
