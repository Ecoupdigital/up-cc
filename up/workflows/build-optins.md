<purpose>
Opt-ins do `/up:build`, carregados so com `--review` ou `--testar`. Rodam depois das ondas da fase e
antes do teste visual e do `build close`. Sem flag, este arquivo nao entra. Pergunta segue
`$HOME/.claude/up/references/questioning.md`: recomendacao e motivo, recomendada primeiro.
</purpose>

<process>
## Por fase

**`--review`:** spawnar `up-verificador` (fase inteira, VERIFICATION.md) e depois `up-revisor` (two-stage,
REVIEW.md). Veredito `NEEDS_REWORK`: re-spawnar o executor do plano apontado com o REVIEW.md como
contexto, uma rodada, e re-revisar. `BLOCKED`:

<pergunta id="build.revisor-bloqueou">
Pergunta: A revisão bloqueou a fase {phase_number}. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo do REVIEW.md}, e é correção dirigida a um item, não retrabalho da fase.
Opções: Corrigir e re-revisar | Aceitar como dívida técnica e seguir | Parar aqui
</pergunta>

```python
Agent(subagent_type="up-verificador", prompt=f"""
  Verificar a Fase {phase_number} inteira: objetivo da fase contra o codebase real, REQUIREMENTS da fase
  contra o que os SUMMARYs ({PHASE_DIR}/*-SUMMARY.md) entregaram. Gerar um VERIFICATION.md da fase.
""")
Agent(subagent_type="up-revisor", prompt=f"""
  Revisar a Fase {phase_number} consolidada (two-stage). Stage 1: spec-compliance cetico, navegando o
  resultado real. Stage 2: qualidade e OWASP. Ler {PHASE_DIR}/*-PLAN.md, *-SUMMARY.md, *-VERIFICATION.md
  e o git diff. Escrever REVIEW.md com o veredito.
""")
```

**`--testar`:** delegar ao laco DCRV (`@~/.claude/up/workflows/dcrv.md`) com
`SCOPE=phase, PHASE_DIR={PHASE_DIR}, PHASE_NUMBER={phase_number}, AUTO_FIX=true, MAX_CYCLES=3`.
Pular se a fase nao tem UI nem API.

## Depois de todas as fases

**`--testar`:** DCRV em escopo global depois de todas as fases (`SCOPE=global, AUTO_FIX=true, MAX_CYCLES=5`).

**`--review`:** `up-revisor` em escopo global (Confidence Score do projeto inteiro em `.plano/REVIEW-DELIVERY.md`).


</process>
