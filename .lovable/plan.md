## Objectivo

Adicionar uma área de **Notícias** de acesso livre na página inicial (`WelcomePage`), em formato carrossel horizontal, com título, data e foto (flyer). Sem UI de gestão — registos inseridos manualmente por ti via base de dados.

## Alterações

### 1. Base de dados (migration)

Nova tabela `public.news`:
- `title` (text, obrigatório)
- `news_date` (date, obrigatório) — data do evento/flyer
- `image_url` (text, obrigatório) — URL público da foto
- `link_url` (text, opcional) — link externo se quiseres tornar o card clicável
- `expires_at` (date, opcional) — quando preenchido, a notícia desaparece após essa data
- `is_active` (boolean, default true) — interruptor manual
- `sort_order` (int, default 0) — para ordenação manual quando necessário

**RLS**: PERMISSIVE, leitura pública anónima (`SELECT` para `anon` + `authenticated`). Sem políticas de escrita (inseres via dashboard Supabase).

**Storage**: novo bucket público `news-flyers` para alojares as imagens (podes também usar URLs externos no `image_url`).

### 2. Frontend

**Novo componente:** `src/components/shared/NewsCarousel.tsx`
- Faz fetch a `news` filtrando: `is_active = true` AND (`expires_at IS NULL` OR `expires_at >= today`)
- Ordena por `news_date DESC, sort_order ASC`
- Usa `@/components/ui/carousel` (já existe — Embla) com autoplay manual via setas
- Cada slide: imagem (aspect-video, `object-cover`), título por baixo, data formatada PT
- Se `link_url` presente, o slide abre em nova aba
- Estado vazio: não renderiza nada (secção fica oculta se não houver notícias)

**Edição em `src/pages/WelcomePage.tsx`:**
- Inserir `<NewsCarousel />` entre o bloco Hero e a grelha de roles
- Título da secção: "Notícias"

### 3. Traduções

`pt.json` / `en.json`: adicionar `news.title` ("Notícias" / "News") e `news.empty` (não usado visualmente, mas mantido).

## Como vais publicar uma notícia

Via SQL Editor do Supabase (ou tabela `news` no dashboard):
```sql
INSERT INTO news (title, news_date, image_url, link_url, expires_at)
VALUES ('Campeonato Nacional Sub-16', '2026-06-15',
        'https://.../flyer.jpg', NULL, '2026-06-20');
```

Imagem: ou fazes upload ao bucket `news-flyers` (Storage → copiar URL público) ou colas um URL externo directo.

## Fora do âmbito

- Sem painel admin para criar/editar notícias (por escolha tua).
- Sem categorias, tags, ou paginação — só carrossel das activas.
