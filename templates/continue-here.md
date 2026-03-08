# Continue-Here Template

Copy and fill this structure for `.plano/fases/XX-name/.continue-aqui.md`:

```yaml
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: 2025-01-15T14:30:00Z
---
```

```markdown
<estado_atual>
[Where exactly are we? What's the immediate context?]
</estado_atual>

<trabalho_concluido>
[What got done this session - be specific]

- Task 1: [name] - Done
- Task 2: [name] - Done
- Task 3: [name] - In progress, [what's done on it]
</trabalho_concluido>

<trabalho_restante>
[What's left in this phase]

- Task 3: [name] - [what's left to do]
- Task 4: [name] - Not started
- Task 5: [name] - Not started
</trabalho_restante>

<decisoes_tomadas>
[Key decisions and why - so next session doesn't re-debate]

- Decided to use [X] because [reason]
- Chose [approach] over [alternative] because [reason]
</decisoes_tomadas>

<bloqueios>
[Anything stuck or waiting on external factors]

- [Blocker 1]: [status/workaround]
</bloqueios>

<contexto>
[Mental state, "vibe", anything that helps resume smoothly]

[What were you thinking about? What was the plan?
This is the "pick up exactly where you left off" context.]
</contexto>

<proxima_acao>
[The very first thing to do when resuming]

Start with: [specific action]
</proxima_acao>
```

<yaml_fields>
Required YAML frontmatter:

- `phase`: Directory name (e.g., `02-authentication`)
- `task`: Current task number
- `total_tasks`: How many tasks in phase
- `status`: `in_progress`, `blocked`, `almost_done`
- `last_updated`: ISO timestamp
</yaml_fields>

<guidelines>
- Be specific enough that a fresh Claude instance understands immediately
- Include WHY decisions were made, not just what
- The `<proxima_acao>` should be actionable without reading anything else
- This file gets DELETED after resume - it's not permanent storage
</guidelines>
