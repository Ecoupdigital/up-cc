---
name: up:custos
description: Mostra estimativa de custo em tokens dos agentes UP usados no projeto atual (Claude Code only)
allowed-tools:
  - Bash
  - Read
---

<objective>
Reportar custo estimado de tokens consumidos por agentes UP no projeto atual.
Usa `bin/up-instrument.cjs` para parsear `~/.claude/projects/<key>/subagents/*.jsonl`
e agregar uso por agente.
</objective>

<process>

## 1. Detectar runtime

```bash
if [ ! -d "$HOME/.claude/projects" ]; then
  echo "Instrumentation requer Claude Code runtime."
  echo "OpenCode e Gemini CLI usam formatos de log diferentes (nao suportado ainda)."
  exit 0
fi
```

## 2. Rodar relatorio

```bash
# Default: sessao mais recente
node "$HOME/.claude/up/bin/up-instrument.cjs" report

# Se quiser todas as sessoes do projeto:
# node "$HOME/.claude/up/bin/up-instrument.cjs" report --all-sessions

# Se quiser JSON:
# node "$HOME/.claude/up/bin/up-instrument.cjs" report --json
```

## 3. Salvar em .plano/INSTRUMENTATION.md (opcional)

Se a flag `--save` foi passada OU se .plano/ existe:

```bash
if [ -d ".plano" ]; then
  node "$HOME/.claude/up/bin/up-instrument.cjs" write
  echo ""
  echo "Relatorio salvo em .plano/INSTRUMENTATION.md"
fi
```

## 4. Apresentar interpretacao

Apos mostrar a tabela, comentar:

- **Top 3 agentes mais caros** — onde focar otimizacao
- **Total estimado** — em USD assumindo Opus 4.6 pricing
- **Comparacao com outras sessoes** se historico disponivel

</process>

<notes>
- Pricing assume Opus 4.6 1M context: input $15/M, output $75/M, cache write $18.75/M, cache read $1.50/M
- Custos reais podem variar conforme modelo selecionado no /model
- Apenas funciona em Claude Code — OpenCode e Gemini CLI nao expoe usage por subagent ainda
- Detecta agentes UP cruzando contra a lista canonica em `agents/up-*.md`
</notes>
