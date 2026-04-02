# Production Requirements Reference

Checklist de requisitos que TODO sistema pronto para producao deve ter.
O up-system-designer e up-arquiteto usam esta referencia para injetar requisitos automaticamente.

Cada item e um requisito com ID sugerido. O arquiteto ajusta IDs para nao colidir com requisitos explicitos do usuario.

---

## UI States (UIST)

- UIST-01: Loading state (skeleton ou spinner) em TODA operacao assincrona
- UIST-02: Error state com mensagem clara e botao de retry
- UIST-03: Empty state com orientacao de acao ("Nenhum item ainda. Clique em + para criar.")
- UIST-04: Success feedback (toast) para TODA acao mutativa (criar, editar, deletar)
- UIST-05: Disabled state em botoes durante submissao (evitar double-click)
- UIST-06: Skeleton loading em vez de spinner generico para conteudo principal
- UIST-07: Optimistic updates onde aplicavel (UI responde antes da API)
- UIST-08: Confirmacao antes de acoes destrutivas (deletar, cancelar)

## Error Handling (ERR)

- ERR-01: Error boundary no layout raiz com fallback UI amigavel
- ERR-02: Error boundary por feature/rota (erro em uma secao nao derruba o app)
- ERR-03: Try/catch em toda operacao de API com mensagem amigavel
- ERR-04: Tratamento de sessao expirada (redirect para login com mensagem)
- ERR-05: Pagina 404 customizada com navegacao de volta
- ERR-06: Tratamento de erros de rede (offline, timeout) com retry
- ERR-07: Validacao server-side alem de client-side (nunca confiar so no front)
- ERR-08: Logging de erros no console (dev) sem expor em producao

## Performance (PERF)

- PERF-01: Lazy loading de imagens (loading="lazy" ou next/image)
- PERF-02: Code splitting por rota (dynamic imports / React.lazy)
- PERF-03: Debounce em inputs de busca/filtro (300ms)
- PERF-04: Pagination ou infinite scroll para listas > 20 items
- PERF-05: Caching de queries (React Query / SWR / tRPC cache / staleTime)
- PERF-06: Memoizacao de componentes pesados (React.memo, useMemo)
- PERF-07: Evitar re-renders desnecessarios (keys corretas, deps do useEffect)
- PERF-08: Compressao de imagens e assets (WebP, SVG onde possivel)
- PERF-09: Prefetch de rotas provaveis (next/link prefetch)

## Forms (FORM)

- FORM-01: Validacao inline (ao sair do campo ou ao digitar, nao so no submit)
- FORM-02: Mensagens de erro especificas por campo ("Email invalido" nao "Erro")
- FORM-03: Botao desabilitado durante submissao com loading indicator
- FORM-04: Autofocus no primeiro campo ao abrir form
- FORM-05: Tab order logica (sem pular campos)
- FORM-06: Defaults inteligentes onde possivel (data=hoje, moeda=BRL)
- FORM-07: Preservar dados do form se usuario navegar e voltar
- FORM-08: Mascara de input onde aplicavel (telefone, CPF, CEP, moeda)

## Responsividade (RESP)

- RESP-01: Layout funcional em 375px (iPhone SE) — sem overflow horizontal
- RESP-02: Touch targets minimo 44x44px em mobile
- RESP-03: Navegacao adaptada (hamburger/drawer em mobile)
- RESP-04: Tabelas com scroll horizontal ou layout de cards em mobile
- RESP-05: Modais fullscreen em mobile, dialog em desktop
- RESP-06: Fonte legivel (min 14px body, min 12px labels)
- RESP-07: Imagens responsivas (max-w-full, h-auto)

## Meta/SEO (META)

- META-01: Title unico por pagina
- META-02: Meta description por pagina
- META-03: OG tags (image, title, description) para compartilhamento social
- META-04: Favicon (multiplos tamanhos)
- META-05: Web manifest (PWA-ready)
- META-06: Canonical URL
- META-07: Robots meta (noindex para paginas privadas)

## Acessibilidade (A11Y)

- A11Y-01: Alt text em todas as imagens
- A11Y-02: Labels associados a todos os inputs (htmlFor/id)
- A11Y-03: Focus visible em elementos interativos (outline, ring)
- A11Y-04: Keyboard navigation funcional (tab, enter, escape)
- A11Y-05: Aria labels em botoes de icone (sem texto visivel)
- A11Y-06: Hierarquia de headings (h1 > h2 > h3, sem pular niveis)
- A11Y-07: Contraste minimo 4.5:1 em texto
- A11Y-08: Skip to content link
- A11Y-09: Landmarks (header, main, nav, footer)

## Seguranca (SEC)

- SEC-01: Protecao de rotas autenticadas (redirect se nao logado)
- SEC-02: CSRF protection em forms
- SEC-03: Sanitizacao de inputs (evitar XSS)
- SEC-04: Rate limiting em endpoints sensiveis (login, signup, reset)
- SEC-05: Headers de seguranca (CSP, X-Frame-Options, etc.)
- SEC-06: Nao expor IDs sequenciais (usar UUID)
- SEC-07: Env vars nunca expostas no client-side
- SEC-08: RLS (Row Level Security) se usando Supabase

## Visual Polish (POLISH)

- POLISH-01: Hover states em todos elementos clicaveis
- POLISH-02: Transicoes suaves em mudancas de estado (150-300ms)
- POLISH-03: Consistencia de espacamento (usar escala: 4, 8, 12, 16, 24, 32, 48)
- POLISH-04: Consistencia de cores (usar design tokens, nao hex hardcoded)
- POLISH-05: Consistencia de tipografia (max 2 fontes, escala definida)
- POLISH-06: Dark mode (opcional mas cada vez mais esperado)
- POLISH-07: Favicon que funciona em light e dark mode
