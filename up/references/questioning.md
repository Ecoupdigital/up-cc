<contrato_de_pergunta>

# Contrato de pergunta do UP

Fonte única. Toda superfície que fala com o dono carrega este arquivo antes da primeira pergunta e aplica o
contrato abaixo sem reescrevê-lo.

## 1. Nenhuma pergunta crua

Toda pergunta feita ao dono chega com resposta recomendada e com o motivo dela. O dono confirma ou corrige.
Ele não redige a resposta do zero. Isso converte entrevista em revisão.

Formato obrigatório, nesta ordem e com estes rótulos:

Pergunta: a pergunta, uma só, em uma frase
Recomendo: a resposta que o agente daria se tivesse que decidir agora
Porque: o motivo, em no máximo duas frases, nomeando a evidência que sustenta a recomendação
Opções: opção recomendada | alternativa | alternativa

A linha Opções só existe quando a lista de respostas é fechada. As três primeiras são obrigatórias sempre.

Regras de renderização:

- Quando o runtime tem ferramenta de pergunta com opções, a opção recomendada é a **primeira** da lista, e o
  texto da pergunta carrega as linhas Recomendo e Porque. O rótulo curto da opção não precisa da palavra
  recomendada: a recomendação mora no texto da pergunta, que existe em todo runtime.
- Quando não há ferramenta de opções, a pergunta sai como texto puro com os mesmos rótulos.
- Resposta livre do dono sempre vence a recomendação. Não existe pergunta cuja única saída seja aceitar a
  recomendação.
- Uma pergunta por vez.

Regra de honestidade da recomendação: a linha Porque nomeia a evidência (o arquivo lido, a decisão já
registrada, o trade-off que decide). Se o agente não consegue nomear evidência, ele não tem recomendação, e
só há duas saídas: ou é fato que ele deixou de pesquisar, e então ele pesquisa (seção 2), ou é escolha sem
critério disponível, e então a linha Porque declara qual critério de desempate o dono precisa aplicar.

Recomendar não é enviesar. Opção enviesada é a que presume a resposta sem dizer por quê. A recomendação
deste contrato vem sempre com o motivo e com a correção livre, e por isso é o oposto de enviesar.

## 2. Fato contra decisão

FATO: já tem uma resposta certa escrita em algum lugar que o agente alcança. Fato nunca vira pergunta.
DECISÃO: tem mais de uma resposta defensável, e escolher muda o que vai ser construído ou custa para
reverter. Decisão nunca é resolvida pelo agente sozinho.

### Protocolo de resolução prévia

Roda antes de QUALQUER pergunta, nesta ordem, e para na primeira fonte que responde:

1. Decisões já travadas pelo dono: perfil do dono, tabela de decisões do estado do projeto, contexto da fase.
2. Artefatos de planejamento: estado, requisitos, roadmap, projeto, briefing.
3. Mapa do código existente, quando houver.
4. Leitura e busca direta no código: ler arquivo, buscar padrão, listar diretório.
5. Histórico do repositório: log, diff e autoria, quando a pergunta é sobre o que mudou ou por quê.
6. Configuração e ambiente executável: configuração do projeto, manifesto de dependências, scripts
   disponíveis, saída de comando determinístico.

Resolveu: não pergunte. Declare em uma linha o que descobriu e de onde veio, e siga. Exemplo de anúncio:
"O projeto já usa o gerenciador declarado no manifesto, sigo com ele."

Não resolveu, e é fato: continue procurando na fonte seguinte. Esgotadas as seis, declare que a fonte não
existe e trate o assunto como decisão.

Duas fontes discordam: isso é decisão (qual delas vence) e sobe como pergunta com recomendação.

### Teste de classificação

Aplicar a cada pergunta candidata, antes de emiti-la:

- Existe uma resposta que qualquer leitor do repositório encontraria? Então é FATO: não pergunte, descubra.
- Há duas respostas defensáveis, e a escolha muda o produto, a arquitetura, o escopo ou o custo de reverter?
  Então é DECISÃO: pergunte, com recomendação.
- É segredo que só o dono tem (credencial, acesso, preferência nunca registrada)? Então pergunte, e a
  recomendação vira o valor padrão sugerido quando existir um. Segredo não é adivinhável, mas a **necessidade**
  do segredo é: só peça a credencial depois de esbarrar na parede que a exige, nunca antes por precaução.

### Proibições

- Proibido perguntar o que o protocolo acima resolve.
- Proibido o agente resolver sozinho uma escolha de arquitetura ou um trade-off.
- Proibido perguntar duas coisas na mesma pergunta para economizar rodada.

## 3. Escalação de subagente

Subagente não fala com o dono. Ao esbarrar numa DECISÃO ele não decide em silêncio e não inventa: devolve o
bloco abaixo no retorno estruturado, e o workflow que o despachou apresenta a pergunta ao dono no formato da
seção 1.

## DECISOES ESCALADAS

- Decisao: o que precisa ser escolhido, em uma frase
  Recomendo: a opção recomendada
  Porque: motivo em até duas frases, nomeando a evidência
  Alternativas: opção B | opção C

Regras:

- Máximo de 3 decisões escaladas por retorno. Aparecendo mais de 3, agrupe as relacionadas numa decisão só.
  Nunca resolva em silêncio para caber no limite.
- Sem nenhuma decisão a escalar, o bloco sai mesmo assim, com a única linha: Nenhuma. O bloco ausente é
  indistinguível de esquecimento, e por isso é proibido.
- O subagente segue o trabalho aplicando a própria recomendação, e marca no resultado que aquilo é
  provisório. Isso não é resolver sozinho: é adiantar trabalho sob hipótese declarada, com a decisão indo ao
  dono antes do fechamento.
- Confirmada a recomendação, nada é refeito. Divergindo, refaz-se apenas o que dependia daquela decisão.

## 4. Inventário dos pontos de pergunta

Ponto de pergunta é todo lugar do produto onde existe texto literal de pergunta ao dono. Cada um é marcado no
arquivo da superfície assim:

<pergunta id="identificador">
Pergunta: ...
Recomendo: ...
Porque: ...
Opções: ...
</pergunta>

A tag é conteúdo da pergunta, não substitui a chamada da ferramenta: a instrução em volta continua dizendo
qual ferramenta usar quando o runtime tem uma.

A superfície de confirmação de início cobre todo ponto em que o dono autoriza a execução a **começar ou a
continuar**, e por isso inclui as paradas do laço de execução.

Esta é a lista fechada:

| id | Superfície | Arquivo hoje | O que pergunta |
|----|-----------|--------------|----------------|
| up.proxima-acao | Roteamento da porta única | up/workflows/up.md | Qual a próxima ação depois de restaurar o estado |
| up.decisao-chave | Roteamento da porta única | up/workflows/up.md | A decisão-chave da tarefa classificada como pequena |
| up.clone-intake | Roteamento da porta única | up/workflows/up.md | Com que stack o app clonado é recriado |
| up.config-editar | Roteamento da porta única | up/workflows/up.md | Qual opção de configuração mudar |
| brainstorm.decisao-chave | Brainstorm | up/skills/up-brainstorm/SKILL.md | A decisão-chave do tier pequena |
| brainstorm.checkpoint | Brainstorm | up/skills/up-brainstorm/SKILL.md | Fechar a rodada ou continuar perguntando |
| plan.intake-minimo | Planejamento | up/workflows/plan.md | O que falta para planejar quando não há briefing |
| plan.decisoes-escaladas | Planejamento | up/workflows/plan.md | As decisões que os agentes escalaram |
| plan.revisor-bloqueou | Planejamento | up/workflows/plan.md | O que fazer quando a revisão do planejamento bloqueia |
| build.runtime-divergente | Confirmação de início | up/workflows/build.md | Seguir com runtime diferente do planejado |
| build.plano-incompleto | Confirmação de início | up/workflows/build.md | O que fazer quando falta artefato do plano |
| build.iniciar-execucao | Confirmação de início | up/workflows/build.md | Iniciar a execução |
| build.onda-falhou | Confirmação de início | up/workflows/build.md | Como seguir quando uma onda inteira falha |
| build.replan-esgotado | Confirmação de início | up/workflows/build.md | Como seguir quando o limite de re-planejamento acaba |
| build.decisoes-escaladas | Confirmação de início | up/workflows/build.md | As decisões de arquitetura que os executores escalaram durante a execução da fase |
| build.testar-antes-do-merge | Gate visual pré-merge | up/workflows/build.md | Testar na tela antes de aterrissar a fase |
| build.aprovou-ou-ajusta | Gate visual pré-merge | up/workflows/build.md | Aprovar ou pedir ajuste depois de testar |
| build.fechamento-fase | Fechamento de fase | up/workflows/build.md | Como aterrissar a fase |
| build.revisor-bloqueou | Fechamento de fase | up/workflows/build.md | O que fazer quando a revisão da fase bloqueia |
| auditar.relatorio-existente | Auditoria | up/workflows/auditar.md | Sobrescrever ou manter o relatório anterior |
| auditar.converter-em-fases | Auditoria | up/workflows/auditar.md | Converter achados aprovados em fases |

</contrato_de_pergunta>

<questioning_guide>

Este guia é subordinado ao contrato_de_pergunta acima: onde houver conflito, o contrato vence.

Project initialization is dream extraction, not requirements gathering. You're helping the user discover and articulate what they want to build. This isn't a contract negotiation - it's collaborative thinking.

<philosophy>

**You are a thinking partner, not an interviewer.**

The user often has a fuzzy idea. Your job is to help them sharpen it. Ask questions that make them think "oh, I hadn't considered that" or "yes, that's exactly what I mean."

Don't interrogate. Collaborate. Don't follow a script. Follow the thread.

</philosophy>

<the_goal>

By the end of questioning, you need enough clarity to write a PROJECT.md that downstream phases can act on:

- **Research** needs: what domain to research, what the user already knows, what unknowns exist
- **Requirements** needs: clear enough vision to scope v1 features
- **Roadmap** needs: clear enough vision to decompose into phases, what "done" looks like
- **plan-phase** needs: specific requirements to break into tasks, context for implementation choices
- **execute-phase** needs: success criteria to verify against, the "why" behind requirements

A vague PROJECT.md forces every downstream phase to guess. The cost compounds.

</the_goal>

<how_to_question>

**Start open.** Let them dump their mental model. Don't interrupt with structure.

**Follow energy.** Whatever they emphasized, dig into that. What excited them? What problem sparked this?

**Challenge vagueness.** Never accept fuzzy answers. "Good" means what? "Users" means who? "Simple" means how?

**Make the abstract concrete.** "Walk me through using this." "What does that actually look like?"

**Surface assumptions.** "You're assuming X - is that right?" "What if that's not true?"

**Find edges.** "What's NOT part of this?" "Where does this end?"

**Reveal motivation.** "What prompted this?" "What are you doing today that this replaces?"

**Know when to stop.** When you understand what they want, why they want it, who it's for, and what done looks like - offer to proceed.

</how_to_question>

<question_types>

Use these as inspiration, not a checklist. Pick what's relevant to the thread.

**Motivation - why this exists:**
- "What prompted this?"
- "What are you doing today that this replaces?"
- "What would you do if this existed?"

**Concreteness - what it actually is:**
- "Walk me through using this"
- "You said X - what does that actually look like?"
- "Give me an example"

**Clarification - what they mean:**
- "When you say Z, do you mean A or B?"
- "You mentioned X - tell me more about that"

**Success - how you'll know it's working:**
- "How will you know this is working?"
- "What does done look like?"

</question_types>

<using_askuserquestion>

Use AskUserQuestion to help users think by presenting concrete options to react to.

**Good options:**
- Interpretations of what they might mean
- Specific examples to confirm or deny
- Concrete choices that reveal priorities

**Bad options:**
- Generic categories ("Technical", "Business", "Other")
- Leading options that presume an answer **without stating why** (a recommendation with a stated reason is required, see contrato_de_pergunta section 1)
- Too many options (2-4 is ideal)
- Headers longer than 12 characters (hard limit)

**Example - vague answer:**
User says "it should be fast"

- header: "Fast"
- question: "Fast how?"
- options: ["Sub-second response", "Handles large datasets", "Quick to build", "Let me explain"]

**Example - following a thread:**
User mentions "frustrated with current tools"

- header: "Frustration"
- question: "What specifically frustrates you?"
- options: ["Too many clicks", "Missing features", "Unreliable", "Let me explain"]

</using_askuserquestion>

<freeform_rule>

**When the user wants to explain freely, STOP using AskUserQuestion.**

If a user selects "Other" and their response signals they want to describe something in their own words, you MUST:

1. **Ask your follow-up as plain text** - NOT via AskUserQuestion
2. **Wait for them to type at the normal prompt**
3. **Resume AskUserQuestion** only after processing their freeform response

</freeform_rule>

<context_checklist>

Use this as a **background checklist**, not a conversation structure. Check these mentally as you go. If gaps remain, weave questions naturally.

- [ ] What they're building (concrete enough to explain to a stranger)
- [ ] Why it needs to exist (the problem or desire driving it)
- [ ] Who it's for (even if just themselves)
- [ ] What "done" looks like (observable outcomes)

Four things. If they volunteer more, capture it.

</context_checklist>

<decision_gate>

When you could write a clear PROJECT.md, offer to proceed:

- header: "Ready?"
- question: "I think I understand what you're after. Ready to create PROJECT.md?"
- options:
  - "Create PROJECT.md" - Let's move forward
  - "Keep exploring" - I want to share more / ask me more

If "Keep exploring" - ask what they want to add or identify gaps and probe naturally.

</decision_gate>

<anti_patterns>

- **Checklist walking** - Going through domains regardless of what they said
- **Canned questions** - "What's your core value?" regardless of context
- **Corporate speak** - "What are your success criteria?" "Who are your stakeholders?"
- **Interrogation** - Firing questions without building on answers
- **Rushing** - Minimizing questions to get to "the work"
- **Shallow acceptance** - Taking vague answers without probing
- **Premature constraints** - Asking about tech stack before understanding the idea
- **User skills** - NEVER ask about user's technical experience. Claude builds.

</anti_patterns>

</questioning_guide>
