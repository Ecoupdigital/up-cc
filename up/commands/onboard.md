---
name: up:onboard
description: Entrevista inicial pro CEO te conhecer e criar seu perfil (~/.claude/up/owner-profile.md)
argument-hint: "[--update]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Onboarding do UP: entrevista conduzida pelo CEO que cria seu perfil pessoal.

O perfil e lido por todos os agentes UP antes de cada projeto pra adaptar:
- Tom de comunicacao
- Stack padrao
- Estilo de decisao
- Nome do seu CEO
- Restricoes permanentes

Rodado automaticamente no primeiro uso de qualquer comando UP.
Rodado manualmente via `/up:onboard` ou `/up:onboard --update` pra refazer.
</objective>

<execution_context>
@~/.claude/up/workflows/onboarding.md
@~/.claude/up/templates/owner-profile.md
</execution_context>

<context>
$ARGUMENTS

**Flags:**
- `--update` — Refaz o onboarding, sobrescreve perfil existente

Sem argumentos: roda se nao existe, pula se ja existe.
</context>

<process>
Execute the onboarding workflow from @~/.claude/up/workflows/onboarding.md end-to-end.

**Passo 0 obrigatorio:**
Verificar se `~/.claude/up/owner-profile.md` ja existe.

```bash
if [ -f ~/.claude/up/owner-profile.md ]; then
  if [[ "$ARGUMENTS" == *"--update"* ]]; then
    echo "Atualizando perfil existente..."
    # Prosseguir
  else
    echo "Perfil ja existe. Use /up:onboard --update pra refazer."
    cat ~/.claude/up/owner-profile.md | head -20
    exit 0
  fi
fi
```

Seguir workflow completo:
1. Apresentacao
2. Bloco 1: Identidade (nome, papel, localizacao, idioma)
3. Bloco 2: Nome do CEO (como voce me chama) + tom
4. Bloco 3: Contexto profissional
5. Bloco 4: Stack preferida
6. Bloco 5: Estilo de trabalho
7. Bloco 6: Restricoes permanentes
8. Bloco 7: Integracoes disponiveis
9. Gerar owner-profile.md
10. Confirmar resumo
</process>
