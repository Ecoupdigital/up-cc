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
- Executa na sessao (ou um `up-executor` se passar de um arquivo). Sem planejador. Sem DCRV.
- Lei de Ferro: prova fresca na mesma mensagem antes de afirmar pronto.
- Tarefas rapidas vivem em `.plano/rapido/`, separadas das fases planejadas.
- Atualiza a tabela "Tarefas Rapidas" do STATE.md (NAO o ROADMAP.md). ROADMAP nao e obrigatorio.

**Default:** pula pesquisa, plan, verificador, revisor e DCRV. Use quando voce sabe o que fazer.

Diferenca de `/up:build`: o build executa um projeto planejado (PLAN-READY.md) com GitHub-nativo. O `/up:rapido` ignora isso de proposito. Se quiser worktree/issue/PR, use `/up:build`.
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
Preserve os passos do workflow (descricao, execucao na sessao, Lei de Ferro, atualizacao de estado, commits atomicos). Sem planejador. Sem DCRV.

**Sempre na branch atual.** Nunca cria worktree, nunca abre PR, nunca toca no ROADMAP. Esse e o ponto do comando.
</process>
