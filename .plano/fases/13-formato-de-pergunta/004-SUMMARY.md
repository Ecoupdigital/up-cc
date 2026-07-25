---
phase: 13-formato-de-pergunta
plan: 004
subsystem: planejamento-e-auditoria
tags: [questioning, contrato-de-pergunta, decisoes-escaladas, arquiteto, planejador, auditar]
dependency_graph:
  requires:
    - "up/references/questioning.md (plano 001, wave 1): bloco <contrato_de_pergunta>, rótulos obrigatórios, inventário fechado de 20 pontos"
  provides:
    - "up/workflows/plan.md carrega o contrato, traz três pontos de pergunta (plan.intake-minimo, plan.decisoes-escaladas, plan.revisor-bloqueou) e um novo Estágio E que apresenta as decisões escaladas pelos agentes ao dono"
    - "up/agents/up-arquiteto.md separa por escrito o que infere do que escala, e devolve o bloco DECISOES ESCALADAS no retorno (com 'Nenhuma.' quando vazio)"
    - "up/agents/up-planejador.md roda o protocolo de resolução prévia antes de assumir, escala escolha que muda o desenho, e devolve o bloco DECISOES ESCALADAS no retorno"
    - "up/workflows/auditar.md carrega o contrato e traz dois pontos de pergunta (auditar.relatorio-existente, auditar.converter-em-fases) com recomendação calculada a partir de dado"
  affects:
    - "Plano 005 (fase 13): consolida a prova narrada (parte b da prova smoke) e verifica o inventário completo das sete superfícies contra o mapa real"
tech_stack:
  added: []
  patterns:
    - "Ponto de pergunta marcado com <pergunta id=\"...\"> nas superfícies de workflow, seguindo o mesmo padrão já estabelecido no plano 001"
    - "Bloco DECISOES ESCALADAS literal no retorno estruturado de subagente, lido pelo workflow que o despachou"
key_files:
  created: []
  modified:
    - "up/workflows/plan.md"
    - "up/agents/up-arquiteto.md"
    - "up/agents/up-planejador.md"
    - "up/workflows/auditar.md"
decisions: []
metrics:
  duration_minutes: null
  completed: "2026-07-25"
---

# Fase 13 Plano 004: Planejamento, agentes de arquitetura e planejamento, e auditoria Summary

Fecha as duas superfícies interativas restantes do inventário (planejamento e auditoria) e estende a regra do
contrato aos dois agentes que decidiam arquitetura sozinhos: `up-arquiteto` e `up-planejador` agora separam
inferência de decisão e devolvem bloco de escalação em vez de resolver trade-off em silêncio.

## O que foi feito, por tarefa

### Tarefa 1: Contrato, protocolo e dois pontos de pergunta no workflow de planejamento

Em `up/workflows/plan.md`: acrescentado ao `<core_principle>` o parágrafo do contrato de pergunta obrigatório
(carrega `questioning.md`, lista o que o workflow resolve sozinho e nunca pergunta). No Estágio 1, a frase de
intake mínimo virou o ponto `<pergunta id="plan.intake-minimo">`, precedido pela instrução de rodar o
protocolo de resolução prévia antes de perguntar, com a declaração explícita de que pergunta zero é resultado
válido. No Estágio P, a linha `BLOCK: alertar o dono (AskUserQuestion)` virou o ponto
`<pergunta id="plan.revisor-bloqueou">` com as três opções (corrigir e re-revisar, aceitar como dívida,
parar).

**Verificação rodada:**
```
grep -q "references/questioning.md" up/workflows/plan.md && grep -q "plan.intake-minimo" up/workflows/plan.md && grep -q "plan.revisor-bloqueou" up/workflows/plan.md
```
Resultado: PASS (as três condições bateram).

### Tarefa 2: Passo novo de decisões escaladas no workflow de planejamento

Criado o `## Estagio E: DECISOES ESCALADAS` entre o Estágio 2.5 (planejamento exaustivo) e o Estágio P
(planning review), com os seis passos: recolher os blocos dos retornos da rodada, descartar `Nenhuma.` e
declarar em uma linha quando não sobrou nada, ordenar por custo de reverter, perguntar uma por vez no formato
`<pergunta id="plan.decisoes-escaladas">`, registrar cada resposta em
`.plano/BRIEFING.md` na seção `## Decisões confirmadas no planejamento`, e a regra de retrabalho dirigido
(confirmar não refaz nada, divergir refaz só o agente afetado). O estágio declara que roda em MODO PROJETO e
MODO FASE, e que no MODO FASE os blocos vêm só dos planejadores.

**Verificação rodada:**
```
grep -q "Estagio E: DECISOES ESCALADAS" up/workflows/plan.md && grep -q "plan.decisoes-escaladas" up/workflows/plan.md
```
Resultado: PASS.

### Tarefa 3: Agente de arquitetura separa inferência de decisão e escala o que é decisão

Em `up/agents/up-arquiteto.md`: acrescentada em `<decision_hierarchy>` a seção "O que você infere e o que
você escala", com a chamada `Read $HOME/.claude/up/references/questioning.md` e as duas listas (o que infere
e registra vs. o que escala e nunca decide sozinho: framework, ORM, autenticação, fronteira entre módulos,
persistência, trade-off com dois lados defensáveis, corte de escopo). No Passo 4 do `<execution_flow>`,
acrescentado o item 6 (escolha de arquitetura/trade-off/corte de escopo não é inferência: aplica a
recomendação provisoriamente e escala). Em `<output_format>`, acrescentado o bloco literal `DECISOES
ESCALADAS` com máximo de 3 e a linha `Nenhuma.`. Em `<success_criteria>`, acrescentadas as duas linhas sobre
o bloco de escalação estar presente e nenhuma escolha de arquitetura ter sido resolvida sem escalação.

**Verificação rodada:**
```
grep -q "DECISOES ESCALADAS" up/agents/up-arquiteto.md && grep -q "references/questioning.md" up/agents/up-arquiteto.md
```
Resultado: PASS. `grep -n "DECISOES ESCALADAS" up/agents/up-arquiteto.md` devolveu 3 linhas (mínimo exigido:
2).

### Tarefa 4: Agente de planejamento com protocolo antes de perguntar e escalação no retorno

Em `up/agents/up-planejador.md`: acrescentada ao fim de `<context_fidelity>` a seção "Contrato de pergunta",
com a chamada de leitura da referência, a instrução de resolver pelas seis fontes do protocolo antes de
perguntar ou assumir qualquer coisa, a regra de que escolha que muda o desenho (quebrar a fase de outro jeito,
trocar fronteira entre planos, mudar contrato público, adiar requisito) não é do agente e vai para o bloco de
escalação, e a regra de que no MODO FASE toda pergunta sai com os três rótulos. No Passo 4 do
`<execution_flow>`, acrescentada a linha sobre escolha de desenho ir para o bloco de escalação em vez de ser
resolvida em silêncio. Em `<structured_returns>`, acrescentado o bloco literal `DECISOES ESCALADAS` com
máximo de 3 e a linha `Nenhuma.`. Em `<success_criteria>`, acrescentadas as duas linhas novas. Nenhuma parte
da mecânica de decomposição em tarefas, ondas ou must-haves foi alterada.

**Verificação rodada:**
```
grep -q "DECISOES ESCALADAS" up/agents/up-planejador.md && grep -q "references/questioning.md" up/agents/up-planejador.md
```
Resultado: PASS. `grep -n "DECISOES ESCALADAS" up/agents/up-planejador.md` devolveu 3 linhas (mínimo exigido:
2).

### Tarefa 5: Superfície de auditoria com contrato e dois pontos de pergunta com recomendação calculada

Em `up/workflows/auditar.md`: acrescentado ao `<core_principle>` o parágrafo do contrato de pergunta
obrigatório, com a lista do que o workflow resolve sozinho e nunca pergunta (stack detectada, existência e
data do relatório anterior, contagem de commits desde ele, quadrante dos achados, sumário opinativo). No
Passo 2, a pergunta de sobrescrever relatório existente virou `<pergunta id="auditar.relatorio-existente">`,
precedida pelo cálculo `COMMITS_DESDE` via `git rev-list --count --since=...`, com a recomendação derivada
desse número (sobrescrever se maior que zero, manter e cancelar se zero) e o motivo nomeando a evidência. No
Passo 7, a pergunta de conversão em fases virou `<pergunta id="auditar.converter-em-fases">`, com a
recomendação de converter os N do quadrante de ganho rápido, motivo citando o sumário opinativo do relatório,
e a ressalva de que o quadrante "evitar" e as anti-features nunca entram na recomendação.

**Verificação rodada:**
```
grep -q "references/questioning.md" up/workflows/auditar.md && test "$(grep -c '<pergunta id=' up/workflows/auditar.md)" = "2"
```
Resultado: PASS.

### Tarefa 6: Conferência determinística e commits

Rodado o comando determinístico completo (parse de todos os blocos `<pergunta id="...">` de `plan.md` e
`auditar.md`, checagem dos três rótulos em cada um, e checagem de `DECISOES ESCALADAS` +
`references/questioning.md` nos dois agentes):

```
node -e "
const fs=require('fs');
const alvos=['up/workflows/plan.md','up/workflows/auditar.md'];
let achados=[];
for(const f of alvos){
  const t=fs.readFileSync(f,'utf-8');
  achados.push(...[...t.matchAll(/<pergunta id=\"([^\"]+)\">/g)].map(m=>m[1]));
  for(const b of t.split('<pergunta id=').slice(1)){
    const corpo=b.split('</pergunta>')[0];
    for(const r of ['Pergunta:','Recomendo:','Porque:'])
      if(!corpo.includes(r)) console.log('FALTA', r, 'em', f);
  }
}
console.log(achados.sort().join(','));
for(const a of ['up/agents/up-arquiteto.md','up/agents/up-planejador.md']){
  const t=fs.readFileSync(a,'utf-8');
  console.log(a, t.includes('DECISOES ESCALADAS') ? 'ok' : 'FALTA ESCALACAO',
              t.includes('references/questioning.md') ? 'ok' : 'FALTA CONTRATO');
}
"
```

Saída obtida (sem nenhuma linha `FALTA`):
```
auditar.converter-em-fases,auditar.relatorio-existente,plan.decisoes-escaladas,plan.intake-minimo,plan.revisor-bloqueou
up/agents/up-arquiteto.md ok ok
up/agents/up-planejador.md ok ok
```
Idêntica à saída esperada pelo plano. Resultado: PASS.

Três commits atômicos feitos:

| Commit | Mensagem | Arquivo(s) |
|--------|----------|------------|
| `64f23c8` | `feat(pergunta): planejamento com recomendacao e estagio de decisoes escaladas` | `up/workflows/plan.md` |
| `cd2cc21` | `feat(pergunta): arquiteto e planejador escalam decisao em vez de decidir` | `up/agents/up-arquiteto.md`, `up/agents/up-planejador.md` |
| `931fa0d` | `feat(pergunta): auditoria com recomendacao calculada` | `up/workflows/auditar.md` |

Cada commit confirmado tocando exatamente os arquivos esperados (`git log -1 --name-only`).

## Verificação geral do plano (bloco `<verification>` do PLAN)

```
grep -c "<pergunta id=" up/workflows/plan.md                   → 3   (esperado: 3, PASS)
grep -c "<pergunta id=" up/workflows/auditar.md                → 2   (esperado: 2, PASS)
grep -c "Estagio E: DECISOES ESCALADAS" up/workflows/plan.md   → 1   (esperado: 1, PASS)
grep -c "DECISOES ESCALADAS" up/agents/up-arquiteto.md         → 3   (esperado: maior que 0, PASS)
grep -c "DECISOES ESCALADAS" up/agents/up-planejador.md        → 3   (esperado: maior que 0, PASS)
```

## Critérios de aceite do plano

- [x] O workflow de planejamento e o de auditoria carregam a referência do contrato.
- [x] Os cinco pontos de pergunta declarados no inventário existem, com os três rótulos preenchidos
      (`plan.intake-minimo`, `plan.decisoes-escaladas`, `plan.revisor-bloqueou`, `auditar.relatorio-existente`,
      `auditar.converter-em-fases`).
- [x] O estágio de decisões escaladas existe, com o caso de zero escalação e a regra de retrabalho dirigido.
- [x] O agente de arquitetura separa por escrito o que ele infere do que ele escala, e escala arquitetura,
      trade-off e corte de escopo.
- [x] O agente de planejamento roda o protocolo antes de assumir e escala escolha que muda o desenho.
- [x] Os dois agentes devolvem o bloco de escalação, inclusive quando não há nada a escalar (regra escrita:
      linha `Nenhuma.`).
- [x] As duas perguntas da auditoria têm recomendação calculada a partir de dado (contagem de commits e
      sumário opinativo), não de preferência.
- [x] Commits atômicos por superfície (três commits, um por grupo de arquivos).

## Desvios do Plano

Nenhum. Plano executado exatamente como escrito: os seis blocos `<action>` foram aplicados por âncora, sem
reescrever nenhum dos quatro arquivos, e os três commits saíram no agrupamento exato descrito na tarefa 6.

Uma observação de coordenação de wave, não um desvio de conteúdo: durante a execução, `git status` mostrou
`up/workflows/build.md` e `up/workflows/up.md` também modificados no worktree compartilhado, por serem tocados
pelos planos 002/003 (mesma wave, arquivos disjuntos, rodando em paralelo). Esses dois arquivos NÃO foram
staged nem commitados por este plano: cada `git commit` usou `--files` explícito, listando somente os arquivos
de `files_modified` deste plano (004).

## O que ficou fora (conforme a seção "Fora de escopo" do plano)

- Nenhum arquivo de registro de decisão, glossário ou base de rejeições foi criado. A escalação desta fase
  fica em banda, no retorno do subagente; nada assume que `.plano/decisoes/` existe (isso é da fase 14).
- `up/agents/up-auditor.md` NÃO foi editado. A superfície de auditoria foi atendida inteiramente no workflow
  (`up/workflows/auditar.md`), que já tinha acesso ao sumário opinativo do sintetizador para montar a
  recomendação calculada. A fase 19 reescreve a saída do auditor (cards, badge de força, teste falsificador,
  gate duro de handoff) mais adiante no roadmap, e tocar o agente agora criaria conflito com aquele passe.
- Nenhum gate duro entre diagnosticar e projetar foi criado na auditoria (é da fase 19).
- Nenhuma decisão escalada foi registrada em arquivo versionado; fica só no briefing, como linha de decisão
  confirmada (registro numerado com alternativas rejeitadas é da fase 14).
- Tamanho de plano medido em janela de contexto e aresta de dependência declarada não foram tocados (fase 17).
- A hierarquia de decisão em modo brownfield do `up-arquiteto` não foi alterada: a ordem que dá precedência ao
  codebase existente continua como estava, por já ser aplicação da regra de fato.
- O pipeline de agentes do planejamento não mudou: nenhum agente novo, nenhum removido, nenhuma troca de
  ordem de spawn.

## Tipo de prova exigida

**Smoke**, conforme o plano. Parte (a) entregue nesta execução: o comando determinístico da tarefa 6, sem
nenhuma linha `FALTA` e com os dois agentes marcados `ok ok`. Parte (b) (a passagem narrada mostrando uma
escolha de arquitetura subindo como pergunta com recomendação em vez de ser decidida pelo agente) é
consolidada pelo plano 005, conforme já declarado no PLAN.md deste plano.

## Rastreabilidade de requisitos

Este plano cumpre PERG-05 (decisão de arquitetura nunca é do agente, agora que `up-arquiteto` e
`up-planejador` escalam em vez de decidir) e PERG-06 (a regra do contrato vale também para os agentes, não só
para a skill de brainstorm). Também fecha, para as superfícies de planejamento e auditoria, PERG-01 (nenhuma
pergunta crua: rótulos obrigatórios presentes nos cinco novos pontos), PERG-02 (nenhuma superfície emite
pergunta sem passar pelo contrato) e PERG-03 (fato contra decisão: os três workflows agora declaram
explicitamente o que resolvem sozinhos e nunca perguntam). O fechamento definitivo desses REQs no
`.plano/REQUIREMENTS.md` depende da consolidação do plano 005, que confere o inventário completo das sete
superfícies (incluindo as cobertas pelos planos 002 e 003, disjuntos deste).

## Self-Check

- `up/workflows/plan.md` existe e contém os três pontos de pergunta e o Estágio E: ENCONTRADO.
- `up/agents/up-arquiteto.md` existe e contém o bloco DECISOES ESCALADAS: ENCONTRADO.
- `up/agents/up-planejador.md` existe e contém o bloco DECISOES ESCALADAS: ENCONTRADO.
- `up/workflows/auditar.md` existe e contém os dois pontos de pergunta: ENCONTRADO.
- Commit `64f23c8` existe em `git log --oneline --all`: ENCONTRADO.
- Commit `cd2cc21` existe em `git log --oneline --all`: ENCONTRADO.
- Commit `931fa0d` existe em `git log --oneline --all`: ENCONTRADO.
- Cada commit toca exatamente os arquivos declarados (`git log -1 --name-only` por hash): CONFIRMADO.
- Zero travessão (em-dash) e zero meia-risca (en-dash) introduzidos pelas minhas edições (checado via
  `git diff` filtrando apenas linhas adicionadas contra os dois caracteres proibidos): CONFIRMADO, nenhuma
  ocorrência nova (os existentes no arquivo são pré-existentes e fora de escopo desta tarefa).
- Nenhum arquivo fora de `files_modified` foi commitado por este plano (`up/workflows/build.md` e
  `up/workflows/up.md`, modificados pelos planos 002/003 em paralelo, ficaram fora de todo `--files`):
  CONFIRMADO.

## Self-Check: PASSOU
