<purpose>
Workflow `/up:plan`: planeja o projeto OU uma fase e para. Caminho padrão: (arquiteto, se projeto) ->
a própria sessão escreve o PLAN.md concreto da próxima fase -> `up-tools plan close` gera e commita o
PLAN-READY. Não executa nada.
</purpose>

> Vocabulário UP: fase, plano, onda, evidência, worktree e escape hatch têm definição única em `$HOME/.claude/up/references/glossario-up.md`.

<principios>
- **Plano concreto.** Quem planeja (modelo forte) lê o código e escreve, por entrega, `Onde:` (arquivos
  ou áreas) e `Prova:` (comando exato). Quem executa (às vezes modelo menor) segue. Sem receita: nada
  de código, import, SQL ou assinatura no plano.
- **Um plano por fase, até ~5 entregas pedidas.** Mais que isso vira outra fase no ROADMAP.
- **Contrato de pergunta:** antes da primeira pergunta, leia `$HOME/.claude/up/references/questioning.md`
  e aplique o `<contrato_de_pergunta>`. Nunca pergunte o que dá para descobrir: modo projeto ou fase
  (argumento), greenfield ou brownfield (arquivos), stack (manifesto ou mapa), fases e requisitos já
  registrados (artefatos). Fato descoberto vira anúncio de uma linha.
- **Flags pesadas ficam fora.** `--profundo`, `--review` ou `--board`: leia
  `$HOME/.claude/up/workflows/plan-profundo.md` e siga o que ele diz para a flag. Sem flag, não leia.
</principios>

<process>

## 0. Entrada

1. Sem `$HOME/.claude/up/owner-profile.md`: leia e rode `$HOME/.claude/up/workflows/onboarding.md` antes.
2. Modo: argumento numérico = **FASE** (só ela). `.plano/` existe e sem argumento = **FASE** (próxima
   `- [ ]` do ROADMAP sem `*-PLAN.md`). Descrição sem `.plano/` = **PROJETO**. Descrição que não casa
   com fase existente: ofereça criar a fase no ROADMAP e siga como FASE.

## 1. Intake

Entrada = `.plano/BRIEFING.md` (do brainstorm do `/up`) ou o contrato que o ROADMAP aponta para a fase.
Sem briefing nem contrato: resolva o que der pelos artefatos e pergunte só o que sobrar, uma por vez:

<pergunta id="plan.intake-minimo">
Pergunta: {o único dado que falta para planejar}
Recomendo: {o valor inferido dos artefatos existentes, ou o padrão do perfil do dono}
Porque: {o arquivo, a decisão registrada ou o padrão que sustenta o valor}
Opções: {recomendado} | outro (descreva)
</pergunta>

## 2. Arquitetura (só PROJETO)

```bash
mkdir -p .plano/fases && git init -q 2>/dev/null
```

Brownfield sem `.plano/codebase/`: rode `$HOME/.claude/up/workflows/mapear-codigo.md` antes.

```python
Agent(subagent_type="up-arquiteto", prompt="""
  Projetar a arquitetura a partir de .plano/BRIEFING.md (e .plano/codebase/ se brownfield,
  ~/.claude/up/owner-profile.md para a stack). Pesquisa (um passe de WebSearch se greenfield),
  roteiro e auto-checagem de requisitos são seus.
  Produzir: SYSTEM-DESIGN.md, PROJECT.md, REQUIREMENTS.md (REQ-IDs) e ROADMAP.md com todas as fases,
  cada uma com até ~5 entregas pedidas e critérios de sucesso. PHASE.md e REQUIREMENTS-SLICE.md só
  da primeira fase. Decisão de arquitetura incerta: aplique a recomendação e devolva no bloco
  ## DECISOES ESCALADAS.
""")
```

Confira que os quatro artefatos existem; faltou, devolva ao arquiteto na mesma rodada.

## 3. Plano da fase (na sessão, sem `up-planejador`)

1. Leia o que a fase pede (ROADMAP, PHASE.md/REQUIREMENTS-SLICE.md ou o contrato apontado).
2. **Leia o código que a fase vai tocar** (Grep/Glob/Read) até saber, por entrega, os arquivos ou
   pastas e o comando de teste do projeto. É aqui que o plano fica concreto.
3. Escreva `.plano/fases/{NN}-{slug}/{NN}-01-PLAN.md` com `$HOME/.claude/up/templates/plan.md`:
   objetivo, fora de escopo, entregas `### N.` com `Onde:`, `Implícitos:` (só o que do padrão de
   Product Engineer muda aquela entrega) e `Prova:` com comando, e critério de pronto.
   Segundo plano (`-02`) só se houver áreas disjuntas de verdade (vira onda paralela).
4. Confira:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" validate-plan .plano/fases/{NN}-{slug}/{NN}-01-PLAN.md
```

`validate-plan` só avisa. Corrija o que `suggestions` apontar (entrega sem `Onde:`, prova sem
comando, plano grande demais).

5. Atualize a linha da fase no ROADMAP (`**Planos**: 1 plano ({NN}-01), onda 1`) e o foco do STATE.

## 4. Decisões escaladas

Junte os blocos `## DECISOES ESCALADAS` dos retornos (arquiteto). Nenhum: diga em uma linha e siga.
Senão, do mais caro de reverter ao mais barato, uma por vez:

<pergunta id="plan.decisoes-escaladas">
Pergunta: {Decisao do bloco escalado}. Confirma a recomendação ou corrige?
Recomendo: {Recomendo do bloco escalado}
Porque: {Porque do bloco escalado}
Opções: {Recomendo} | {cada item de Alternativas} | outro (descreva)
</pergunta>

Registre cada resposta em `.plano/BRIEFING.md` (`## Decisões confirmadas no planejamento`). Diverge da
recomendação: refaça só o trabalho que dependia dela.

## 5. Fechar

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" plan close [--execution-runtime R]
```

Gera `.plano/PLAN-READY.md` a partir dos PLAN.md pendentes, confere que existem e commita (com
ROADMAP e STATE). `ok:false` com `no_pending_plans`: nenhum plano novo foi escrito, volte ao passo 3.
Não escreva o PLAN-READY à mão.

Apresente em poucas linhas: fase, plano, entregas, avisos que sobraram e o próximo passo
(`/up:build`, neste runtime ou em outro; `/up:auto` faz plan e build juntos).

</process>

<success_criteria>
- [ ] Modo projeto/fase resolvido sem perguntar
- [ ] PROJETO: `up-arquiteto` gerou os quatro artefatos, fases com até ~5 entregas
- [ ] PLAN.md escrito na sessão, com `Onde:` e comando de `Prova:` em toda entrega, sem receita
- [ ] `validate-plan` rodado e avisos tratados
- [ ] PLAN-READY gerado e commitado por `up-tools plan close`
- [ ] Nada executado
</success_criteria>
