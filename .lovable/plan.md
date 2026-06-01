## Gestão de Notícias na administração

Nova sub-página `/admin/news` acedida por um card no dashboard admin (mesmo padrão que Daily Management, Revenue, Accounting).

### Alterações

**1. `src/pages/admin/NewsManagement.tsx` (nova)**
- Validação de sessão admin via `localStorage.adminSession`.
- Lista todas as notícias (ordenadas por `news_date desc`, `.limit(10000)`).
- Botão "Nova notícia" + `Dialog` com formulário: `title`, `news_date`, `expires_at` (opcional), `link_url` (opcional), `is_active` (Switch), `sort_order`, upload de flyer para bucket `news-flyers` (ou URL manual).
- Validação com `zod`.
- Cada item: thumbnail + título + data + estado + botões **Editar** e **Eliminar** (com `AlertDialog`).
- TanStack Query para sincronizar com `NewsCarousel` da home.

**2. `src/pages/admin/AdministrationDashboard.tsx`**
- Card "Gestão de Notícias" (ícone `Newspaper`) → `navigate("/admin/news")`.

**3. `src/App.tsx`**
- Rota `/admin/news`.

**4. Traduções (`pt.json`, `en.json`)**
- Chaves para título, formulário, botões, toasts, confirmação de eliminação, label do card.

**5. Migração SQL**
- RLS PERMISSIVE em `news` para INSERT/UPDATE/DELETE (legacy auth: `USING (true) WITH CHECK (true)`).
- Storage policies PERMISSIVE para INSERT/UPDATE/DELETE no bucket `news-flyers`.