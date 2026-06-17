## Adicionar texto curto às notícias

### Base de dados
- Migration: adicionar coluna `description TEXT` (nullable) à tabela `news`.

### Gestão (admin) — `src/pages/admin/NewsManagement.tsx`
- Adicionar `description` ao `NewsItem`, ao `newsSchema` (string opcional, máx. ~200 chars) e ao `emptyForm()`.
- Adicionar um campo `Textarea` "Descrição curta" no diálogo de criação/edição.
- Incluir `description` no payload do `saveMutation`.

### Carrossel público — `src/components/shared/NewsCarousel.tsx`
- Adicionar `description?: string` ao interface `NewsItem`.
- Incluir a coluna no `select` do Supabase.
- Renderizar a descrição por baixo do título de cada card (texto pequeno, `text-sm text-muted-foreground`, com `line-clamp-2`).

### Notas
- Campo opcional — notícias existentes continuam a funcionar.
- Sem alterações de RLS (a coluna herda as policies da tabela).
