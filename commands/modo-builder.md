---
name: up:modo-builder
description: Construir projeto completo de forma autonoma — greenfield (do zero) ou brownfield (feature nova em projeto existente)
argument-hint: "[--light] [descricao do projeto ou feature]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
  - mcp__plugin_playwright_playwright__*
---
<objective>
Modo Builder: construir projeto completo de forma totalmente autonoma.

Detecta automaticamente o modo:
- **Greenfield** (sem codigo existente): cria projeto do zero
- **Brownfield** (codigo existente): mapeia codebase, planeja e implementa feature/mudanca

**Dois niveis de execucao:**
- **Full (padrao):** Pipeline completo com pesquisa, polish, UX review, ideias, delivery
- **Light (`--light`):** Pipeline enxuto — planeja, constroi, testa. Sem gordura. Ideal para features medias em projetos existentes.

O usuario fornece um briefing, responde perguntas criticas (apenas sobre credenciais/APIs/ambiguidades), e o sistema faz TUDO sozinho.

**Modo Full (padrao):**
1. Detecta modo → Pesquisa/Mapeia → Estrutura → Planeja → Executa → Verifica → E2E
2. Polish (melhorias + UX tester + ideias) → DELIVERY.md

**Modo Light (`--light`):**
1. Detecta modo → Mini-scan → Estrutura inline → Planeja → Executa → Verifica → E2E
2. Fim. Sem polish, sem delivery, sem pesquisa pesada.
</objective>

<execution_context>
@~/.claude/up/workflows/builder.md
@~/.claude/up/workflows/builder-e2e.md
@~/.claude/up/workflows/ux-tester.md
@~/.claude/up/workflows/mobile-first.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Flags:**
- `--light` — Modo enxuto. Pula pesquisa, polish, UX tester, ideias, delivery, reassessment, captures. Mantém: planejar, executar, verificar, E2E Playwright.

O restante do argumento e o briefing em texto livre. Pode incluir:

**Greenfield (projeto novo):**
- O que quer construir
- Para quem (publico)
- Stack desejada (ou usa builder-defaults.md)
- Features principais
- Credenciais/APIs que ja tem

**Brownfield (projeto existente):**
- Que feature/mudanca quer implementar
- Como se integra com o existente
- Novas APIs/integrações necessarias
- Restricoes ou areas que nao devem ser tocadas

Se $ARGUMENTS estiver vazio (alem de flags), o workflow pedira o briefing interativamente.

**Deteccao automatica:** Se ha codigo existente no diretorio (package.json, src/, etc.) ou .plano/ existente, o builder entra em modo brownfield automaticamente.

**Defaults:** Lidos de `~/.claude/up/builder-defaults.md` (se existir).
Em brownfield, convencoes do codebase existente tem prioridade sobre defaults.
</context>

<process>
**Parsear flags primeiro:** Extrair `--light` dos $ARGUMENTS se presente. O restante e o briefing.

**GUARD: Light mode SOMENTE se `--light` esta presente LITERALMENTE nos argumentos.**
NAO inferir light baseado no tamanho do briefing. Briefing curto = FULL com poucas fases.

**Se `--light` PRESENTE nos argumentos:**
Execute o builder workflow em modo light (ver secao `<light_process>` no workflow).
Light ainda verifica (up-verificador), testa (E2E + DCRV 1 ciclo), mas sem polish/delivery.

**Se `--light` AUSENTE (default = FULL):**
Execute the builder workflow from @~/.claude/up/workflows/builder.md end-to-end.

**CRITICO:** A partir do Estagio 2, ZERO interacao com usuario. NAO use AskUserQuestion apos coletar o briefing e respostas criticas. Toda decisao e tomada autonomamente.

**Modo Full — Preserve all workflow gates:**
- Estagio 1: Intake (detectar modo + briefing + perguntas criticas)
- Estagio 2: Arquitetura (mapear codebase OU pesquisar ecossistema + up-arquiteto)
- Estagio 3: Build (loop planejar → executar → verificar → E2E por fase)
- Estagio 4: Polish (melhorias + quick wins + UX tester + ideias)
- Estagio 5: Entrega (E2E final + captures + DELIVERY.md + resumo)

Falhas sao contornadas, nunca bloqueiam. O builder SEMPRE entrega algo.
</process>

<light_mode>
## Modo Light — Pipeline Enxuto

Quando `--light` esta presente, o builder roda um pipeline minimalista:

### Estagio 1 Light: Intake Rapido

1. Detectar modo (greenfield/brownfield) — mesmo processo
2. Receber briefing
3. Perguntas criticas — SIM, mesma logica (so perguntar o essencial)
4. **NAO carregar builder-defaults.md** — usar stack do codebase (brownfield) ou inferir (greenfield)

### Estagio 2 Light: Estrutura Inline

**Brownfield:**
- Se `.plano/codebase/` existe e tem < 7 dias: reutilizar
- Se nao existe: mini-scan inline (sem spawnar 4 agentes mapeadores):
  ```bash
  # Mini-scan rapido
  ls package.json requirements.txt pyproject.toml 2>/dev/null
  cat package.json 2>/dev/null | head -50
  ls -d src/ app/ lib/ pages/ components/ 2>/dev/null | head -10
  find . -name "*.ts" -o -name "*.tsx" | head -30
  ```
- **Estruturar inline** (sem spawnar up-arquiteto):
  - Criar/atualizar PROJECT.md com briefing e contexto minimo
  - Criar/atualizar REQUIREMENTS.md com requisitos da feature
  - Criar/atualizar ROADMAP.md com 1-3 fases max
  - config.json com `builder_mode: true, builder_type: light`

**Greenfield:**
- **Pular pesquisa** (sem 4 pesquisadores paralelos)
- Estruturar inline com inferencia inteligente
- 2-5 fases max

### Estagio 3 Light: Build + E2E

Mesmo loop do full, mas:
- **Sem LOCK.md** (sessao curta, nao precisa de crash recovery)
- **Sem reassessment** (poucas fases, nao vale a pena)
- **Sem captures** (sessao curta)
- **COM teste E2E Playwright** (se tem UI) — mesmo processo do full

### Sem Estagio 4 (Polish)

Nao roda melhorias, UX tester, nem ideias.

### Sem Estagio 5 (Entrega)

Nao gera DELIVERY.md. Apenas exibe resumo inline:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER LIGHT — COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** [resumo]
**Fases:** [N] completadas
**Commits:** [N]
**E2E:** [N] testes, [X] passaram
**Bugs E2E:** [N] encontrados, [M] corrigidos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Comparacao de Tokens (estimativa)

| Etapa | Full | Light |
|-------|------|-------|
| Pesquisa (4 agentes) | ~80k tokens | 0 |
| Mapeamento (4 agentes) | ~60k tokens | ~5k (mini-scan) |
| Arquiteto (agente) | ~40k tokens | ~10k (inline) |
| Build (por fase) | ~100k tokens | ~100k tokens |
| E2E (por fase) | ~30k tokens | ~30k tokens |
| Polish (7+ agentes) | ~150k tokens | 0 |
| Delivery | ~20k tokens | 0 |
| **Total (3 fases)** | **~680k** | **~345k** (~50% menos) |

</light_mode>
