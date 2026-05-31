# GATE-WAVES — Verificacao adversarial do fix de waves em build.md

Arquivo verificado: `/home/projects/up-cc/up/workflows/build.md` (864 linhas)
Data: 2026-05-31
Metodo: evidencia real (grep/awk/node + smoke-test do CLI), postura cetica.

## Tabela PASS/FAIL

| # | Check | Veredito |
|---|-------|----------|
| 1 | Nenhum `*-PLAN.md \| head -1` (carregamento de plano unico) | PASS |
| 2 | `init executar-fase` presente no Estagio 3 (motor religado) | PASS |
| 3 | LOOP DE WAVES explicito (ordem, paralelo, barreira, resume) | PASS |
| 4 | Passos de FASE (3.5-3.9) rodam UMA VEZ por fase apos as waves | PASS |
| 5 | 3.0 worktree/GitHub-nativo, --solo, teste visual, --board intactos | PASS |
| 6 | Markdown bem-formado (cercas ``` balanceadas) | PASS |
| 7 | `init executar-fase` existe e responde | PASS |

**RESULTADO GLOBAL: PASS (7/7).**

---

## Evidencia por check

### Check 1 — PASS
`grep -n 'head -1'` retornou 5 ocorrencias, NENHUMA carregando plano unico:
- L123 `grep "runtime:" .plano/PLAN-READY.md | head -1` — campo escalar runtime. OK.
- L280 comentario: "NAO existe mais '1 plano por fase' (era a regressao do `head -1`)". Prosa. OK.
- L329 `grep -oE '^type:' "$PLAN" | head -1` — primeira linha `type:` de UM arquivo de plano ja resolvido (`$PLAN`), dentro do loop por-plano. Nao seleciona 1 plano entre N. OK.
- L476 `grep -oE 'overall...' | head -1` — parse de JSON do verify-static. OK.
- L537 comentario: "nao mais 1 plano via head -1". Prosa. OK.
O loader de plano unico foi removido. Descoberta agora usa `phase-plan-index` (plans[] + waves).

### Check 2 — PASS
`init executar-fase` aparece em L288 (Estagio 3.1), dentro de bloco bash que captura metadados da fase + `paralelizacao`:
```
288:INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init executar-fase {phase_number} --cwd "$WORKTREE" --raw)
```

### Check 3 — PASS (todos os 4 sub-itens)
Secao 3.2+3.3 "LOOP DE WAVES" (L314-431):
- (a) itera waves em ordem crescente: L305-306 "Ordenar as waves por numero CRESCENTE"; L316 "Iterar as waves em ordem crescente. Para CADA wave:".
- (b) spawna multiplos executores em paralelo quando parallelization=true: L345-348 "Se `PARALLELIZATION=true`: spawnar TODOS os executores da wave EM PARALELO (multiplos `Agent()` numa UNICA mensagem...)"; fallback sequencial se false.
- (c) espera a wave terminar antes da proxima: L402-403 "Esperar TODOS os executores da wave terminarem antes de iniciar a proxima wave"; L312 "a wave N+1 so comeca quando a wave N inteira termina"; GATE A por wave em L405-415.
- (d) pula plano com SUMMARY (resume): L318-320 "Selecionar os planos da wave que ainda NAO tem SUMMARY (resume): pular todo plano com `has_summary: true`".
Garantia de seguranca documentada em L309-312 (planos da mesma wave sao independentes / arquivos disjuntos).

### Check 4 — PASS
Boundary explicita em L433-434: "A partir daqui (3.4-3.9) o escopo e a FASE INTEIRA... Roda UMA VEZ por fase, depois de TODAS as waves." Os passos de fase NAO estao dentro do loop de plano (que fecha em L422 "Repetir 1-5 ate a ultima wave" / L424 "Fim do loop de waves"):
- 3.5 Verificacao da FASE: L467-469 "Roda UMA VEZ por fase, depois de TODAS as waves. O verificador valida a FASE INTEIRA".
- 3.6 E2E+DCRV: L515-521 SCOPE=phase (fase inteira).
- 3.7 Revisor + GATE: L525-527 "Roda UMA VEZ por fase, depois de TODAS as waves"; agrega tipos de TODOS os planos via `${PHASE_DIR}/*-PLAN.md` (L538, nao head -1); GATE de fase em L596-625.
- 3.8 teste visual pre-merge + close: L634-741 (3.8.0 visual gate, finish-phase).
- 3.9 reassessment: L764-779 "Apos o GATE aprovar e ANTES de planejar/executar a proxima fase".
O loop de fase abre em L230 ("Para cada fase em ROADMAP.md (em ordem):") e contem 3.0->3.9 uma vez por fase.

### Check 5 — PASS (nada quebrou)
- 3.0 worktree/GitHub-nativo: L232-275 intacto (`github start-phase`, EnterWorktree/ExitWorktree, git-map.json, fail-open).
- --solo: L60-61, L184-196, L250-251, L262, L638-639, L734, L762 — escape hatch preservado (forca github_native=false, commit na branch atual, sem worktree).
- Teste visual (require_visual_test): L62-66, L641-654 (3.8.0), default true, gate pre-merge.
- Multica --board: L67-71, L199-226, L264-273, L736-758, L815-823 — opt-in, batched, fail-open (`uname -s` Mac->ssh server-ecoup, nunca crasha).

### Check 6 — PASS
Analise via node: 86 cercas iniciando em coluna 0 (par/balanceado) + 1 par de cercas indentadas (L588/L590, bloco `echo ... approvals.log` dentro do prompt do up-revisor, aberto e fechado). Total 88 (= `grep -c '```'`), todas balanceadas. Markdown bem-formado.

### Check 7 — PASS
`cd /tmp && node up-tools.cjs init executar-fase 1 --raw` responde com JSON valido (`phase_found: false` fora de projeto, sem crash) e inclui `paralelizacao: true`. Comandos do motor de waves existem no CLI: `init` (L?), `phase-plan-index` (L487), `resolve-model-for-plan` (L445), `verify-static` (L433), `github start-phase/finish-phase` (L374). `phase-plan-index 1 --raw` retorna shape esperada (`plans`, `waves`, `incomplete`, `has_checkpoints`).

---

## FAILs
Nenhum. O fix de waves esta completo e coerente. Nenhuma regressao residual do `head -1`, motor de waves religado e funcional, passos de fase corretamente fora do loop de plano, integracoes (GitHub-nativo/--solo/visual/--board) intactas, markdown valido, CLI responde.
