## Plano

1. Corrigir permissões do Supabase Storage para o bucket `news-flyers`:
   - adicionar políticas permissivas de `INSERT`, `UPDATE` e `DELETE` em `storage.objects` para o bucket `news-flyers`, compatíveis com a autenticação legacy/localStorage do projeto.
   - manter `SELECT` público para as imagens continuarem visíveis no carrossel.

2. Corrigir permissões da tabela `news` se necessário:
   - adicionar políticas permissivas de `INSERT`, `UPDATE` e `DELETE` em `public.news`, porque a gestão admin usa legacy auth e não Supabase Auth.
   - garantir grants adequados para `anon`, `authenticated` e `service_role` conforme o padrão do projeto.

3. Melhorar o upload no frontend em `NewsManagement.tsx`:
   - preservar/extender corretamente ficheiros `.png`.
   - enviar `contentType: file.type` no upload para evitar problemas de MIME type.
   - validar que só imagens são aceites e mostrar uma mensagem de erro clara quando o upload falhar.

4. Validar:
   - confirmar que o código compila pelo harness e que o fluxo usa o bucket `news-flyers` com URL pública após upload.