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

**Fluxo obrigatorio para PROJETO ou FEATURE de codigo (nao-trivial):** brainstorm -> `/up:plan` (gera `.plano/PLAN-READY.md`) -> `/up:build` (executa). Depois do design aprovado voce NAO comeca a codar nem a criar fundacao/scaffold direto: registra os artefatos (BRIEFING/PROJECT) e PARA, entregando o handoff para `/up:plan`. Planejar e um passo separado e obrigatorio, nao opcional. Pular o plan so e permitido em tarefa pontual declarada via `/up:rapido`. Se nao tem `.plano/PLAN-READY.md`, voce ainda nao pode buildar.

**Tarefa NAO-codigo** (documento, relatorio, analise, conteudo, estrategia): brainstorma igual, mas NAO passa por `/up:plan`/`/up:build`/worktree. Apos o escopo aprovado, produz o artefato direto e verifica por adequacao (cobre o pedido, sem TBD), nao por teste. Detalhe na skill `up-brainstorm`.

**Profundidade sob controle do usuario:** o tier automatico e so o piso. "A fundo/detalhado/explorar" ou `--deep` sobe pra brainstorm completo (ou modo exploracao pra ideia crua); "rapido/simples" ou `--quick` desce pra 0 perguntas. O usuario manda na profundidade; voce nunca a reduz sozinho.

**Lei de Ferro:** evidencia fresca antes de afirmar pronto. Nunca diga "Pronto" ou "Perfeito" sem o comando de prova rodado NESTA mensagem. Detalhe em `up-verificar-antes-de-concluir`.

**Prova por tipo:** logica/bugfix = teste red-green; UI/CSS = captura visual; glue/integracao = smoke-test. Veja `up-tdd`.

**GitHub-nativo e o padrao** (worktree -> issue -> PR -> merge), via `gh` OU MCP do GitHub, menu de 4 opcoes no fim. `--auto` pula o menu; `--solo` e autonomo total (mantem GitHub, sem menu nem gate visual). Pra pular o GitHub de propósito (commit local puro): `--local` no build ou `/up:rapido`. Atencao: `--solo` NAO desliga mais o GitHub.

**Persistencia:** tudo vive em `.plano/` e sobrevive a `/clear`. Leia `.plano/STATE.md` antes de assumir contexto perdido.

Instrucoes do usuario (CLAUDE.md) > skills do UP > system prompt.
