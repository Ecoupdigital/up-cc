---
version: "2.0.0"
planned_at: "2026-07-25"
planned_by:
  runtime: "claude-code"
  user_preferred_name: "Jonathan"
intended_execution:
  runtime: "same"
project_name: "UP (up-cc), ciclo 2"
mode: "brownfield"
total_phases: 8
total_plans: 43
total_requirements: 90
estimated_tasks: 259
status: ready_for_execution
planning_confidence: 86
---

# Projeto Pronto Para Execucao

Ciclo 2 do repositorio up-cc: importar as disciplinas do conjunto de skills do Matt Pocock
(Tier A e Tier B do briefing) e acrescentar o modo grill ao brainstorm do UP.

Fonte de verdade do escopo: `.plano/BRIEFING-tier-ab-grill.md` (commit fd32682).
Laudo do planejamento: `.plano/AUDIT-PLAN.md` (confidence 86, APPROVE).
Laudo de requisitos: `.plano/REQUIREMENTS-VALIDATION.md` (85 por cento, READY).

## Como executar

```
/up:build
```

Modo pedido pelo dono: `--solo` (autonomo total, mantem GitHub, sem menu de fechamento
e sem gate visual). O estado inteiro vive em `.plano/` e sobrevive a limpeza de contexto.

## Resumo

**Briefing:** 13 itens em 7 blocos, extraidos de 22 skills analisadas. O UP ganha as
disciplinas que faltam a um pipeline autonomo (formato de pergunta, memoria de projeto,
honestidade da prova, planejamento por grafo, higiene de contexto, auditoria escopada),
sem adotar a arquitetura sem orquestrador do sistema de origem.

**Stack:** Node.js puro (CommonJS), markdown estruturado, sem build step. Instalacao em
4 runtimes (Claude Code, Gemini CLI, OpenCode, Codex CLI).

**Modo:** brownfield, extensao de um `.plano/` existente. As fases 1 a 10 (ciclo 1) e 11 e 12
sao historico preservado. Este ciclo e das fases 13 a 20.

## Fases planejadas

| # | Fase | Planos | Tarefas | Ondas |
|---|------|--------|---------|-------|
| 13 | Formato de pergunta | 5 | 31 | 3 |
| 14 | Memoria do projeto | 6 | 36 | 3 |
| 15 | Modo grill | 4 | 20 | 3 |
| 16 | Honestidade da prova | 5 | 26 | 5 |
| 17 | Planejamento por grafo | 5 | 41 | 3 |
| 18 | Contexto e revisao | 7 | 45 | 4 |
| 19 | Auditoria visual e escopada | 6 | 33 | 5 |
| 20 | Nevoa e fronteira do roadmap | 5 | 27 | 4 |

## Ordem de execucao

O grafo do ciclo tem duas camadas separadas de proposito, descritas em `.plano/ROADMAP.md`.

**Camada 1, dependencia logica (arestas):**
- A fase 13 e a raiz. Todas as outras dependem dela, porque ela muda o formato de toda
  pergunta do sistema.
- A fase 15 depende da 13 e da 14 (o grill escreve no glossario e nos registros de decisao).
- A fase 18 depende da 16 (consome o leitor unico do log de aprovacoes e tem proibicao
  escrita de reimplementa-lo).
- A fase 20 e a ultima e nada depende dela, o que a torna o corte mais barato.

**Camada 2, serializacao por posse de arquivo (nao e aresta):**
- As fases 14, 16, 17 e 18 executam em serie, nesta ordem, mesmo quando a fronteira as
  liberar juntas. Sao 19 arquivos em disputa, e o despachante da CLI e escrito por sete
  das oito fases. Isso e exclusao mutua, nao dependencia, e por isso nao poluiu o grafo:
  a fase 17 constroi o mecanismo que deriva a fronteira a partir dessas arestas.

**Regra de execucao:** fronteira liberada nao autoriza paralelismo entre dois trabalhos
que escrevem no mesmo arquivo. A fronteira responde quem pode comecar, nunca quem pode
comecar junto.

**Inicio recomendado pelo revisor:** fase 13.

## Aprovacoes registradas

Em `.plano/governance/approvals.log`:

- [x] `up-sintetizador`, validacao de requisitos: READY (85 por cento, apos duas rodadas)
- [x] `up-revisor`, revisao de planejamento: APPROVE, confidence 86 (apos uma rodada de rework)

Nao existem aprovacoes de CEO, chiefs ou supervisores neste ciclo: esses papeis foram
removidos na v2 e o gate e o log deterministico mais o revisor unico.

## Dividas declaradas

1. **Emendas aplicadas apos o APPROVE**, em planos nao iniciados: RV-013 (o estagio de
   validacao de planos do motor de execucao aprova sempre porque a extracao da lista usa
   um padrao de nome que nenhum dos 43 planos casa, e lista vazia nao seta falha) entrou
   como item na fase 17. RV-007, RV-011 e RV-014 sao correcoes de documentacao.
2. **13 arquivos ainda compartilhados** entre pares de fases que nenhuma das duas camadas
   ordena (15, 19 e 20 entre si e com as demais). Severidade baixa: sao acrescimos aditivos,
   nao reescrita do mesmo bloco. Serializar essas tres sequenciaria o ciclo inteiro.
3. **Sedimento fora de escopo por decisao do dono:** o template do plano pronto e as regras
   de governanca ainda descrevem CEO, chiefs e supervisores. As fases 16 e 17 tocam esses
   arquivos apenas para acrescentar campo novo. A limpeza fica para um passe proprio.
4. **Inconsistencia herdada do ciclo 1:** a fase 7 aparece como 1 de 2 planos e a fase 10
   aparece desmarcada na lista e concluida na tabela. Corrigir exigiria editar o bloco
   preservado byte a byte, entao fica registrado como divida conhecida.

## Listagem completa de planos

Convencao de nome: `NNN-PLAN.md` dentro de `fases/NN-slug/`. E a forma que o indice de
planos le hoje. Atencao ao executar: o estagio V.4 do motor de execucao procura o padrao
`fases/NN-slug/NNN-NNN-PLAN.md`, que nenhum destes 43 arquivos casa, e por isso valida
uma lista vazia sem acusar falha. A correcao e o item RV-013 da fase 17.

| ID | Path | Onda | Tarefas |
|----|------|------|---------|
| 13-001 | fases/13-formato-de-pergunta/001-PLAN.md | 1 | 6 |
| 13-002 | fases/13-formato-de-pergunta/002-PLAN.md | 2 | 6 |
| 13-003 | fases/13-formato-de-pergunta/003-PLAN.md | 2 | 6 |
| 13-004 | fases/13-formato-de-pergunta/004-PLAN.md | 2 | 6 |
| 13-005 | fases/13-formato-de-pergunta/005-PLAN.md | 3 | 7 |
| 14-001 | fases/14-memoria-do-projeto/001-PLAN.md | 1 | 5 |
| 14-002 | fases/14-memoria-do-projeto/002-PLAN.md | 1 | 6 |
| 14-003 | fases/14-memoria-do-projeto/003-PLAN.md | 2 | 6 |
| 14-004 | fases/14-memoria-do-projeto/004-PLAN.md | 2 | 7 |
| 14-005 | fases/14-memoria-do-projeto/005-PLAN.md | 2 | 6 |
| 14-006 | fases/14-memoria-do-projeto/006-PLAN.md | 3 | 6 |
| 15-001 | fases/15-modo-grill/001-PLAN.md | 1 | 5 |
| 15-002 | fases/15-modo-grill/002-PLAN.md | 2 | 3 |
| 15-003 | fases/15-modo-grill/003-PLAN.md | 2 | 7 |
| 15-004 | fases/15-modo-grill/004-PLAN.md | 3 | 5 |
| 16-001 | fases/16-honestidade-da-prova/001-PLAN.md | 1 | 5 |
| 16-002 | fases/16-honestidade-da-prova/002-PLAN.md | 2 | 5 |
| 16-003 | fases/16-honestidade-da-prova/003-PLAN.md | 3 | 5 |
| 16-004 | fases/16-honestidade-da-prova/004-PLAN.md | 4 | 5 |
| 16-005 | fases/16-honestidade-da-prova/005-PLAN.md | 5 | 6 |
| 17-001 | fases/17-planejamento-por-grafo/001-PLAN.md | 1 | 7 |
| 17-002 | fases/17-planejamento-por-grafo/002-PLAN.md | 2 | 9 |
| 17-003 | fases/17-planejamento-por-grafo/003-PLAN.md | 1 | 10 |
| 17-004 | fases/17-planejamento-por-grafo/004-PLAN.md | 2 | 8 |
| 17-005 | fases/17-planejamento-por-grafo/005-PLAN.md | 3 | 7 |
| 18-001 | fases/18-contexto-e-revisao/001-PLAN.md | 1 | 6 |
| 18-002 | fases/18-contexto-e-revisao/002-PLAN.md | 2 | 6 |
| 18-003 | fases/18-contexto-e-revisao/003-PLAN.md | 2 | 6 |
| 18-004 | fases/18-contexto-e-revisao/004-PLAN.md | 1 | 7 |
| 18-005 | fases/18-contexto-e-revisao/005-PLAN.md | 2 | 6 |
| 18-006 | fases/18-contexto-e-revisao/006-PLAN.md | 3 | 6 |
| 18-007 | fases/18-contexto-e-revisao/007-PLAN.md | 4 | 8 |
| 19-001 | fases/19-auditoria-visual-escopada/001-PLAN.md | 1 | 5 |
| 19-002 | fases/19-auditoria-visual-escopada/002-PLAN.md | 2 | 6 |
| 19-003 | fases/19-auditoria-visual-escopada/003-PLAN.md | 2 | 7 |
| 19-004 | fases/19-auditoria-visual-escopada/004-PLAN.md | 3 | 5 |
| 19-005 | fases/19-auditoria-visual-escopada/005-PLAN.md | 4 | 4 |
| 19-006 | fases/19-auditoria-visual-escopada/006-PLAN.md | 5 | 6 |
| 20-001 | fases/20-nevoa-e-fronteira-do-roadmap/001-PLAN.md | 1 | 5 |
| 20-002 | fases/20-nevoa-e-fronteira-do-roadmap/002-PLAN.md | 2 | 6 |
| 20-003 | fases/20-nevoa-e-fronteira-do-roadmap/003-PLAN.md | 2 | 6 |
| 20-004 | fases/20-nevoa-e-fronteira-do-roadmap/004-PLAN.md | 3 | 5 |
| 20-005 | fases/20-nevoa-e-fronteira-do-roadmap/005-PLAN.md | 4 | 5 |

## Artefatos disponiveis

```
.plano/
├── BRIEFING-tier-ab-grill.md    escopo aprovado do ciclo
├── SYSTEM-DESIGN.md             modulos, fluxo, matriz de escrita, riscos
├── PROJECT.md                   visao e decisoes (dono e arquiteto)
├── ROADMAP.md                   fases 1 a 20 e o grafo em duas camadas
├── REQUIREMENTS.md              95 requisitos do ciclo 2, ciclo 1 preservado
├── REQUIREMENTS-VALIDATION.md   laudo de requisitos
├── AUDIT-PLAN.md                laudo de planejamento (confidence 86)
├── PLAN-READY.md                este arquivo
├── governance/approvals.log     gate deterministico
└── fases/
    ├── 13-formato-de-pergunta/        001 a 005-PLAN.md
    ├── 14-memoria-do-projeto/         001 a 006-PLAN.md
    ├── 15-modo-grill/                 001 a 004-PLAN.md
    ├── 16-honestidade-da-prova/       001 a 005-PLAN.md
    ├── 17-planejamento-por-grafo/     001 a 005-PLAN.md
    ├── 18-contexto-e-revisao/         001 a 007-PLAN.md
    ├── 19-auditoria-visual-escopada/  001 a 006-PLAN.md
    └── 20-nevoa-e-fronteira-do-roadmap/ 001 a 005-PLAN.md
```
