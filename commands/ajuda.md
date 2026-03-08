---
name: up:ajuda
description: Referencia de comandos UP
argument-hint: ""
allowed-tools: []
---
<objective>
Exibir a referencia completa de comandos UP.
</objective>

<context>
Referencia inline -- nenhum arquivo externo necessario.
</context>

<process>
Exiba a referencia abaixo EXATAMENTE como esta, formatada em markdown:

---

# UP -- Referencia de Comandos

Sistema de desenvolvimento orientado a fases para projetos de software.

## Comandos Disponiveis

### Inicializacao

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:novo-projeto` | Inicializar novo projeto com coleta de contexto | `/up:novo-projeto` |
| `/up:retomar` | Restaurar contexto da sessao anterior | `/up:retomar` |

### Ciclo de Fase

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:discutir-fase` | Coletar contexto por questionamento | `/up:discutir-fase 1` |
| `/up:planejar-fase` | Planejar fase com research e self-check | `/up:planejar-fase 1` |
| `/up:executar-fase` | Executar planos com paralelizacao por ondas | `/up:executar-fase 1` |
| `/up:verificar-trabalho` | Validar features via UAT conversacional | `/up:verificar-trabalho 1` |

### Gerenciamento

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:progresso` | Status do projeto e proxima acao | `/up:progresso` |
| `/up:pausar` | Criar handoff .continue-aqui.md | `/up:pausar` |
| `/up:adicionar-fase` | Adicionar fase ao roadmap | `/up:adicionar-fase "Deploy em producao"` |
| `/up:remover-fase` | Remover fase futura e renumerar | `/up:remover-fase 5` |

### Utilitarios

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:rapido` | Tarefa rapida com garantias UP | `/up:rapido "Corrigir bug no login"` |
| `/up:ajuda` | Esta referencia | `/up:ajuda` |

## Flags Comuns

### planejar-fase
- `--pesquisar` -- Forcar re-pesquisa mesmo se RESEARCH.md existir
- `--sem-pesquisa` -- Pular pesquisa, ir direto ao planejamento
- `--auto` -- Auto-detectar proxima fase nao planejada
- `--gaps` -- Modo fechamento de gaps (le VERIFICATION.md)

### executar-fase
- `--gaps-only` -- Executar apenas planos de fechamento de gaps

## Estrutura do Diretorio .plano/

```
.plano/
  STATE.md              # Estado atual do projeto
  ROADMAP.md            # Roadmap com todas as fases
  fase-01-nome/
    CONTEXT.md          # Contexto coletado na discussao
    RESEARCH.md         # Pesquisa de dominio/tecnologia
    PLAN-001.md         # Plano executavel
    PLAN-002.md         # Outro plano da fase
    VERIFICATION.md     # Resultado da verificacao
  fase-02-nome/
    ...
  rapido/
    TASK-001.md         # Tarefa rapida executada
    ...
```

## Fluxos de Trabalho Comuns

### Novo Projeto (do zero)
```
/up:novo-projeto
/up:discutir-fase 1
/up:planejar-fase 1
/up:executar-fase 1
/up:verificar-trabalho 1
```

### Continuar Projeto Existente
```
/up:retomar
/up:progresso
```

### Correcao Rapida
```
/up:rapido "Descricao da tarefa"
```

### Pausar e Retomar
```
/up:pausar          # Ao pausar
/up:retomar         # Na proxima sessao
```

### Adicionar/Remover Fases
```
/up:adicionar-fase "Descricao da nova fase"
/up:remover-fase 5
```

### Ciclo de Fechamento de Gaps
```
/up:verificar-trabalho 1     # Identifica gaps
/up:planejar-fase 1 --gaps   # Planeja correcoes
/up:executar-fase 1 --gaps-only  # Executa correcoes
/up:verificar-trabalho 1     # Re-verifica
```

---
</process>