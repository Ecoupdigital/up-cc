# PENDING.md Template

Template para `.plano/PENDING.md` — assets pendentes do projeto.
Criado pelo CEO durante o intake. Atualizado durante execucao.

<template>

```yaml
---
created_at: ""
updated_at: ""
total: 0
blockers: 0
non_blockers: 0
resolved: 0
---

# Pending Assets

Assets que o dono NAO forneceu no intake. Cada um tem impacto e categoria.

## Categorias

- **visual** — design tokens, brand, logos, cores, fontes
- **integration** — credenciais de API, webhooks, OAuth
- **data** — dados reais, seed, migracao de sistema anterior
- **infrastructure** — dominio, SSL, deploy, monitoring
- **content** — textos, imagens, copy, legal

## Severidade

- **blocker** — sistema nao funciona em producao sem isso
- **non_blocker** — sistema funciona com stub/default, pode ser refinado depois

---

## Assets Pendentes

### [ID]: [Titulo Curto]

- **status:** pending | in_progress | resolved
- **category:** visual | integration | data | infrastructure | content
- **blocker:** true | false
- **impact:** [descricao do que nao funciona sem isso]
- **workaround:** [o que o UP fez ao inves — stub, default, mock]
- **how_to_resolve:** [passo a passo pra resolver]
- **created_at:** [timestamp]
- **resolved_at:** [timestamp quando resolvido]

**Exemplo:**

### PEND-001: Design System Custom

- **status:** pending
- **category:** visual
- **blocker:** false
- **impact:** Sistema usando shadcn/ui defaults neutros
- **workaround:** Gerado DESIGN-TOKENS.md com cores azul/cinza padrao
- **how_to_resolve:** Passar cores e fontes do projeto pro CEO via /up:update
- **created_at:** 2026-04-10T16:00:00Z

### PEND-002: Credencial Resend

- **status:** pending
- **category:** integration
- **blocker:** false (em dev), true (em producao)
- **impact:** Emails transacionais nao sao enviados
- **workaround:** Mock que loga no console ao inves de enviar
- **how_to_resolve:** Adicionar RESEND_API_KEY no .env.production e atualizar lib/email.ts
- **created_at:** 2026-04-10T16:00:00Z

### PEND-003: Credencial Asaas

- **status:** pending
- **category:** integration
- **blocker:** true
- **impact:** Pagamentos nao funcionam
- **workaround:** Mock retorna sempre success (NAO usar em producao)
- **how_to_resolve:** Adicionar ASAAS_API_KEY + ASAAS_WALLET_ID no .env
- **created_at:** 2026-04-10T16:00:00Z
```

</template>
