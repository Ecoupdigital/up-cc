# Relatorio final - Fase 17 (planejamento por grafo)

Executor: Grok (worktree isolada `up/fase-17-planejamento-por-grafo`).
Data: 2026-07-27.

## Tabela de planos

| Plano | Status | Commit | Prova |
|-------|--------|--------|-------|
| 001 leitura nomes | feito | `3f61de5` fix: leitura de plano e resumo... | logic red/green 10 casos; fases reais |
| 003 tamanho/adjetivos | feito | `1da2566` feat: tamanho de plano em janela... | logic 10 casos; validate-plan window_* |
| 002 fronteira | feito | `75ec26e` feat: grafo de bloqueio e fronteira... | logic 12 casos fronteira (22 total) |
| 004 durabilidade | feito | `b28e86d` feat: durabilidade do plano... | logic 13 casos (23 total) |
| 005 fechamento | feito | `dd6905b` chore: fechar fase 17... | smoke comandos/runtimes + suite |
| herdado A schema2 | feito | `dd6905b` | gate plan-ready pass schema 2 |
| herdado B install | feito | `dd6905b` | grep conteudo em HOME temp |
| mutacao 006 | feito | `dd6905b` evidencia `006-mutacao.txt` | 6 mutacoes + reversoes |

## Como rodar os testes

```bash
# Inventario + fronteira
node up/bin/lib/plans.test.cjs
# Esperado: 22 passed, 0 failed

# Adjetivos, janela, durabilidade, secoes
node up/bin/lib/plan-checks.test.cjs
# Esperado: 23 passed, 0 failed

# Integracao github (pre-existente)
node up/bin/lib/github.test.cjs
# Esperado: 10 passed, 0 failed

# Indice e fronteira na fase 17
node up/bin/up-tools.cjs phase-plan-index 17

# Validacao de plano com estimativa
node up/bin/up-tools.cjs validate-plan .plano/fases/17-planejamento-por-grafo/003-PLAN.md

# Verificacao estatica (inclui plan-checks)
node up/bin/up-tools.cjs verify-static
```

## O que ficou por fazer

1. **Transcrever linha do log de aprovacoes** no main (governance e gitignored na worktree).
2. **Merge da branch** por revisor humano (executor nao faz push/PR).
3. **Autoaplicacao de durabilidade** nos 5 planos desta fase: FAIL documentado (corpos de tarefa ainda citam caminhos em verify/evidencia). Novos planos apos o ciclo devem passar.
4. **core.cjs `searchPhaseInDir`** ainda filtra por sufixo literal (fora do escopo do 001). Contornado em init executar-fase.
5. **Dívidas conhecidas** (nao tocadas): `init up` / `init auditar`; familia `state *` de formato legado.
6. **Sedimento CEO/chiefs** no template plan-ready: fora de escopo declarado.
7. **Fase 11** nao versionada no git (so untracked no main); convencao PLAN-* coberta por testes unitarios.

## Decisoes escaladas (consolidadas)

1. **Retrocompat mode aresta** quando `depends_on` ja existe no frontmatter historico (fases 3-10), em vez de forcar onda. Honra arestas reais que o motor antigo ignorava.
2. **Autoaplicacao 004 FAIL honesto** nos 5 planos da fase 17; nao reescrever a especificacao da fase para maquiar PASS.
3. **Frontmatter inteiro isento** da varredura de caminho (trava de escopo e metadados).
4. **countTasks** so conta `<task` no inicio de linha (evita mencoes em prosa).
5. **verify-static plan-checks** varre fase corrente + doutrina, nao o historico inteiro.
6. **um/uma** nao contam como numero na regra de adjetivo (sao artigo).

## Avaliacao critica da prova (o que um revisor cetico derruba primeiro)

1. **Vermelho de ausencia de modulo** (001, 003, 004) e o primeiro passo classico; a mutacao (006) e o que realmente discrimina comportamento. M3 original quebrou sintaxe; M3b (`void 0`) e a evidencia util. Revisor deve olhar M3b, nao o M3 quebrado.
2. **Autoaplicacao dos planos da fase em durabilidade e FAIL**: se o revisor exigir PASS nos 5 planos schema 2, a fase nao fecha sem reescrita grande. A defesa e a nota do proprio plano ("a regra e o que a fase constroi") + evidencia de que o harness rejeita caminho em fixture temp.
3. **Estimativa de janela** usa soma aproximada de STATE/config/REQUIREMENTS, nao o bloco exacto de `context` com manifest; e deterministica e suficiente para o contrato, mas nao e bit-identical ao pre-inline do executor.
4. **Fase 11** so foi provada com copia temporaria + testes unitarios; se o revisor exigir `phase-plan-index 11` no git tree limpo, falha (diretorio nao versionado).
5. **Mutacao M5** (lista vazia via parse) e M6 cobrem caminhos importantes; nenhum caso "sobreveve a todas as mutacoes da superficie" sem justificativa, mas o harness de teste em si nao tem mutacao do runner.
6. **Workflow build.md V.4** e instrucao para orquestrador, nao um script executado nos testes; a garantia e greps + smoke manual, nao um e2e do shell do workflow.
7. **Regressao de install** confirma conteudo nos workflows; nao reexecuta um `/up:build` real ponta a ponta.

## Hashes e self-check final

Rodar apos merge local dos commits desta sessao:

```bash
git log --oneline -10
node up/bin/lib/plans.test.cjs
node up/bin/lib/plan-checks.test.cjs
grep -rlP '[\x{2014}\x{2013}]' up/bin/lib/plans.cjs up/bin/lib/plan-checks.cjs || echo zero
```
