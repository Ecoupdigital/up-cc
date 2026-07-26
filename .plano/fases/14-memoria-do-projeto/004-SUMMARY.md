---
phase: 14-memoria-do-projeto
plan: 004
subsystem: glossario-interno
tags: [memoria, glossario, regua-de-redefinicao, citacao, contagem-deterministica]
dependency_graph:
  requires:
    - "up/references/glossario-up.md (plano 001, fonte dos nove termos e das quatro formas)"
    - "up/bin/lib/memoria.cjs (plano 002, entrada `glossario` ja reservada)"
  provides:
    - "up/bin/lib/memoria-glossario.cjs: acoes check (contagem de redefinicao) e citacao (cobertura da linha de vocabulario)"
    - "linha de citacao identica nos doze agentes, nos doze workflows e nas duas skills up-tdd/up-verificar-antes-de-concluir"
  affects:
    - "plano 006 (verificacao final da fase), que roda esta contagem e resolve o achado de skill de outro dono, se houver"
tech_stack:
  added: []
  patterns:
    - "leitura pura, sem escrita: o submodulo so le arquivos e conta, nunca cria diretorio nem grava"
    - "formas estruturais fechadas + cortes numerados, para regua de redefinicao nao confundir com poda de prosa"
key_files:
  created:
    - up/bin/lib/memoria-glossario.cjs
    - up/bin/lib/memoria-glossario.test.cjs
  modified:
    - up/agents/up-arquiteto.md
    - up/agents/up-auditor.md
    - up/agents/up-depurador.md
    - up/agents/up-executor.md
    - up/agents/up-mapeador-codigo.md
    - up/agents/up-pesquisador.md
    - up/agents/up-planejador.md
    - up/agents/up-revisor.md
    - up/agents/up-roteirista.md
    - up/agents/up-sintetizador.md
    - up/agents/up-tester.md
    - up/agents/up-verificador.md
    - up/workflows/auditar.md
    - up/workflows/build.md
    - up/workflows/dcrv.md
    - up/workflows/governance.md
    - up/workflows/mapear-codigo.md
    - up/workflows/onboarding.md
    - up/workflows/pausar.md
    - up/workflows/plan.md
    - up/workflows/rapido.md
    - up/workflows/remover-fase.md
    - up/workflows/resetar.md
    - up/workflows/up.md
    - up/skills/up-tdd/SKILL.md
    - up/skills/up-verificar-antes-de-concluir/SKILL.md
    - up/bin/lib/memoria-decisao.test.cjs (desvio, ver secao de desvios)
decisions: []
metrics:
  duration_minutes: null
  tasks_completed: 7
  files_touched: 27
  completed_at: "2026-07-26T03:00:58Z"
---

# Fase 14 Plano 004: Definição única e citação nas superfícies Summary

Contagem determinística de redefinição do glossário interno do UP, via quatro formas estruturais fechadas e três cortes numerados, mais a linha de citação idêntica nos doze agentes, nos doze workflows e nas duas skills deste plano, com aceite zero alcançado sem podar redação nenhuma.

## O que foi entregue

`up/bin/lib/memoria-glossario.cjs` (submódulo `glossario` do espaço `memoria`, entrada já reservada pelo plano 002): leitura pura, nunca escreve arquivo nem cria diretório.

- **Leitura do glossário** (`lerTermos`): extrai da seção `## Termos` o termo canônico, a lista de formas e a lista de sinônimos evitados de cada verbete, lançando exceção nomeando o termo quando falta uma das três linhas obrigatórias (Definição, Formas, Evitar). Contra o glossário real devolve os nove verbetes.
- **Varredura** (`arquivosVarridos`): lista os `.md` de seis pastas (agents, workflows, skills, commands, references, templates), a partir da raiz do pacote resolvida subindo do diretório do módulo, excluindo o próprio arquivo de glossário pelo nome (não pelo caminho, para funcionar também contra árvore de fixtures).
- **Ação `check`**: conta redefinição concorrente pelas quatro formas (rótulo em negrito, item de lista, primeira célula de tabela fora do cabeçalho, cabeçalho markdown igual ao termo ou a "O que é `<termo>`"), com os três cortes (prosa com oito palavras ou mais, nunca dentro de bloco de código, nunca linha que já cita o glossário). Flags `--pastas` (recorte) e `--estrito` (achado acima de zero lança exceção, saída 1).
- **Ação `citacao`**: mede cobertura da linha de vocabulário em agents e workflows (não considera comandos nem templates), devolvendo contagem com/sem citação, lista dos que faltam e aprovação. `--estrito` lança exceção quando falta algum.
- **Linha de citação** inserida nos doze agentes (logo após o frontmatter), nos doze workflows (logo após `</purpose>`) e nas duas skills deste plano (up-tdd, up-verificar-antes-de-concluir; logo após o frontmatter). A skill de brainstorm (plano 005) e a skill de bootstrap (plano 001, que já cita o glossário com texto próprio desde aquele plano) não foram tocadas aqui.

## Prova (tarefa 4): vermelho antes de verde

Antes das tarefas 1 a 3 (módulo ainda não existia):

```
node:internal/modules/cjs/loader:1386
  throw err;
Error: Cannot find module './memoria-glossario.cjs'
```
Saída: 1.

Depois das tarefas 1 a 3 e do arquivo de teste (19 casos, sem framework, árvore de fixtures própria em diretório temporário):

```
19 passed, 0 failed
```
Saída: 0.

## Prova (tarefa 3): cobertura de citação antes e depois do passe

Antes do passe das tarefas 5 e 6:
```
{ "com_citacao": 0, "sem_citacao": 24, "aprovado": false }
```
24 arquivos faltando: os doze agentes + os doze workflows.

Depois do passe:
```
{ "com_citacao": 24, "sem_citacao": 0, "faltando": [], "aprovado": true }
```

## Prova (tarefa 7): medida final, no repositório inteiro

**1) Contagem de redefinição, modo estrito, sobre agentes, workflows, references, comandos e templates:**
```
$ node up/bin/up-tools.cjs memoria glossario check --pastas agents,workflows,references,commands,templates --estrito
{ "termos_count": 9, "arquivos_count": 79, "achados": [], "total": 0, "aprovado": true }
```
Saída: 0.

**2) Cobertura de citação, modo estrito (agentes e workflows):**
```
$ node up/bin/up-tools.cjs memoria glossario citacao --estrito
{ "com_citacao": 24, "sem_citacao": 0, "faltando": [], "aprovado": true }
```
Saída: 0.

**3) Contagem de redefinição, modo relatório, sobre a pasta de skills** (inclui `usando-up` do plano 001 e `up-brainstorm` do plano 005, que este plano não pode converter):
```
$ node up/bin/up-tools.cjs memoria glossario check --pastas skills
{ "termos_count": 9, "arquivos_count": 5, "achados": [], "total": 0, "aprovado": true }
```
Zero achados nas cinco superfícies de skill (as duas deste plano + `usando-up` + as duas do brainstorm). Nada para encaminhar ao plano 006: a skill de bootstrap já cita o glossário com o próprio texto desde o plano 001, e a skill de brainstorm não contém nenhuma das quatro formas.

## Por que o aceite zero não exigiu conversão nenhuma

O baseline medido antes de qualquer edição já era zero. Inspecionei manualmente as ocorrências das quatro formas casando com os nove termos/formas do glossário, hoje no repositório, e todas caem em uma de duas categorias:

- **Dentro de bloco de código cercado por crase tripla** (ex.: `up-arquiteto.md` e `up-roteirista.md` têm `## Fases`/`### Fases` dentro de blocos ```` ```markdown ```` de exemplo de template; excluídas pelo corte de bloco de código).
- **Rótulo de campo com prosa curta** (ex.: `- Fase: [XX-nome]` em `pausar.md`, `| Fases | N diretorios |` em `resetar.md`; excluídas pelo corte de oito palavras).
- **Linha de cabeçalho de tabela** (ex.: `| Fase | Planos Completos | Status | Completado |` em `up-roteirista.md`; excluída por ser a linha imediatamente anterior ao separador, não por corte de tamanho).

Por isso as tarefas 5 e 6 inseriram só a linha de citação, sem converter nenhum bloco: não havia redefinição real para converter, e a régua prova isso de forma determinística em vez de depender da minha leitura manual.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 1 - Bug/teste tornado obsoleto] Caso de teste do plano 002 assumia que "glossario" continuaria não instalado**

- **Encontrado durante:** verificação após a tarefa 1 (criação de `up/bin/lib/memoria-glossario.cjs`).
- **Issue:** `up/bin/lib/memoria-decisao.test.cjs` (do plano 002, já mesclado antes desta wave) tinha o caso `roteamento: submodulo declarado mas ainda nao instalado falha com mensagem legivel`, que invocava `memoria glossario listar` esperando a mensagem "nao esta instalado". Isso era verdade só enquanto o submódulo `glossario` não existia. A tarefa 1 deste plano, ao criar `memoria-glossario.cjs`, torna esse cenário permanentemente falso para "glossario" (e o mesmo valeria para "termo", instalado em paralelo pelo plano 005): não há mais nome, dos quatro declarados no roteador, que fique "declarado mas não instalado" ao final da onda 2.
- **Correção:** troquei o caso por um que prova a mesma garantia relevante (exceção do submódulo chega ao usuário sem rastro de pilha), agora contra uma ação inválida do submódulo já instalado (`memoria glossario acao-inexistente`), com comentário explicando a troca.
- **Arquivos modificados:** `up/bin/lib/memoria-decisao.test.cjs` (fora do `files_modified` declarado deste plano; não pertence a nenhum dos planos 003/005 que rodaram em paralelo, então não há risco de colisão).
- **Commit:** `e49d056` (`fix(14-004): atualiza teste do plano 002 tornado obsoleto pelo submodulo glossario`).

Nenhum outro desvio: as demais seis tarefas foram executadas exatamente como escritas, sem necessidade de correção automática, mudança arquitetural ou escalação.

## DECISOES ESCALADAS

- Nenhuma.

## Self-Check: PASSOU

Todos os 27 arquivos declarados (2 novos + 25 modificados) existem no disco. Todos os 7 commits deste plano existem no histórico do git (`1e3f85b`, `7bf600c`, `02fe40e`, `abb171d`, `e49d056`, `e4dd70e`, `188c2a4`). Os dois arquivos de teste (`memoria-glossario.test.cjs`, 19 casos; `memoria-decisao.test.cjs`, 25 casos) rodam limpos com saída 0.

## Notas para o plano 006 (verificação final da fase)

- A contagem de redefinição e a cobertura de citação estão prontas como comando e prova (`memoria glossario check` / `memoria glossario citacao`), mas **não estão ligadas a nenhum gate de aprovação de fase**: isso foi declarado fora de escopo deste plano de propósito.
- A pasta de skills não tem nenhum achado pendente hoje; se um achado aparecer depois (por exemplo, se a skill de brainstorm crescer e passar a redefinir um termo do glossário), a tarefa 7 já cobre o padrão de investigação (`check --pastas skills`, modo relatório).
