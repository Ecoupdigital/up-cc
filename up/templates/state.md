# State Template

Template for `.plano/STATE.md` -- the project's living memory.

---

## File Template

```markdown
# Estado do Projeto

## Referencia do Projeto

Ver: .plano/PROJECT.md (atualizado [data])

**Valor central:** [One-liner from PROJECT.md Core Value section]
**Foco atual:** [Current phase name]

## Posicao Atual

Fase: [X] de [Y] ([Phase name])
Plano: [A] de [B] na fase atual
Status: [Ready to plan / Planning / Ready to execute / In progress / Phase complete]
Ultima atividade: [YYYY-MM-DD] -- [What happened]

Progresso: [----------] 0%

## Contexto Acumulado

### Decisoes

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase X]: [Decision summary]
- [Phase Y]: [Decision summary]

### Bloqueios

[Issues that affect future work]

None yet.

## Continuidade de Sessao

Ultima sessao: [YYYY-MM-DD HH:MM]
Parou em: [Description of last completed action]
Arquivo de retomada: [Path to .continue-aqui.md if exists, otherwise "None"]
```

<purpose>

STATE.md is the project's short-term memory spanning all phases and sessions.

**Problem it solves:** Information is captured in summaries, issues, and decisions but not systematically consumed. Sessions start without context.

**Solution:** A single, small file that's:
- Read first in every workflow
- Updated after every significant action
- Contains digest of accumulated context
- Enables instant session restoration

</purpose>

<lifecycle>

**Creation:** After ROADMAP.md is created (during init)
- Reference PROJECT.md (read it for current context)
- Initialize empty accumulated context sections
- Set position to "Phase 1 ready to plan"

**Reading:** First step of every workflow
- progress: Present status to user
- plan: Inform planning decisions
- execute: Know current position
- transition: Know what's complete

**Writing:** After every significant action
- execute: After SUMMARY.md created
  - Update position (phase, plan, status)
  - Note new decisions (detail in PROJECT.md)
  - Add blockers/concerns
- transition: After phase marked complete
  - Update progress bar
  - Clear resolved blockers
  - Refresh Project Reference date

</lifecycle>

<sections>

### Referencia do Projeto
Points to PROJECT.md for full context. Includes:
- Core value (the ONE thing that matters)
- Current focus (which phase)
- Last update date (triggers re-read if stale)

### Posicao Atual
Where we are right now:
- Phase X of Y -- which phase
- Plan A of B -- which plan within phase
- Status -- current state
- Last activity -- what happened most recently
- Progress bar -- visual indicator of overall completion

Progress calculation: (completed plans) / (total plans across all phases) x 100%

### Contexto Acumulado
**Decisions:** Reference to PROJECT.md Key Decisions table, plus recent decisions summary for quick access.
**Blockers:** Issues that affect future work, prefixed with originating phase, cleared when addressed.

### Continuidade de Sessao
Enables instant resumption:
- When was last session
- What was last completed
- Is there a .continue-aqui.md file to resume from

</sections>

<size_constraint>

Keep STATE.md under 60 lines.

It's a DIGEST, not an archive. If accumulated context grows too large:
- Keep only 3-5 recent decisions in summary (full log in PROJECT.md)
- Keep only active blockers, remove resolved ones

The goal is "read once, know where we are" -- if it's too long, that fails.

</size_constraint>
