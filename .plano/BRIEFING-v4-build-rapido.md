# Briefing: UP v4, build rápido com modelo menor (fase 23)

**Data:** 2026-11-13
**Origem:** pedido do dono: "funciona muito bem, só que é lento pra montar o plano e pra fazer o build. Geralmente peço no modo autônomo, mas quero manter separado também. Deixar leve e conseguir usar um modelo menor dando resultado bom."
**Status:** direção aprovada ("vai") em 2026-11-13, com as duas recomendações aceitas (plano concreto e `/up:auto`). Próximo passo: `/up:plan`.
**Visual de apoio:** organograma da v3.1 em `/tmp/claude-0/-home-projects-up-cc/cf63d384-f639-4a6b-aa8a-1d5f7d7fc3fb/scratchpad/up-arquitetura.html` (temporário).

## Problema (medido nos arquivos em 2026-11-13)

- **Instrução lida antes do primeiro código:** `/up:plan` ~62 KB, `/up:build` ~82 KB. Só o build carrega `workflows/build.md` (27 KB) + `agents/up-executor.md` (14 KB) + `references/product-engineering.md` (15 KB), mesmo na onda de 1 plano (`<execucao_inline>` manda carregar os dois inteiros).
- **Modelo fazendo trabalho de script:** `workflows/build.md` tem 20 chamadas ao `up-tools.cjs` com parse por `grep`/`sed` (slug, start-phase, init, phase-plan-index, context, resolve-model, verify-static, finish-phase, state, roadmap). Cada uma é uma ida e volta do modelo.
- **Papel demais:** plan escreve PLAN.md + PLAN-READY.md (+ commit de cada); build escreve SUMMARY longo (Prova + Checklist de completude), STATE, ROADMAP e reassessment do roadmap (3.9).
- **Dois caminhos no mesmo texto:** leve e `--profundo` convivem em `workflows/plan.md` e `build.md`; o modelo lê os dois sempre.
- **Plano abstrato demais para modelo pequeno:** a v3.1 proibiu caminho de arquivo e comando no plano ("o como é do executor"). Modelo forte se vira; modelo pequeno precisa redescobrir o código.

## Decisões do dono

| Decisão | Escolha | Alternativas rejeitadas (motivo) |
|---|---|---|
| Direção | Pacote v4: cerimônia vira código, plano concreto, executor curto, modelo do build configurável, teste como rede, corte do resto | Só enxugar texto (não tira as idas e voltas). Fundir plan e build (perde o "separado") |
| Plano | Concreto: cada entrega diz onde mexer (arquivos/áreas) e o comando que prova | Manter abstrato da v3.1 (modelo pequeno redescobre tudo, build lento e caro) |
| Autônomo vs separado | Novo `/up:auto "ideia"` = brainstorm curto + plan + build `--solo` em sequência. `/up:plan` e `/up:build` continuam separados | Só flags no build (dono pede plan+build de ponta a ponta numa porta) |
| Modelo do build | Chave `build_model` no config (`inherit` default, `sonnet`, `haiku`) | Fixar modelo (tira escolha). Roteamento automático por `classify-task` (complexo, opaco) |
| Rede de segurança | `verify-static` obrigatório no fechamento; falhou, não faz merge | Gate de aprovação da v2 (removido na v3, lento) |

## Design aprovado

### A. Cerimônia vira código (maior ganho)

- Dois verbos novos no `up-tools.cjs`, JSON limpo na saída:
  - `build open [--phase N] [--local]`: resolve config e modo, lock/crash recovery, slug, `github start-phase` (worktree, branch, issue), descobre planos e ondas, e devolve num só JSON: worktree, branch, ondas, caminho de cada PLAN.md e o contexto mínimo (trechos de STATE/requisitos da fase).
  - `build close --phase N [--mode auto|menu|local]`: roda `verify-static` (falhou = devolve erro, não mergeia), confere SUMMARY por plano, atualiza STATE e ROADMAP, `github finish-phase`, sync Multica se `--board`, libera lock.
- `workflows/build.md` vira: `open`, executar ondas, teste visual se UI e não `--solo`, menu se não autônomo, `close`. Alvo ~150 linhas.
- Plan ganha o equivalente: `plan close` gera PLAN-READY.md a partir dos PLAN.md no disco e commita. O modelo não escreve mais PLAN-READY à mão.

### B. Plano concreto (o forte pensa, o pequeno executa)

- Template `templates/plan.md` ganha por entrega: `Onde:` (arquivos ou áreas a tocar, descobertos pelo planejador) e `Prova:` com o comando exato (ou "captura de /rota" para UI).
- `Implícitos:` continua, mas o planejador destila do `product-engineering.md` só o que se aplica àquela entrega. O executor não carrega mais a referência inteira.
- Continua proibido: receita linha a linha (código, SQL, assinatura). Concreto = onde e como provar, não o código.
- `validate-plan` passa a avisar entrega sem `Onde:` ou sem comando de prova.

### C. Executor de uma página

- `agents/up-executor.md` de 287 para ~60 linhas: ler plano, editar só os `Onde:`, commit atômico por entrega, rodar a prova de cada entrega, SUMMARY.
- SUMMARY curto (~15 linhas): por entrega, prova (comando + resultado) e desvios; decisões escaladas se houver. Sai o Checklist de completude longo.
- `<execucao_inline>` deixa de mandar carregar executor + product-engineering inteiros: a sessão segue o PLAN.md.

### D. Modelo do build configurável

- `config.json`: `build_model: inherit | sonnet | haiku` (default `inherit`).
- `inherit` ou igual ao modelo da sessão: onda de 1 plano roda inline (como hoje).
- Diferente: build spawna `up-executor` com `model=<build_model>` mesmo na onda de 1 plano. A sessão (modelo forte) só abre, confere e fecha.
- Sai `resolve-model-for-plan`/`classify-task`/`routing-log`/`analyze-routing` do caminho quente (ficam ou saem, decidir no plano).

### E. `/up:auto "ideia"`

- Novo comando (8º): brainstorm no tier mínimo (pergunta só o que bloqueia, aceita a recomendação nas demais), `/up:plan` da próxima fase, `/up:build --solo` dela. Para em erro de `verify-static` ou decisão escalada que mude escopo.
- Instalação nos 4 runtimes como os outros comandos.

### F. Corte

- `--profundo` sai de `workflows/plan.md` para `workflows/plan-profundo.md`, carregado só com a flag. Mesmo para trechos de `--review` e `--testar` no build (arquivo próprio, carregado só com a flag).
- Agentes removidos: `up-pesquisador`, `up-sintetizador`, `up-roteirista` (referências em `workflows/up.md`, `plan.md`, `auditar.md` atualizadas).
- Verbos legados do `up-tools.cjs` removidos: `planejar-fase`, `executar-fase` (se `build open` substituir o `init executar-fase`), `novo-projeto`, `retomar`, `progresso`, `verificar-trabalho`, `melhorias`, `ideias`, `iniciar`, `budget`, `routing-log`, `analyze-routing`. Conferir uso real com grep antes de cada corte.
- Build: sai o reassessment do roadmap (3.9) do caminho autônomo.

## Metas (critério de pronto da v4)

- Instrução carregada: `/up:plan` <= ~12 KB, `/up:build` <= ~10 KB no caminho padrão (medir com `wc -c` nos arquivos que o caminho carrega).
- Build autônomo de uma fase: modelo faz no máximo 2 chamadas de cerimônia (`build open`, `build close`) fora do código.
- Uma fase real de exemplo executada com `build_model: sonnet` passa no `verify-static` e entrega o que o plano pede (smoke em projeto de teste).
- Instalação limpa nos 4 runtimes (smoke com `env -i`, ver memória de smoke isolado).

## Fora de escopo

- Brainstorm/grill e libs de memória (fase 14): ficam como estão nesta fase.
- Catálogos de auditoria e `/up:auditar`, `/up:testar`, `/up:depurar`: intocados.
- Fase 19 (auditoria escopada) segue pendente, sem relação.

## Riscos

- Plano concreto deixa o plan um pouco mais lento (planejador lê código para preencher `Onde:`). Aceito: o build é onde mora a lentidão e o custo.
- `build open/close` concentram lógica no Node: precisam de teste em `up/bin/lib/*.test.cjs` (padrão do repo).
- Projetos com `.plano/` da v3.1 em andamento: `build open` precisa aceitar PLAN.md sem `Onde:` (cai no comportamento atual, com aviso).

## Tamanho

Passa do limite de ~5 entregas (A a F). Sugestão para o `/up:plan`: quebrar em fase 23 (A + C + D: build rápido, onde está o ganho) e fase 24 (B + E + F: plano concreto, `/up:auto` e corte).
