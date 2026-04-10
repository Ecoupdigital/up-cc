# Owner Profile Template

Template global para `~/.claude/up/owner-profile.md`.
Criado automaticamente pelo onboarding (`/up:onboard`).
Lido pelo CEO antes de cada projeto pra adaptar tom e decisoes ao estilo do dono.

<template>

```yaml
---
# Identidade
name: ""
preferred_name: ""
role: ""
company: ""
location: ""
timezone: ""
language: pt-BR

# CEO (customizavel pelo dono)
ceo_name: "CEO"
ceo_tone: "amigavel"  # formal | amigavel | direto

# Criacao
created_at: ""
updated_at: ""
version: "1.0"
---

## Contexto Profissional

[Descricao livre do que o usuario faz, area de atuacao, background]

## Time

- Solo ou tem time? [solo | time]
- Tamanho do time: [N]
- Papel no time: [lead, contribuidor, gestor]

## Stack Preferida

- **Frontend:** [ex: Next.js, Vite, Vue, SvelteKit]
- **Backend:** [ex: FastAPI, Express, Rails, Supabase]
- **Database:** [ex: Postgres, Supabase, MongoDB, SQLite]
- **Package manager:** [ex: pnpm, npm, yarn, bun]
- **Deploy/Infra:** [ex: Vercel, Hetzner+Coolify, AWS, Railway]
- **Linguagens principais:** [lista]

## Estilo de Trabalho

- **Prioridade:** [velocidade | qualidade | balanceado]
- **Decisoes:** [automaticas | perguntadas | hibrido]
- **Updates:** [verbose | normal | silent]
- **Tom do CEO:** [formal | amigavel | direto]

## Restricoes Permanentes

Tecnologias/patterns que NUNCA usar:
- [lista]

## Integracoes Disponiveis

APIs e servicos que o usuario tem acesso (sem credenciais aqui — so nomes):
- [lista]

## Valores / Filosofia

- [como o usuario pensa sobre software]
- [preferencias arquiteturais]
- [trade-offs preferidos]

## Contexto Adicional

[Qualquer contexto extra que o usuario queira compartilhar]

---

## Notas do CEO

[Observacoes aprendidas pelo CEO durante uso — atualizado automaticamente]
```

</template>

<guidelines>

**Como o CEO usa este arquivo:**

1. Lido no inicio de QUALQUER comando UP
2. Informa tom, apresentacao e decisoes
3. Override por projeto: `.plano/OWNER.md` pode refinar para contexto especifico
4. Atualizado via `/up:onboard --update`

**Hierarquia de prioridade:**
```
.plano/OWNER.md (projeto especifico, maior)
  > ~/.claude/up/owner-profile.md (global)
    > defaults do sistema (menor)
```

**O que NAO colocar:**
- Credenciais ou tokens (ficam em .env dos projetos)
- Informacoes sensiveis (CPF, senhas)
- Preferencias que mudam muito rapido

**Campos obrigatorios minimos:**
- `name` ou `preferred_name`
- `language`
- `ceo_name` (default: "CEO")

</guidelines>
