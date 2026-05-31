---
name: up:rapido
description: Use quando o usuario quer uma tarefa pontual rapida, sem roadmap nem cerimonia GitHub: commit atomico na branch atual com rastreamento em STATE.md. O escape hatch nomeado pra pular o /up:build.
argument-hint: "[descricao]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Executar tarefas pontuais com as garantias minimas do UP, pulando o roadmap inteiro.

**O escape hatch nomeado.** E o caminho mais curto do sistema: commit atomico na branch ATUAL, rastreamento em STATE.md, e nada mais. **Sem worktree, sem issue, sem PR, sem Multica, sem roadmap, sem rede.** Cobre a maior parte do trabalho do dia a dia (fix, config, glue, ajuste).

O mesmo sistema do UP num caminho enxuto:
- Planeja e executa num fluxo direto.
- Tarefas rapidas vivem em `.plano/rapido/`, separadas das fases planejadas.
- Atualiza a tabela "Tarefas Rapidas" do STATE.md (NAO o ROADMAP.md).

**Default:** pula pesquisa, discussao, plan-checker e verificador pesado. Use quando voce sabe exatamente o que fazer.

Diferenca de `/up:build`: o build executa um projeto planejado (PLAN-READY.md) com gate e revisor, e expoe as flags GitHub-nativas (`--pr`/`--board`/`--auto`). O `/up:rapido` ignora tudo isso de proposito. Se quiser cerimonia GitHub, use `/up:build`.
</objective>

<execution_context>
@~/.claude/up/workflows/rapido.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

A descricao da tarefa em texto livre. As garantias UP minimas (commit atomico + rastreamento) sem a cerimonia de fase.
</context>

<process>
Execute the rapido workflow from @~/.claude/up/workflows/rapido.md end-to-end.
Preserve todos os gates do workflow (validacao, descricao da tarefa, planejamento, execucao, atualizacao de estado, commits atomicos).

**Sempre na branch atual.** Nunca cria worktree, nunca abre PR, nunca toca no ROADMAP. Esse e o ponto do comando.
</process>
