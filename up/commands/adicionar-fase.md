---
name: up:adicionar-fase
description: "[DEPRECADO] Use /up:planejar-fase \"descricao\" — adiciona e ja planeja"
argument-hint: "<descricao>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---
<objective>
**DEPRECADO desde v0.9.0.** Este comando foi absorvido pelo `/up:planejar-fase`.

Use: `/up:planejar-fase "descricao da fase"` — ele adiciona ao roadmap E ja planeja.

Se voce so quer adicionar ao roadmap SEM planejar, use diretamente:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" phase add "descricao"
```
</objective>

<process>
1. Informar ao usuario que este comando foi absorvido:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > COMANDO DEPRECADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/up:adicionar-fase foi absorvido pelo /up:planejar-fase.

Agora voce pode fazer tudo de uma vez:

  /up:planejar-fase "descricao da fase"

Isso adiciona a fase ao roadmap E ja gera os planos.

Redirecionando...
```

2. Redirecionar para planejar-fase com os mesmos argumentos:

```
Skill(skill="up:planejar-fase", args="$ARGUMENTS")
```
</process>
