<purpose>
Verificar progresso do projeto, resumir trabalho recente e o que vem a seguir, entao rotear inteligentemente para a proxima acao -- seja executar um plano existente ou criar o proximo.
</purpose>

<process>

<step name="init_context">
**Carregar contexto de progresso:**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init progresso)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair do init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`.

Se `project_exists` = false (sem diretorio `.plano/`):

```
Sem estrutura de planejamento encontrada.

Execute /up:novo-projeto para iniciar um novo projeto.
```

Sair.

Se STATE.md faltando: sugerir `/up:novo-projeto`.
Se ROADMAP.md faltando mas PROJECT.md existe: sugerir `/up:novo-projeto`.
</step>

<step name="load">
**Usar extracao estruturada:**

```bash
ROADMAP=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap analyze)
STATE=$(node "$HOME/.claude/up/bin/up-tools.cjs" state-snapshot)
```
</step>

<step name="recent">
**Reunir contexto de trabalho recente:**

Encontrar os 2-3 SUMMARY.md mais recentes:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" summary-extract <caminho> --fields one_liner
```
</step>

<step name="report">
**Gerar barra de progresso e apresentar relatorio:**

```bash
PROGRESS_BAR=$(node "$HOME/.claude/up/bin/up-tools.cjs" progress bar --raw)
```

```
# [Nome do Projeto]

**Progresso:** {PROGRESS_BAR}

## Trabalho Recente
- [Fase X, Plano Y]: [o que foi realizado - 1 linha]
- [Fase X, Plano Z]: [o que foi realizado - 1 linha]

## Posicao Atual
Fase [N] de [total]: [nome-da-fase]
Plano [M] de [total-fase]: [status]
CONTEXTO: [ok se has_context | - se nao]

## Decisoes-Chave Tomadas
- [extrair de $STATE.decisions[]]

## Bloqueios/Preocupacoes
- [extrair de $STATE.blockers[]]

## Proximo
[Proximo objetivo fase/plano do roadmap analyze]
```
</step>

<step name="route">
**Determinar proxima acao baseada em contagens verificadas.**

**Passo 1: Contar planos e summaries na fase atual**

```bash
ls -1 .plano/fases/[dir-fase-atual]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .plano/fases/[dir-fase-atual]/*-SUMMARY.md 2>/dev/null | wc -l
```

**Passo 2: Rotear baseado em contagens**

| Condicao | Significado | Acao |
|----------|-------------|------|
| summaries < plans | Planos nao executados existem | Ir para **Rota A** |
| summaries = plans E plans > 0 | Fase completa | Ir para Passo 3 |
| plans = 0 | Fase ainda nao planejada | Ir para **Rota B** |

---

**Rota A: Plano nao executado existe**

Encontrar primeiro PLAN.md sem SUMMARY.md correspondente.

```
---

## Proximo

**{fase}-{plano}: [Nome do Plano]** -- [resumo do objetivo]

`/up:executar-fase {fase}`

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
```

---

**Rota B: Fase precisa planejamento**

Verificar se `{fase_num}-CONTEXT.md` existe no diretorio da fase.

**Se CONTEXT.md existe:**

```
---

## Proximo

**Fase {N}: {Nome}** -- {Objetivo do ROADMAP.md}
<sub>Contexto reunido, pronto para planejar</sub>

`/up:planejar-fase {numero-fase}`

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
```

**Se CONTEXT.md NAO existe:**

```
---

## Proximo

**Fase {N}: {Nome}** -- {Objetivo do ROADMAP.md}

`/up:discutir-fase {fase}` -- reunir contexto e esclarecer abordagem

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---

**Tambem disponivel:**
- `/up:planejar-fase {fase}` -- pular discussao, planejar diretamente

---
```

---

**Passo 3: Verificar status do projeto (apenas quando fase completa)**

| Condicao | Significado | Acao |
|----------|-------------|------|
| fase atual < maior fase | Mais fases restam | **Rota C** |
| fase atual = maior fase | Projeto completo | **Rota D** |

---

**Rota C: Fase completa, mais fases restam**

```
---

## Fase {Z} Completa

## Proximo

**Fase {Z+1}: {Nome}** -- {Objetivo do ROADMAP.md}

`/up:discutir-fase {Z+1}` -- reunir contexto e esclarecer abordagem

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---

**Tambem disponivel:**
- `/up:planejar-fase {Z+1}` -- pular discussao, planejar diretamente
- `/up:verificar-trabalho {Z}` -- teste de aceitacao antes de continuar

---
```

---

**Rota D: Projeto completo**

```
---

## Projeto Completo!

Todas {N} fases finalizadas!

---

**Tambem disponivel:**
- `/up:verificar-trabalho` -- teste de aceitacao antes de encerrar

---
```
</step>

</process>

<success_criteria>
- [ ] Contexto rico fornecido (trabalho recente, decisoes, problemas)
- [ ] Posicao atual clara com progresso visual
- [ ] Proximo passo claramente explicado
- [ ] Roteamento inteligente: /up:executar-fase se planos existem, /up:planejar-fase se nao
- [ ] Handoff seamless para comando up apropriado
</success_criteria>
