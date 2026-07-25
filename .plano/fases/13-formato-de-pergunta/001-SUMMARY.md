---
phase: 13-formato-de-pergunta
plan: 001
subsystem: doutrina
tags: [questioning, contrato-de-pergunta, referencia]
dependency_graph:
  requires: []
  provides:
    - "up/references/questioning.md contém o bloco <contrato_de_pergunta> (formato de pergunta, regra fato contra decisão, escalação de subagente, inventário fechado de 20 pontos de pergunta)"
  affects:
    - "Planos 002, 003 e 004 (fase 13, wave 2): aplicam o contrato às sete superfícies e fazem o arquivo deixar de ser órfão"
    - "Plano 005 (fase 13): verifica o inventário contra as tags reais nas superfícies"
tech_stack:
  added: []
  patterns:
    - "Doutrina versionada em up/references/*.md, carregada sob demanda pelas superfícies (padrão já usado por outras references do repo)"
key_files:
  created: []
  modified:
    - "up/references/questioning.md"
decisions: []
metrics:
  duration_minutes: null
  completed: "2026-07-25"
---

# Fase 13 Plano 001: Contrato canônico da pergunta Summary

Contrato único de pergunta escrito em `up/references/questioning.md`: formato obrigatório com rótulos
Pergunta/Recomendo/Porque/Opções, protocolo de seis fontes para separar fato de decisão, bloco de escalação
de subagente com limite numérico de três, e inventário fechado de vinte pontos de pergunta cobrindo as sete
superfícies interativas.

## O que foi feito, por tarefa

### Tarefa 1: Bloco de formato obrigatório de pergunta

Inserido no topo do arquivo, antes do `<questioning_guide>` original, o bloco `<contrato_de_pergunta>` com a
seção `## 1. Nenhuma pergunta crua`: os quatro rótulos (`Pergunta:`, `Recomendo:`, `Porque:`, `Opções:`), a
regra de que a opção recomendada vem primeiro quando há ferramenta de opções, a regra de resposta livre
sempre vencendo a recomendação, e a regra de honestidade da recomendação (a linha Porque precisa nomear
evidência, senão não é recomendação).

**Verificação rodada:**
```
grep -q "contrato_de_pergunta" up/references/questioning.md && grep -q "Recomendo:" up/references/questioning.md && grep -q "Porque:" up/references/questioning.md
```
Resultado: PASS (as três condições bateram).

### Tarefa 2: Regra de fato contra decisão

Acrescentada a seção `## 2. Fato contra decisão`, com o protocolo de resolução prévia em seis fontes, em
ordem fixa (decisões travadas pelo dono, artefatos de planejamento, mapa do código, leitura e busca direta no
código, histórico do repositório, configuração e ambiente executável), o teste de classificação com os três
casos (fato descobrível, decisão real, segredo do dono) e o bloco de três proibições.

**Verificação rodada:**
```
grep -q "Protocolo de resolução prévia" up/references/questioning.md && grep -q "Teste de classificação" up/references/questioning.md
```
Resultado: PASS.

Prova adicional (contagem das seis fontes numeradas):
```
sed -n '/## 2\. Fato contra decisão/,/## 3\. Escalação/p' up/references/questioning.md | grep -c "^[1-6]\."
```
Resultado: 6.

### Tarefa 3: Escalação de subagente

Acrescentada a seção `## 3. Escalação de subagente` com o bloco literal `## DECISOES ESCALADAS` (rótulos
Decisao, Recomendo, Porque, Alternativas), o limite numérico de três decisões escaladas por retorno, a linha
obrigatória `Nenhuma.` quando não há nada a escalar, e a regra de que o subagente segue com a própria
recomendação de forma provisória até o dono confirmar ou divergir.

**Verificação rodada:**
```
grep -q "DECISOES ESCALADAS" up/references/questioning.md && grep -q "Alternativas:" up/references/questioning.md
```
Resultado: PASS.

### Tarefa 4: Inventário fechado dos pontos de pergunta

Acrescentada a seção `## 4. Inventário dos pontos de pergunta`, com a tag `<pergunta id="...">` documentada e
a tabela fechada de vinte identificadores, cobrindo as sete superfícies interativas do desenho do sistema
(roteamento da porta única, brainstorm, planejamento, confirmação de início, gate visual pré-merge,
fechamento de fase e auditoria). O bloco `<contrato_de_pergunta>` fecha ao final desta seção.

**Verificação rodada:**
```
node -e "const fs=require('fs');const t=fs.readFileSync('up/references/questioning.md','utf-8');const ids=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|/gm)].map(m=>m[1]);if(ids.length!==20||new Set(ids).size!==20)process.exit(1);console.log(ids.length,new Set(ids).size)"
```
Saída: `20 20`. Resultado: PASS.

Prova adicional (cobertura das sete superfícies):
```
node -e "const fs=require('fs');const t=fs.readFileSync('up/references/questioning.md','utf-8');const rows=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|\s*([^|]+)\|/gm)];console.log(new Set(rows.map(r=>r[2].trim())).size)"
```
Saída: `7`.

### Tarefa 5: Correção do conflito com o guia em inglês

A linha `- Leading options that presume an answer` (item de `Bad options` em `<using_askuserquestion>`) foi
trocada por `- Leading options that presume an answer **without stating why** (a recommendation with a
stated reason is required, see contrato_de_pergunta section 1)`, resolvendo a contradição com PERG-01 sem
proibir a recomendação exigida pelo contrato. Foi acrescentada, na primeira linha de conteúdo do bloco
`<questioning_guide>`, a frase de subordinação: `Este guia é subordinado ao contrato_de_pergunta acima: onde
houver conflito, o contrato vence.` Nenhuma outra linha do guia em inglês foi traduzida, reescrita ou podada.

**Verificação rodada:**
```
grep -q "without stating why" up/references/questioning.md
```
Resultado: PASS.

### Tarefa 6: Parseabilidade do inventário e commit

Rodado o comando determinístico completo:
```
node -e "
const fs=require('fs');
const t=fs.readFileSync('up/references/questioning.md','utf-8');
const ids=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|/gm)].map(m=>m[1]);
console.log(ids.length, new Set(ids).size);
console.log(ids.join('\n'));
"
```
Saída (primeira linha): `20 20`. Lista completa dos vinte identificadores devolvida sem duplicata:
`up.proxima-acao, up.decisao-chave, up.clone-intake, up.config-editar, brainstorm.decisao-chave,
brainstorm.checkpoint, plan.intake-minimo, plan.decisoes-escaladas, plan.revisor-bloqueou,
build.runtime-divergente, build.plano-incompleto, build.iniciar-execucao, build.onda-falhou,
build.replan-esgotado, build.testar-antes-do-merge, build.aprovou-ou-ajusta, build.fechamento-fase,
build.revisor-bloqueou, auditar.relatorio-existente, auditar.converter-em-fases`.

Commit atômico feito com um único arquivo:
```
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(pergunta): contrato canonico de pergunta e inventario dos pontos" --files up/references/questioning.md
```
Saída: `{"committed": true, "hash": "69c10f0", "reason": "committed"}`.

Hash completo: `69c10f05c7f04983ebf897209234de706f1f068e`. Confirmado que o commit toca exatamente um arquivo
(`git log -1 --name-only` devolveu só `up/references/questioning.md`).

## Verificação geral do plano (bloco `<verification>` do PLAN)

```
node -e "..." → 20 20                                (esperado 20 20, PASS)
grep -c "contrato_de_pergunta" up/references/questioning.md → 4    (comentário do plano dizia "esperado: 2")
grep -c "DECISOES ESCALADAS" up/references/questioning.md → 1      (esperado maior que 0, PASS)
grep -c "without stating why" up/references/questioning.md → 1     (esperado 1, PASS)
```

### Nota sobre a divergência do `grep -c "contrato_de_pergunta"`

O comentário do plano na seção `<verification>` previa 2 ocorrências (abertura e fechamento da tag). O valor
real é 4, e a causa é o próprio conteúdo literal que o plano manda escrever nas tarefas 1 e 5: além da tag de
abertura (`<contrato_de_pergunta>`) e da tag de fechamento (`</contrato_de_pergunta>`), a palavra
`contrato_de_pergunta` aparece mais duas vezes em prosa, ambas prescritas literalmente pelo próprio plano:

1. Na linha de correção da tarefa 5 (`... see contrato_de_pergunta section 1`).
2. Na frase de subordinação também da tarefa 5 (`Este guia é subordinado ao contrato_de_pergunta acima: ...`).

Nenhuma tarefa individual (`<verify><automated>`) exige o valor 2 para essa contagem; a única menção a "2" é
um comentário descritivo no bloco de verificação geral do plano, não um gate. Como as tarefas 1 e 5 exigem
inserção literal ("exatamente este conteúdo", "não reescrever"), a contagem 4 é o resultado correto de seguir
o plano ao pé da letra, e não foi corrigida por não haver o que corrigir sem violar a instrução de
literalidade das próprias tarefas. Todos os critérios de aceite do plano (checklist abaixo) continuam
satisfeitos: o bloco `<contrato_de_pergunta>` abre uma vez e fecha uma vez, com as quatro seções entre as
duas tags.

## Critérios de aceite do plano

- [x] A referência de questionamento contém o bloco `<contrato_de_pergunta>` fechado, com as quatro seções.
- [x] O formato obrigatório está escrito com os rótulos `Pergunta:`, `Recomendo:`, `Porque:` e `Opções:`.
- [x] O protocolo de resolução prévia tem seis fontes em ordem fixa e o teste de classificação tem três casos.
- [x] O bloco de escalação de subagente está literal, com limite numérico de 3 e com a linha `Nenhuma.`.
- [x] O inventário tem 20 identificadores distintos, cobrindo as sete superfícies interativas.
- [x] O conflito com o guia em inglês está resolvido por edição cirúrgica, sem tradução nem poda.
- [x] Commit atômico feito com um único arquivo.

## Desvios do Plano

Nenhum. Plano executado exatamente como escrito, tarefa por tarefa, com o conteúdo literal prescrito em cada
`<action>`. A única observação registrada é a nota de discrepância numérica acima, que é uma imprecisão do
comentário descritivo do plano (não de uma verificação de tarefa), e não motivou nenhuma mudança de código
ou de texto.

## O que ficou fora (conforme a seção "Fora de escopo" do plano)

- Nenhuma superfície foi editada. `up/references/questioning.md` continua não sendo carregado por
  nenhum workflow, skill, agente ou comando ainda; isso é trabalho dos planos 002, 003 e 004 (wave 2 desta
  fase), que também são os responsáveis por fazer PERG-02 e PERG-06 saírem do papel.
- O guia em inglês (`<questioning_guide>`) não foi traduzido nem podado, exceto a edição cirúrgica da
  tarefa 5. Corte de sedimento é passe separado com briefing próprio.
- Nenhuma reference nova nem versão comprimida do contrato foi criada. Fonte única continua sendo um único
  arquivo.
- Nenhum arquivo de glossário, registro de decisão ou base de rejeições foi criado ou preparado (são
  artefatos da fase 14).
- Nenhuma aresta de dependência entre planos em formato novo foi declarada; a onda numerada continua sendo a
  única forma usada nesta fase (o grafo de bloqueio é da fase 17).
- Modo grill, perguntas ilimitadas e escrita inline de termo não foram tocados (são da fase 15).
- O número, nome ou semântica das sete superfícies não foram alterados; o inventário se ajustou ao mapa já
  existente em `.plano/SYSTEM-DESIGN.md`, sem redefini-lo.

## Rastreabilidade de requisitos

Este plano é doutrina pura (prova tipo smoke, sem comportamento executável). Ele estabelece o contrato que os
planos seguintes da fase aplicam às superfícies. Os requisitos PERG-01 a PERG-06 continuam com status
"Pendente" em `.plano/REQUIREMENTS.md` porque a doutrina sozinha não fecha PERG-02 (nenhuma superfície emite
pergunta crua) nem PERG-06 (a regra valer para os agentes de arquitetura e planejamento): isso só fecha
quando os planos 002, 003 e 004 aplicarem o contrato aos arquivos reais das superfícies.

## Self-Check

- `up/references/questioning.md` existe: ENCONTRADO.
- Commit `69c10f0` existe em `git log --oneline --all`: ENCONTRADO.
- Diff do commit toca exatamente um arquivo (`up/references/questioning.md`): CONFIRMADO.
- Zero em-dash / en-dash no arquivo inteiro após a edição (`grep -n "—\|–"`): CONFIRMADO, nenhuma ocorrência.
- Nenhum arquivo fora de `files_modified` foi tocado (`git status --short` mostra só `up/references/questioning.md`): CONFIRMADO.

## Self-Check: PASSOU
