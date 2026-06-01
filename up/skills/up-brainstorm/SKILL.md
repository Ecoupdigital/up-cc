---
name: up-brainstorm
description: "Use antes de QUALQUER trabalho criativo: criar feature, montar componente, adicionar funcionalidade, mudar comportamento, iniciar projeto ou tarefa. Explora intencao, requisitos e design antes de implementar. Aplica a todo projeto, por mais simples que pareca."
---

# UP Brainstorm

<HARD-GATE>
NAO invoque skill de implementacao, NAO escreva codigo, NAO faca scaffold, NAO tome acao de implementacao ate ter apresentado um design e o usuario ter aprovado. Vale para TODO projeto, independente da simplicidade percebida. O design pode ser curto, mas TEM que ser apresentado e aprovado.
</HARD-GATE>

Anti-padrao combatido: "isso e simples demais pra precisar de design". Mesmo um todo list ou mudanca de config passa pelo processo. O design escala, o gate nao.

## Red flags (racionalizacoes proibidas)

Se voce se pegar pensando uma dessas, PARE. E o sinal de que esta prestes a furar o gate.

| Voce pensa | Realidade |
|------------|-----------|
| "Isso e simples demais pra brainstorm" | O gate nao e opcional. Tier Trivial ja e a saida leve (0 perguntas). Anuncie e siga, mas pelo gate. |
| "Vou so escrever o codigo, depois explico" | Implementar antes de apresentar o design fura o HARD-GATE. Apresente primeiro. |
| "Preciso de mais contexto antes de decidir o tier" | Classifique com `classify-task` AGORA. O tier sai dos sinais (nº arquivos, arquitetura, schema/API/auth), nao do seu humor. |
| "Marco como Trivial pra ir mais rapido" | Se toca schema/API/auth ou >1 subsistema, NAO e Trivial. Rebaixar o tier e furar o gate disfarcado. |
| "O usuario tem pressa, pulo a aprovacao" | Pressa muda a PROFUNDIDADE (tier), nunca remove a aprovacao. Ate Trivial anuncia antes de agir. |
| "Ja sei o que ele quer" | Suposicao nao e aprovacao. Em Pequena+, pergunte a decisao-chave. |

A unica forma legitima de ir rapido e o tier Trivial, nao furar o gate.

## Profundidade escalada por tamanho

Classifique a tarefa com o `classify-task` do `up-tools.cjs` (tiers: `simple` / `standard` / `complex`). Heuristica equivalente quando ainda nao ha plano: nº de arquivos provaveis, palavra de arquitetura, toca schema/API/auth.

| Tier | Profundidade |
|------|--------------|
| **Trivial** (1 arquivo, sem decisao de arquitetura) | 0 perguntas. Anuncia em 1 linha o que vai fazer e onde. Executa. |
| **Pequena** (1 subsistema, 1 escolha de design) | 1 pergunta via AskUserQuestion (a decisao-chave) + design em 3 frases. Aprova e segue. |
| **Media / Grande** (multi-subsistema, toca schema/API/auth) | Brainstorm full. |

## Brainstorm full (media/grande)

1. **Explore o contexto** (arquivos, docs, commits recentes).
2. **Companion visual:** se o topico tem questao visual (mockup, layout, comparacao), ofereca em mensagem isolada, sozinha. Jonathan e visual: ofereca por default em UI. Metodo de quando/como oferecer e produzir: ver `visual-companion.md` (mesma pasta).
3. **Perguntas uma por vez.** Multipla escolha preferida. Foco: proposito, restricoes, criterio de sucesso. Se o escopo for multiplos subsistemas independentes, sinalize JA e ajude a decompor em sub-projetos.
4. **Proponha 2-3 abordagens** com trade-offs e sua recomendacao.
5. **Apresente o design por SECAO** (arquitetura / componentes / dados / erros / testes), cada secao escalada a complexidade, aprovacao do usuario apos CADA secao.
6. **Escreva BRIEFING.md** e commite (`docs(brief): <topico>`).
7. **Self-review do briefing** (inline, sem re-review): caca placeholders (TBD/TODO), contradicoes, escopo amplo demais, ambiguidade. Corrige.
8. **Gate de revisao humana:** peca ao usuario revisar o BRIEFING.md antes de prosseguir. Espera resposta.

Principios: uma pergunta por vez, multipla escolha, YAGNI sem piedade, sempre alternativas, validacao incremental.

## Estado terminal

Aprovado o design, transicione para o planejamento (`/up:plan`). Nao invoque skill de implementacao direto a partir daqui.
