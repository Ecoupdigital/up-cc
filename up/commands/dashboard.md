---
name: up:dashboard
description: Abrir dashboard visual de monitoramento do builder em tempo real (http://localhost:4040)
argument-hint: "[porta]"
allowed-tools:
  - Bash
  - Read
---
<objective>
Iniciar o dashboard de monitoramento do UP Builder. Mostra em tempo real no browser:
- Progresso do build (% e barra visual)
- Fases (completas, atual, pendentes)
- Status atual (estagio, fase, passo)
- Metricas (commits, reports gerados)
- LOCK.md status (se builder ativo)

Servidor leve em Node.js puro (zero deps). Le `.plano/` e atualiza a cada 3 segundos.
</objective>

<context>
$ARGUMENTS

**Porta:** Default 4040. Pode especificar outra: `/up:dashboard 8080`

**Requer:** `.plano/` no diretorio atual (funciona com ou sem builder ativo).
</context>

<process>
1. Verificar que `.plano/` existe
2. Iniciar servidor em background:
```bash
node "$HOME/.claude/up/dashboard/server.js" ${PORT:-4040} "$(pwd)/.plano" &
DASH_PID=$!
echo "Dashboard rodando em http://localhost:${PORT:-4040} (PID: $DASH_PID)"
```
3. Informar ao usuario:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard: http://localhost:${PORT:-4040}
Monitorando: .plano/
Atualiza a cada 3 segundos.

Para parar: kill $DASH_PID
```
</process>
