---
name: up:resetar
description: Resetar projeto UP (limpar .plano/ parcial ou totalmente)
argument-hint: [--total | --parcial]
allowed-tools:
  - Read
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Resetar o diretorio `.plano/` para comecar novamente. Oferece reset total (apaga tudo) ou parcial (mantém PROJECT.md e config.json).

**Default flow:** Diagnosticar -> Mostrar o que sera apagado -> Confirmar -> Executar -> Sugerir proximo passo
</objective>

<execution_context>
@$HOME/.claude/up/workflows/resetar.md
@$HOME/.claude/up/references/ui-brand.md
</execution_context>

<process>
Execute o workflow resetar de @$HOME/.claude/up/workflows/resetar.md end-to-end.
Preserve todos os gates (diagnostico, confirmacao, execucao).
NUNCA apague sem confirmacao explicita do usuario.
</process>
