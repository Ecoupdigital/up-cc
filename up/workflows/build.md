<purpose>
Workflow `/up:build`: executa o que `/up:plan` deixou pronto em `.plano/PLAN-READY.md`.

A cerimonia (modo, lock, worktree, branch, issue, ondas, prova estatica, STATE, ROADMAP, merge) e
codigo: `up-tools build open` e `build close`. O modelo so executa os planos. Por isso o build roda
bem num modelo menor (`build_model` no config).
</purpose>

<core_principle>
Pipeline por fase (caminho quente):

```
build open  -> ondas (1 plano: sessao | 2+: up-executor em paralelo) -> teste visual (se UI) -> build close
```

`build close` confere SUMMARY com `## Prova` em todo plano, roda `verify-static` (falhou = sem merge),
marca STATE e ROADMAP e aterrissa. `--review` e `--testar` sao opt-in (secao 3.7); sem a flag, nao entram.

| Flag | GitHub | Menu | Teste visual | Aterrissa |
|------|:---:|:---:|:---:|---|
| (nenhuma) | sim | sim | sim | conforme o menu |
| `--auto` | sim | nao | sim (salvo `require_visual_test=false`) | merge |
| `--solo` | sim | nao | nao | merge |
| `--local` | nao | nao | nao | commit na branch atual |

`--board` espelha no Multica. Autonomo (`--solo`/`--auto`): zero pergunta, salvo decisao escalada que mude
escopo. Pergunta, quando houver, segue `$HOME/.claude/up/references/questioning.md` (carregar so ao perguntar):
recomendacao e motivo, recomendada primeiro. Fato que da para ler (flags, config, arquivos) nao vira pergunta.
</core_principle>

<process>

## 0. Pre-requisitos

`.plano/PLAN-READY.md` ausente: parar com "Projeto nao planejado. Use /up:plan." Sem `--solo`/`--auto`,
anunciar fases e planos em uma linha e perguntar se inicia:

<pergunta id="build.iniciar-execucao">
Pergunta: Inicio a execução agora?
Recomendo: Iniciar
Porque: o plano está pronto e o modo resolvido é {modo}.
Opções: Iniciar | Mudar o modo antes | Não iniciar agora
</pergunta>

## 3. Loop por fase

Para cada fase do PLAN-READY.md, em ordem.

### 3.0 Abrir

```bash
OPEN=$(node "$HOME/.claude/up/bin/up-tools.cjs" build open --phase {N} {--local se a flag veio} {--solo se a flag veio})
```

JSON com `root` (onde trabalhar: a worktree, ou o repo em `--local`), `branch`, `issue`, `transport`,
`waves[]` (cada plano com `plan` e `done`), `build_model`, `require_visual_test` e `resumed`. Trabalhe
dentro de `root` (**EnterWorktree** se houver a tool). `transport=mcp` com `pending_issue`: criar a issue
via MCP e gravar com `github record-issue --phase {N} --issue <num>`; sem MCP, seguir sem issue.

### 3.2 Executar as ondas

Ondas em ordem crescente; pular plano com `done: true`. Planos da mesma onda tocam areas disjuntas.

- **Onda de 1 plano e `build_model` = `inherit` (ou o modelo desta sessao):** execucao inline.
- **Senao:** um `up-executor` por plano, todos numa mensagem (paralelo), com `model` = `build_model`
  quando nao for `inherit`.

<execucao_inline>
Voce (a sessao) e o executor, sem spawnar subagente e sem reler `up-executor.md`. Leia o PLAN.md e siga:
cada entrega implementada de verdade, so nas areas que o plano aponta; prova da entrega rodada e lida;
commit atomico por entrega (`git add` por arquivo, `{tipo}({fase}-{plano}): ...`). No fim, o SUMMARY
`{id}-SUMMARY.md` ao lado do plano no formato de `$HOME/.claude/up/templates/summary.md`: uma linha,
`## Prova` (entrega, tipo, comando, resultado), `## Desvios` e `## DECISOES ESCALADAS` so se houver.
Commite o SUMMARY.
</execucao_inline>

```python
Agent(
  subagent_type="up-executor",
  model=build_model,  # omitir quando inherit
  prompt=f"""
    Executar {plan} (Fase {N}, onda {wave}) dentro de {root}. Escopo: so este plano; outros planos
    da onda rodam em paralelo em areas disjuntas. Escreva {id}-SUMMARY.md com ## Prova.
  """
)
```

Plano sem SUMMARY ao fim da onda: re-executar so ele, uma vez. Onda inteira falhou: em autonomo, re-executar
a onda uma vez e parar se falhar de novo; interativo:

<pergunta id="build.onda-falhou">
Pergunta: A onda {wave} falhou inteira. Como sigo?
Recomendo: Re-executar a onda uma vez
Porque: {o que foi encontrado}; todos falhando juntos aponta para ambiente ou interrupção, não para plano errado.
Opções: Re-executar a onda | Re-planejar a fase | Parar aqui
</pergunta>

**Re-plan local** (plano inviavel, max 2 por projeto em `.plano/governance/replans.log`): `up-planejador`
refaz so aquele plano; o antigo vira `*-PLAN-v1.md`.

### 3.5 Decisoes escaladas

Junte os blocos `## DECISOES ESCALADAS` dos SUMMARYs. Nenhum: siga. Autonomo: mantenha a recomendacao
aplicada e registre (`state add-decision`); so pare se mudar escopo. Interativo, uma por vez:

<pergunta id="build.decisoes-escaladas">
Pergunta: {decisão}. Confirma a recomendação (já aplicada) ou corrige?
Recomendo: {Recomendo do bloco}
Porque: {Porque do bloco}
Opções: {Recomendo} | {alternativas} | outro (descreva)
</pergunta>

### 3.7 Opt-ins

So com `--review` ou `--testar`: carregar `$HOME/.claude/up/workflows/build-optins.md` e seguir. Sem flag,
pular.

### 3.8 Teste visual e fechamento

**Teste visual** quando a fase toca UI (plano `frontend`/`misto` ou script `dev`), nao `--solo`, e
`require_visual_test` true (ou interativo): subir `npm run dev` em `root`, dar a URL e perguntar:

<pergunta id="build.testar-antes-do-merge">
Pergunta: O servidor está em http://localhost:{PORT} com esta fase. Testa antes ou já aterrisso?
Recomendo: Testar primeiro
Porque: a fase mexeu em interface e a prova automática não julga a tela.
Opções: Testar primeiro | Pode mergear | Deixa a branch | Descarta a fase
</pergunta>

Depois que o dono testar:

<pergunta id="build.aprovou-ou-ajusta">
Pergunta: Testou. Posso fechar a fase {N}?
Recomendo: Aprovado, pode mergear
Porque: a prova automática passou; o julgamento da tela é seu.
Opções: Aprovado, pode mergear | Achei problema, quero ajustar
</pergunta>

Problema achado: corrigir em `root` (inline ou `up-executor`), re-provar e perguntar de novo. Matar o dev
server antes de fechar.

**Menu** (interativo, sem teste visual):

<pergunta id="build.fechamento-fase">
Pergunta: Como aterrisso a fase {N}?
Recomendo: Mergear
Porque: {transporte}: com remote abre PR e faz merge squash; sem remote, merge local.
Opções: Mergear | Deixa a branch | Descarta a fase
</pergunta>

Sair da worktree e fechar (`--land`: `merge` em autonomo; `merge|keep|discard` conforme a escolha;
`local` em `--local`):

```bash
CLOSE=$(node "$HOME/.claude/up/bin/up-tools.cjs" build close --phase {N} --land {land} {--board})
```

- `ok: false, stage: summary`: plano sem SUMMARY ou sem `## Prova`. Completar e rodar `close` de novo.
- `ok: false, stage: verify`: `verify-static` falhou (`failed[]`, logs em `.plano/runtime/`). Corrigir
  em `root`, uma rodada, e rodar `close` de novo. Falhou de novo: parar (autonomo) ou perguntar:

<pergunta id="build.estatica-falhou">
Pergunta: A prova estática ainda falha depois da correção ({resumo}). Como sigo?
Recomendo: Corrigir comigo agora
Porque: {o check que falha} bloqueia o merge e outra rodada automática tende a repetir o erro.
Opções: Corrigir comigo agora | Deixa a branch | Parar aqui
</pergunta>
- `action: needs-mcp-pr`: push feito. Via MCP criar o PR com `pr_payload`, mergear squash e gravar
  `github record-pr --phase {N} --pr <num> --merged`. Sem MCP: avisar o dono.

## 5. Entrega

Todas as fases fechadas: `mv .plano/PLAN-READY.md .plano/PROJECT-COMPLETE.md` e uma mensagem curta: o que
entrou por fase, PR de cada uma, avisos de `warnings`.

</process>

<success_criteria>
- [ ] Toda fase aberta com `build open` e fechada com `build close`
- [ ] Onda de 1 plano inline (salvo `build_model` diferente); 2+ planos em paralelo
- [ ] Todo plano com SUMMARY e `## Prova`; `verify-static` passou antes do merge
- [ ] Teste visual em fase de UI (fora `--solo`); menu so no modo interativo
</success_criteria>
