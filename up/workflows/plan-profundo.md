<purpose>
Flags pesadas do `/up:plan`, lidas só quando passadas: `--profundo`, `--review`, `--board` e `--gaps`.
O caminho padrão (`up/workflows/plan.md`) continua valendo; este arquivo diz o que muda.
Perguntas seguem o `<contrato_de_pergunta>` de `$HOME/.claude/up/references/questioning.md`.
</purpose>

<flags>

## --profundo

Substitui o passo 3 do caminho padrão. `up-planejador` (subagente) planeja TODAS as fases do ROADMAP
(PROJETO) ou a fase pedida (FASE), com pesquisa, self-check e o loop de `validate-plan`. Use para
projeto grande ou para planejar num runtime e executar em outro. Com `--profundo`, o arquiteto gera
PHASE.md e REQUIREMENTS-SLICE.md de todas as fases.

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" roadmap analyze --raw
```

Para cada fase sem plano:

```python
Agent(subagent_type="up-planejador", prompt=f"""
  Planejar Fase {phase_number}: {phase_name}. Modo builder (sem perguntar ao dono no PROJETO).
  Plano concreto: por entrega, Onde (arquivos ou áreas, lendo o codebase) e Prova com comando.
  Sem receita (código, import, SQL, assinatura).
  <files_to_read>
  .plano/STATE.md, .plano/fases/{phase_dir}/PHASE.md, REQUIREMENTS-SLICE.md
  Brownfield: .plano/codebase/CONVENTIONS.md, ARCHITECTURE.md
  Sob demanda: SYSTEM-DESIGN.md, PROJECT.md, ROADMAP.md, REQUIREMENTS.md
  </files_to_read>
  Menor número de planos que separe o que é independente. Self-check antes de retornar:
  REQs da fase cobertos, ondas corretas, toda entrega com Onde e comando de prova.
""")
```

Depois de cada fase: `validate-plan` em cada PLAN.md; `pass=false` ou aviso de plano concreto:
devolva ao planejador uma vez com as `suggestions`. Decisões escaladas dos planejadores entram no
passo 4 do caminho padrão. No fim, `up-tools plan close --profundo`.

## --review

Depois do plano e antes do `plan close`, spawne o revisor de planejamento:

```python
Agent(subagent_type="up-revisor", prompt="""
  Revisar o planejamento (escopo: planning). Stage 1: os planos cobrem 100% dos requisitos da fase?
  Planning Confidence Score (0-100). Stage 2: dependências e ondas corretas, toda entrega com Onde e
  comando de prova, sem receita, sem contradição com SYSTEM-DESIGN.
  Ler: .plano/PROJECT.md, ROADMAP.md, REQUIREMENTS.md, SYSTEM-DESIGN.md, .plano/fases/*/*-PLAN.md,
  $HOME/.claude/up/templates/audit-plan.md
  Gerar .plano/AUDIT-PLAN.md com score e veredito APPROVE | REQUEST_CHANGES | BLOCK.
""")
```

- `APPROVE`: segue para o `plan close`.
- `REQUEST_CHANGES`: corrija os planos com o review como contexto, uma rodada, e siga.
- `BLOCK`:

<pergunta id="plan.revisor-bloqueou">
Pergunta: A revisão do planejamento bloqueou. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão}, e é correção dirigida a um item do planejamento, não replanejamento inteiro.
Opções: Corrigir e re-revisar | Aceitar como dívida e seguir para o plano pronto | Parar o planejamento
</pergunta>

## --board

Só no PROJETO, depois do ROADMAP: espelha as fases no Multica (uma issue-filha por fase, batched,
idempotente, fail-open).

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" multica init --from-roadmap --raw 2>/dev/null \
  || echo "AVISO: Multica indisponível. Seguindo sem board."
```

## --gaps

Fechamento de gaps de uma fase já executada: leia o `VERIFICATION.md` da fase, pule a pesquisa e
escreva um plano novo (`{NN}-0M-PLAN.md`) só com o que ficou faltando, no formato concreto.

</flags>
