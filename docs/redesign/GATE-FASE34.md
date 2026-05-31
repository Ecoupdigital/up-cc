# GATE DE ACEITE — UP v2 Fases 3 (TDD) + 4 (GitHub-native)

Data: 2026-05-30
Repo de codigo: `/home/projects/up-cc`
Branch real no momento do teste: `redesign/up-v2-github-native` (NAO tocada)
Metodo: provas REAIS. Todo fluxo git rodou em repo DESCARTAVEL em `/tmp`, isolado, SEM remote GitHub.
NENHUMA issue/PR/branch criada no GitHub real do up-cc.

## Tabela PASS/FAIL

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Sintaxe `node -c` (github.cjs, up-tools.cjs, core.cjs) | PASS |
| 2 | Degrade gracioso sem `.plano` (`github status`) | PASS |
| 3 | Fluxo git LOCAL real isolado (start-phase + finish-phase, fail-open) | PASS |
| 4 | Isolamento do repo REAL up-cc (nao tocado) | PASS |
| 5 | Gate TDD (Fase 3): bloqueia sem `evidence`, passa com `evidence` | PASS |
| 6 | `rapido.md` sem cerimonia (worktree/issue/PR/git-map) | PASS |
| 7 | Ref `tdd-evidence-types.md` existe + `up-verificador.md` referencia | PASS |

RESULTADO GLOBAL: 7/7 PASS. Nenhum FAIL.

---

## CHECK 1 — SINTAXE (`node -c`) — PASS

```
github.cjs: PASS
up-tools.cjs: PASS
core.cjs: PASS
```

Os tres arquivos compilam sem erro de sintaxe.

---

## CHECK 2 — DEGRADE GRACIOSO sem `.plano` — PASS

Rodado em `/tmp/up-gh-noplano` (dir vazio, sem `.plano`, sem git repo):

```
$ node /home/projects/up-cc/up/bin/up-tools.cjs github status
{
  "github_native": true,
  "merge_strategy": "squash",
  "gh_available": true,
  "has_remote": false,
  "remote": null,
  "phases": {}
}
EXIT=0
```

Nao crashou. Exit 0. Saida JSON limpa, `phases: {}` (defaults). `readGitMap` retorna defaults
quando `.plano/git-map.json` nao existe (github.cjs L158-160). Sem stack trace, sem exit 2.

Observacao de ambiente: nesta maquina `gh` ESTA instalado e autenticado (`gh_available: true`).
Por isso, para provar o fail-open por falta de remote no Check 3, o repo de teste foi criado
explicitamente SEM remote `origin` (forcando o caminho git-local).

---

## CHECK 3 — FLUXO GIT LOCAL REAL (isolado, sem remote) — PASS

Repo descartavel: `/tmp/up-gh-test-2572335` (`git init`, user configurado, commit inicial
`3b08396`, `.plano/governance` criado). Confirmado SEM remote (`git remote -v` vazio), branch base `main`.

### start-phase

```
$ node .../up-tools.cjs github start-phase --phase 1 --slug teste-fluxo
{
  "branch": "up/fase-01-teste-fluxo",
  "worktree": "/tmp/.up-worktrees/up-gh-test-2572335/fase-01-teste-fluxo",
  "issue": null,
  "issue_url": null,
  "mode": "git-local",
  "warnings": ["sem remote origin: degradando para git local (sem issue/PR)"]
}
EXIT=0
```

ASSERTs:
- branch `up/fase-01-teste-fluxo` existe — `git branch --list` -> `+ up/fase-01-teste-fluxo` OK
- worktree criada FORA do repo — `git worktree list`:
  `/tmp/.up-worktrees/up-gh-test-2572335/fase-01-teste-fluxo  3b08396 [up/fase-01-teste-fluxo]` OK
- `.plano/git-map.json` escrito com phase `"1": {branch, worktree, issue:null, pr:null, status:"in_progress"}` OK
- exit 0, sem crash por falta de gh remote (fail-open, mode `git-local`, warning explicito) OK

### commit dentro da worktree

```
$ (na worktree) echo feature > feature.txt; git add; git commit -m "feat: trabalho da fase 1"
838ad1f feat: trabalho da fase 1
3b08396 chore: initial commit
```
`main` continua em `3b08396` antes do finish.

### finish-phase --mode auto --strategy squash

```
$ node .../up-tools.cjs github finish-phase --phase 1 --mode auto --strategy squash
{
  "mode": "auto",
  "action": "merged",
  "pr": null,
  "pr_url": null,
  "branch": "up/fase-01-teste-fluxo",
  "strategy": "squash",
  "status": "merged",
  "warnings": ["sem gh/remote: merge local da branch up/fase-01-teste-fluxo em main"]
}
EXIT=0
```

ASSERTs:
- sem remote -> degradou para merge LOCAL squash na base `main`:
  `git log main` -> `4f4e351 feat(fase-01): merge da fase` / `3b08396 chore: initial commit` OK
- `feature.txt` mesclado em `main` (conteudo da fase chegou na base) OK
- cleanup: branch `up/fase-01-teste-fluxo` removida (`git branch --list` vazio); worktree
  desregistrada (`git worktree list` mostra so o repo principal) OK
- exit 0, sem crash (fail-open documentado por warning) OK
- `git-map.json` atualizado -> phase 1 `status: "merged"` OK

Nota minor (NAO bloqueia, cosmetico): apos `git worktree remove`, o diretorio-pai
`.../fase-01-teste-fluxo` ficou como pasta VAZIA no disco (git removeu o registro + arquivos da
worktree; `git worktree list` e `git worktree prune` consideram tudo limpo). Sugestao opcional
para versao futura: `rmdir` best-effort do dir vazio apos `worktree remove`. Nao afeta corretude
nem isolamento.

Limpeza: `/tmp/up-gh-test-2572335` e `/tmp/.up-worktrees/...` removidos. Sweep final confirmou
zero artefatos `/tmp/up-gh-*`, `/tmp/up-gate-*`, `/tmp/.up-worktrees`.

---

## CHECK 4 — ISOLAMENTO do repo REAL up-cc — PASS

Snapshot ANTES vs DEPOIS do teste, identicos:

| Item | ANTES | DEPOIS |
|------|-------|--------|
| branches `up/fase-*` | (nenhuma) | (nenhuma) |
| worktrees | so `/home/projects/up-cc [redesign/up-v2-github-native]` | identico |
| `.plano/git-map.json` | inexistente | inexistente (GOOD) |
| `git status --porcelain` | 9 M + 3 ?? (redesign/, github.cjs, tdd-evidence-types.md) | byte-identico |

Nenhuma worktree/branch `up/fase-*` de teste no repo real. Nenhum `git-map.json` novo no working
tree principal. O `.plano/` do repo real e pre-existente (projeto real) e NAO ganhou git-map.json.
O repo real NAO foi tocado pelo teste.

---

## CHECK 5 — GATE TDD (Fase 3) — PASS

Logica extraida VERBATIM de `build.md` Estagio 3, secao "GATE de fase: veredito do revisor
(deterministico)" (linhas 476-499). Rodada contra `approvals.log` simulado com SUMMARY.md +
VERIFICATION.md presentes (para isolar a checagem do campo `evidence`), `EVIDENCE_TYPE=logic`
(default da Fase 3 em build.md L419).

Trecho-chave do gate (build.md L487-492):
```bash
EVIDENCE_FIELD=$(echo "$REVISOR_ENTRY" | grep -oE 'evidence=(logic|ui|glue):(test_pass|visual|smoke)')
if [ -z "$EVIDENCE_FIELD" ]; then
  echo "FALHA: up-revisor logou sem campo evidence=<tipo>:<resultado>..." && PASS=false
elif [ -n "$EVIDENCE_TYPE" ] && ! echo "$EVIDENCE_FIELD" | grep -q "evidence=${EVIDENCE_TYPE}:"; then
  echo "FALHA: evidence de tipo errado..." && PASS=false
fi
```

### Caso (a) — up-revisor SEM campo evidence
Linha: `... | phase-3 | up-revisor | APPROVE | tudo certo`
```
=== GATE: Fase 3 ===
FALHA: up-revisor logou sem campo evidence=<tipo>:<resultado>. Re-rodar revisor com prova fresca.
GATE FALHOU: spawnar o agente faltante e re-rodar.
>>> RESULTADO (a): BLOQUEOU (exit 1)
```
BLOQUEIA corretamente.

### Caso (b) — up-revisor COM evidence=logic:test_pass
Linha: `... | phase-3 | up-revisor | APPROVE | testes red-green ok | evidence=logic:test_pass`
```
=== GATE: Fase 3 ===
GATE PASSOU (DECISION=APPROVE, EVIDENCE=evidence=logic:test_pass)
>>> RESULTADO (b): PASSOU (exit 0)
```
PASSA corretamente.

Gate diferencia os dois casos exatamente como esperado.

---

## CHECK 6 — RAPIDO sem cerimonia — PASS

`grep` em `rapido.md` por worktree/git-map/issue/PR retorna SO NEGACOES explicitas (o arquivo
declara que rapido NUNCA usa essa maquinaria). Nao ha chamada a `github start-phase` /
`github finish-phase` nem escrita de `git-map.json` no fluxo.

Evidencia (rapido.md):
- L4-8 (purpose): "ESCAPE HATCH PURO (sem cerimonia GitHub) ... o modo rapido NUNCA cria worktree,
  NUNCA cria issue do GitHub, NUNCA abre PR e NAO toca em `.plano/git-map.json`. Todo o trabalho e
  committado atomicamente na branch ATUAL ... Quem quer worktree/issue/PR usa `/up:build`."
- L242 (checklist): "Artefatos committed na branch ATUAL (sem worktree, sem issue, sem PR, sem git-map.json)"
- L155/L161: `MAX_ISSUES_PER_CYCLE` / "issues corrigidas" referem-se a ISSUES de lint/DCRV (problemas
  de codigo), NAO a issues do GitHub. Sem relacao com cerimonia git.

Intencao do check satisfeita: rapido nao referencia/usa a maquinaria de cerimonia; so a menciona
para se contrastar com `/up:build`.

---

## CHECK 7 — REF + VERIFICADOR — PASS

- `/home/projects/up-cc/up/references/tdd-evidence-types.md` EXISTE (4527 bytes). Define os 3 tipos
  de evidencia (logic/ui/glue), a prova de cada um e o formato `evidence=<tipo>:<resultado>` no
  `approvals.log`. Tabela: `logic -> evidence=logic:test_pass`, `ui -> evidence=ui:visual`,
  `glue -> evidence=glue:smoke`.
- `up/agents/up-verificador.md` referencia a ref e o campo `evidence=`:
  - L190: "Carregue a referencia sob demanda: `@$HOME/.claude/up/references/tdd-evidence-types.md`."
  - L385: "... Produza `evidence=<tipo>:<resultado>` para o gate. Ver `tdd-evidence-types`."
  - Uso de `evidence=` tambem em L21, L216, L326, L330, L435.

---

## FAILs

Nenhum. 7/7 PASS.

## Notas / sugestoes opcionais (nao bloqueiam o aceite)

1. `finish-phase` deixa um diretorio VAZIO em `.up-worktrees/<repo>/fase-NN-slug` apos
   `git worktree remove` (git remove arquivos + registro; sobra so a casca da pasta). Cosmetico.
   Sugestao: `rmdir` best-effort do dir vazio (e opcionalmente do `.up-worktrees/<repo>` se vazio)
   apos o cleanup em github.cjs (~L424-431).
