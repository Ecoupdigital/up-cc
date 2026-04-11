# Production Requirements (compressed)

> Versao compactada para injecao inline. ~300 tokens vs 1.3k da versao completa.
> Versao completa em `production-requirements.md` — Read sob demanda para checklist completo (60+ itens).

## Categorias e contagem (cada item tem ID)
- **UIST** (8) — UI States: loading/error/empty/success, disabled, optimistic, confirm destrutivo
- **ERR** (8) — Error handling: boundaries, try/catch, sessao expirada, 404, offline, server-side validation
- **PERF** (9) — Performance: lazy loading, code split, debounce, pagination, cache, memo, prefetch
- **FORM** (8) — Forms: inline validation, mensagens especificas, autofocus, tab order, defaults, mascaras
- **RESP** (7) — Responsividade: 375px funcional, touch 44x44, hamburger mobile, modais fullscreen
- **META** (7) — Meta/SEO: title unico, og tags, favicon, manifest, canonical, robots
- **A11Y** (9) — Acessibilidade: alt, labels, focus visible, keyboard, aria, contraste 4.5:1, landmarks
- **SEC** (8) — Seguranca: rotas protegidas, CSRF, XSS, rate limit, headers, UUID, env vars, RLS
- **POLISH** (7) — Visual: hover, transicoes 150-300ms, escala espacamento, design tokens, dark mode

## Total: 71 requisitos de producao em 9 categorias

Quando precisar de IDs especificos ou descricao detalhada de um item:
`Read references/production-requirements.md` e procure pela categoria.

Arquiteto/system-designer injetam estes requisitos automaticamente no REQUIREMENTS.md.
Supervisores validam contra eles antes de approval.
