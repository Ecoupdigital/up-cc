<ui_patterns>

Visual patterns for user-facing UP output. Orchestrators @-reference this file.

## Stage Banners

Use for major workflow transitions.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > {ACAO}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Action names (uppercase, Portuguese):**
- `QUESTIONANDO`
- `PESQUISANDO`
- `PLANEJANDO FASE {N}`
- `EXECUTANDO`
- `VERIFICANDO`
- `PROGRESSO`
- `PAUSANDO`
- `RETOMANDO`
- `TAREFA RAPIDA`
- `FASE {N} COMPLETA`

---

## Completion Banner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > FASE {N} COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
-> {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Verification Required` -> `-> Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` -> `-> Select: option-a / option-b`
- `CHECKPOINT: Action Required` -> `-> Type "done" when complete`

---

## Status Symbols

```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
```

---

## Progress Display

**Phase level:**
```
Progress: ████████░░ 80%
```

**Task level:**
```
Tasks: 2/4 complete
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Tables

```
| Phase | Status | Tasks | Progress |
|-------|--------|-------|----------|
| 1     | ✓      | 3/3   | 100%     |
| 2     | ◆      | 1/4   | 25%      |
| 3     | ○      | 0/2   | 0%       |
```

---

## Anti-Patterns

- Varying box/banner widths
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `UP >` prefix in banners
- Using `GSD` instead of `UP` in banners
- Random emoji usage
- Using `►` instead of `>` in banners

</ui_patterns>
