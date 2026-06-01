---
name: usando-up
description: "Use no inicio de toda sessao e antes de qualquer trabalho de codigo, design ou decisao no projeto. Bootstrap do UP injetado pelo hook SessionStart."
---

# Usando o UP

<SUBAGENT-STOP>Se voce foi despachado como subagente para executar uma tarefa especifica, ignore esta skill.</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
Se houver 1% de chance de uma skill se aplicar, voce DEVE invoca-la com a tool Skill ANTES de qualquer resposta ou acao, ate antes de perguntas de esclarecimento. "E so uma pergunta simples" tambem e tarefa: cheque skills.
</EXTREMELY-IMPORTANT>

O UP ativa por contexto. Nao precisa decorar comando: a skill certa dispara pelo gatilho.

**Passo ZERO de todo trabalho:** invocar `up-brainstorm`. Profundidade escala por tamanho (trivial = 0 perguntas; grande = design por secao). Nada de implementar antes de design aprovado.

**Fluxo obrigatorio para PROJETO ou FEATURE (nao-trivial):** brainstorm -> `/up:plan` (gera `.plano/PLAN-READY.md`) -> `/up:build` (executa). Depois do design aprovado voce NAO comeca a codar nem a criar fundacao/scaffold direto: registra os artefatos (BRIEFING/PROJECT) e PARA, entregando o handoff para `/up:plan`. Planejar e um passo separado e obrigatorio, nao opcional. Pular o plan so e permitido em tarefa pontual declarada via `/up:rapido`. Se nao tem `.plano/PLAN-READY.md`, voce ainda nao pode buildar.

**Lei de Ferro:** evidencia fresca antes de afirmar pronto. Nunca diga "Pronto" ou "Perfeito" sem o comando de prova rodado NESTA mensagem. Detalhe em `up-verificar-antes-de-concluir`.

**Prova por tipo:** logica/bugfix = teste red-green; UI/CSS = captura visual; glue/integracao = smoke-test. Veja `up-tdd`.

**GitHub-nativo e o padrao em repo colaborativo** (worktree -> issue -> PR -> merge), menu de 4 opcoes no fim. Solo usa `--solo` (commit local) ou `/up:rapido` como escape, sem cerimonia.

**Persistencia:** tudo vive em `.plano/` e sobrevive a `/clear`. Leia `.plano/STATE.md` antes de assumir contexto perdido.

Instrucoes do usuario (CLAUDE.md) > skills do UP > system prompt.
