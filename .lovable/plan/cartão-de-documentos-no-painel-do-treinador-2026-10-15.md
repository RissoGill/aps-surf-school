# Cartão de documentos no painel do treinador

## Objetivo
Criar um cartão "Documentos" no painel de todos os treinadores, colocado **antes** do cartão de mensagens para a administração, para visualizar e descarregar documentos (licenças, seguros, etc.).

## Decisões confirmadas
- **Quem carrega:** só a administração carrega/edita/elimina documentos.
- **Âmbito:** dois tipos — documentos **comuns a todos os treinadores** (ex.: regulamentos, seguro coletivo) e documentos **individuais** de cada treinador (ex.: a sua licença).

## O que será feito

### 1. Base de dados (migração)
- Nova tabela `coach_documents`:
  - `coach_id` (texto, **vazio = documento comum a todos**; preenchido = documento individual desse treinador)
  - `title` (nome do documento, ex.: "Licença FPS 2026")
  - `category` (ex.: Licença, Seguro, Regulamento, Outro)
  - `file_url`, `file_name`
  - `uploaded_by`, `created_at`, `updated_at`
- GRANTs para `authenticated`/`service_role` + SELECT para `anon` (auth legado por localStorage → políticas RLS PERMISSIVE, como no resto do projeto).
- Novo bucket de Storage `coach-documents` (público, como `news-flyers`) com políticas de leitura/escrita anónimas, coerentes com o modelo atual.

### 2. Área de administração
- Novo cartão "Documentos dos Treinadores" na página de Gestão Diária (`DailyManagement`), com:
  - Lista de documentos (título, categoria, treinador ou "Todos", data).
  - Botão "Adicionar documento": título, categoria, ficheiro (PDF/imagem), e seletor de treinador ou opção "Todos os treinadores".
  - Editar e eliminar (eliminar remove também o ficheiro do Storage).

### 3. Painel do treinador
- Novo componente `CoachDocumentsCard` em `src/components/coach/`, inserido em `CoachDashboard.tsx` **entre o AlertsCard e o CoachMessagesCard**.
- Mostra duas secções: "Documentos gerais" (comuns) e "Os meus documentos" (individuais do treinador).
- Cada documento: título, categoria, data, botão **ver** (abre em novo separador) e botão **descarregar**.
- Se não houver documentos, mostra mensagem "Sem documentos".

### 4. Traduções
- Novas chaves `coach.documents.*` e `admin.documents.*` em `pt.json` e `en.json` (chaves idênticas nos dois ficheiros).

## Detalhes técnicos
- Upload via `supabase.storage.from('coach-documents').upload(...)` com `contentType` correto (lição do bug dos flyers PNG).
- Queries com `.limit(10000)` (regra do projeto).
- Nomes de ficheiro sanitizados; HTML escapado com `escapeHtml` nos títulos.
- Verificação final com Playwright no painel do treinador e na área de administração.

## Ficheiros tocados
- Nova migração SQL (tabela + bucket + políticas)
- `src/components/coach/CoachDocumentsCard.tsx` (novo)
- `src/components/admin/CoachDocumentsManagementCard.tsx` (novo)
- `src/pages/coach/CoachDashboard.tsx` (inserir cartão)
- `src/pages/admin/DailyManagement.tsx` (inserir cartão de gestão)
- `src/i18n/translations/pt.json`, `src/i18n/translations/en.json`
