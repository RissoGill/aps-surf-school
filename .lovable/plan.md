Mover o subtítulo ("Choose your profile to access your personalized dashboard" / "Escolhe o teu perfil...") para aparecer **depois** do `NewsCarousel`, em vez de logo abaixo do título.

## Alterações

**`src/pages/WelcomePage.tsx`**
- Remover o `<p>{t('welcome.subtitle')}</p>` de dentro do bloco hero (atualmente logo após o `<h1>`).
- Inserir esse mesmo `<p>` entre o `<NewsCarousel />` e o grid de roles, mantendo as classes existentes (`text-muted-foreground`) e adicionando margem/centralização adequadas (ex.: `text-center mb-4`) para coerência visual.

Sem outras alterações (sem mexer no carousel, traduções, ou lógica).