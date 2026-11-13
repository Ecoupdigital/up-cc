<purpose>
Workflow `/up:auto`: ideia -> brainstorm mínimo -> plan -> build `--solo`, fase a fase, sem o dono
precisar conduzir. É o mesmo plan e o mesmo build de sempre, encadeados. Quem quer conduzir usa
`/up:plan` e `/up:build` separados.
</purpose>

<principios>
- **Pergunta só o que bloqueia.** Brainstorm no tier mínimo: o que dá para inferir (artefatos, código,
  perfil do dono) vira anúncio de uma linha; só o que muda o resultado e não tem como inferir vira
  pergunta, uma por vez, com recomendação (contrato em `$HOME/.claude/up/references/questioning.md`).
  Depois do brainstorm, zero interação até o fim ou até uma parada.
- **Decisão escalada:** aplique a recomendação e registre no BRIEFING. Só pare se ela mudar o escopo
  pedido (cortar ou trocar entrega, mudar stack, apagar dado).
- **Paradas:** `build close` com `stage: verify` depois de uma tentativa de corrigir; decisão que muda
  escopo; credencial ou login que só o dono resolve; erro que se repete três vezes. Ao parar, diga o
  que falta e o comando para retomar (`/up:auto`).
</principios>

<process>

## 1. Entrada

- `.plano/PLAN-READY.md` com plano pendente (sem SUMMARY) e sem argumento: pule para o passo 4.
- Número de fase: pule para o passo 3 com essa fase.
- Descrição:
  - Sem `.plano/`: projeto novo. Passo 2, depois PROJETO no passo 3.
  - Com `.plano/`: fase nova. Passo 2, acrescente a fase ao ROADMAP (objetivo, critérios de sucesso,
    contrato apontando para o briefing) e siga como FASE no passo 3.
- Vazio sem PLAN-READY pendente: próxima fase `- [ ]` do ROADMAP no passo 3. Nenhuma: diga que o
  roadmap está concluído e pare.

## 2. Brainstorm mínimo

Use a skill `up-brainstorm` no tier mínimo (como `--quick`): resolva por inferência, pergunte só o
bloqueante e aprove o design com o dono numa pergunta só. Grave `.plano/BRIEFING.md` (projeto) ou
`.plano/BRIEFING-{slug}.md` (fase nova). Esta é a última interação planejada.

## 3. Plan

Leia `$HOME/.claude/up/workflows/plan.md` e siga, sem perguntar: o intake vem do briefing do passo 2,
decisões escaladas seguem a regra dos princípios. Com `--board`, leia também
`$HOME/.claude/up/workflows/plan-profundo.md` na parte do board. Termina em `up-tools plan close`.

## 4. Build

Leia `$HOME/.claude/up/workflows/build.md` e siga com `--solo` (ou `--local` se passado; `--board`
repassado): `build open`, ondas, `build close --land merge` (ou `local`). Sem menu e sem teste visual.

`build close` devolveu `ok:false`:
- `stage: summary`: complete o SUMMARY ou a seção `## Prova` que faltou e feche de novo.
- `stage: verify`: corrija o que o `verify-static` apontou, uma vez, e feche de novo. Falhou outra
  vez: pare (a branch fica aberta para o dono ver).

## 5. Próxima fase

Com `--uma`: pare. Senão, se o ROADMAP tem outra fase `- [ ]` (fora as marcadas como pendentes de
decisão do dono), volte ao passo 3 com ela. Sem mais fases: pare.

## 6. Relato

Poucas linhas: fases entregues (PR ou commit de cada), provas, o que ficou de fora e por quê, e o
próximo passo se parou no meio.

</process>

<success_criteria>
- [ ] Perguntas só no brainstorm mínimo, cada uma com recomendação
- [ ] Cada fase: plan concreto, `plan close`, build `--solo`, `build close` ok
- [ ] Parou nos casos previstos, com o comando de retomada
</success_criteria>
