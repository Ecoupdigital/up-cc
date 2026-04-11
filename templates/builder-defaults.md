# Builder Defaults Template

Template para `~/.claude/up/builder-defaults.md` -- decisoes padrao do usuario para o modo builder.
O usuario customiza uma vez e vale para todos os projetos criados com `/up:modo-builder`.

<template>

```markdown
# Builder Defaults

## Stack Padrao
- Frontend: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth + Database + Edge Functions)
- Linguagem: TypeScript (strict mode)
- Package manager: pnpm
- Testes: Vitest + Playwright

## Decisoes de Design
- Design system: shadcn/ui (tema neutro, customizar cores por projeto)
- Responsividade: mobile-first
- Dark mode: sim, com toggle
- Fonte: Inter (UI) + JetBrains Mono (code)

## Decisoes de Codigo
- API: tRPC quando Next.js, REST quando Python/FastAPI
- Auth: Supabase Auth
- Validacao: Zod
- Estado client: Zustand
- Forms: React Hook Form + Zod resolver
- ORM/DB: Supabase client (sem ORM adicional)

## Padroes
- Estrutura: feature-based (src/features/*)
- Commits: conventional commits
- Linter: ESLint + Prettier
- Git: branch main, commits diretos

## Modelos

**v0.6.0+: Removido.** O runtime que voce usa decide o modelo.

- Em Claude Code: usa o modelo selecionado via /model (default Opus 4.6)
- Em OpenCode: usa o modelo do opencode.json
- Em Gemini CLI: usa o modelo do runtime

Planos sao sempre gerados em nivel detalhado (Sonnet-ready) independente do modelo executor.

## Nao usar
- (liste aqui tecnologias que voce NAO quer em nenhum projeto)
```

</template>

<guidelines>

**Como o builder usa este arquivo:**

1. Lido no inicio do modo builder (Estagio 1 - Intake)
2. Qualquer decisao do briefing do usuario SOBRESCREVE os defaults
3. Se o usuario especifica "usar Vue", o default de Next.js e ignorado
4. Se o usuario NAO especifica frontend, o default de Next.js e usado
5. A secao "Nao usar" e SEMPRE respeitada (nunca sobrescrita)

**Hierarquia de decisao:**
```
Briefing do usuario (maior prioridade)
  > Respostas das perguntas criticas
    > builder-defaults.md do usuario
      > Inferencia inteligente do sistema (menor prioridade)
```

**Inferencia inteligente (quando nao ha default nem briefing):**
- Dominio financeiro → sugere tabelas, graficos, exportacao
- Dominio social → sugere real-time, notificacoes, feeds
- Dominio e-commerce → sugere pagamentos, carrinho, inventario
- Dominio educacao → sugere progresso, quiz, certificados

**O que NAO colocar nos defaults:**
- Credenciais ou tokens (passados no briefing)
- Decisoes especificas de projeto (schemas, nomes de tabelas)
- Preferencias que mudam por projeto (cores, branding)

</guidelines>
