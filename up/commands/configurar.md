---
name: up:configurar
description: Configurar opcoes do workflow UP para o projeto atual
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Configuracao interativa das opcoes do workflow UP. Atualiza .plano/config.json com preferencias do usuario.
</objective>

<process>

## 1. Carregar Configuracao Atual

```bash
cat .plano/config.json 2>/dev/null || echo "{}"
```

Valores default se ausentes:
- `modo`: "solo"
- `paralelizacao`: true
- `commit_docs`: true
- `auto_advance`: false

## 2. Apresentar Opcoes

Usar AskUserQuestion com valores atuais pre-selecionados:

```
AskUserQuestion([
  {
    question: "Modo de trabalho?",
    header: "Modo",
    multiSelect: false,
    options: [
      { label: "Solo (Recomendado)", description: "Desenvolvedor unico, commits diretos" },
      { label: "Time", description: "Multiplos desenvolvedores, branches por fase" }
    ]
  },
  {
    question: "Paralelizar agentes quando possivel?",
    header: "Paralelizacao",
    multiSelect: false,
    options: [
      { label: "Sim (Recomendado)", description: "Agentes rodam em paralelo quando independentes" },
      { label: "Nao", description: "Agentes rodam sequencialmente" }
    ]
  },
  {
    question: "Commitar documentos de planejamento automaticamente?",
    header: "Commit Docs",
    multiSelect: false,
    options: [
      { label: "Sim (Recomendado)", description: "STATE.md, ROADMAP.md, PLANs commitados automaticamente" },
      { label: "Nao", description: "Apenas codigo e commitado, docs ficam unstaged" }
    ]
  },
  {
    question: "Avancar pipeline automaticamente? (discutir -> planejar -> executar)",
    header: "Auto-Advance",
    multiSelect: false,
    options: [
      { label: "Nao (Recomendado)", description: "Manual /clear entre estagios" },
      { label: "Sim", description: "Encadeia estagios via subagentes" }
    ]
  },
  {
    question: "Qual preset de modelos usar para os agentes?",
    header: "Modelos",
    multiSelect: false,
    options: [
      { label: "Runtime (Padrao)", description: "Todos agentes usam o modelo da sessao (sem override)" },
      { label: "Opus Completo", description: "Opus em tudo — maximo qualidade, maximo custo" },
      { label: "Hibrido (Recomendado)", description: "Opus planeja e governa, Sonnet executa codigo" },
      { label: "Sonnet Completo", description: "Sonnet em tudo — rapido e economico" },
      { label: "Economico", description: "Sonnet planeja/executa, Haiku governa — maximo economia" },
      { label: "Custom", description: "Escolher modelo por papel manualmente" }
    ]
  }
])
```

### 2.1 Se Custom: Perguntar por Papel

Se o usuario escolheu "Custom", fazer segunda pergunta:

```
AskUserQuestion([
  {
    question: "Modelo para PLANEJAMENTO (arquiteto, product-analyst, system-designer, planejador)?",
    header: "Planning",
    multiSelect: false,
    options: [
      { label: "Opus", description: "Maximo raciocinio — ideal pra decisoes arquiteturais" },
      { label: "Sonnet", description: "Rapido e capaz — bom pra planejamento simples" },
      { label: "Haiku", description: "Ultra rapido — minimo custo" }
    ]
  },
  {
    question: "Modelo para EXECUCAO (executor, frontend/backend/database specialist)?",
    header: "Execution",
    multiSelect: false,
    options: [
      { label: "Opus", description: "Codigo mais cuidadoso e correto" },
      { label: "Sonnet", description: "Rapido e bom pra codigo — melhor custo-beneficio" },
      { label: "Haiku", description: "Ultra rapido — tarefas simples" }
    ]
  },
  {
    question: "Modelo para GOVERNANCA (supervisores, chiefs, CEO)?",
    header: "Governance",
    multiSelect: false,
    options: [
      { label: "Opus", description: "Revisao mais rigorosa — pega mais problemas" },
      { label: "Sonnet", description: "Revisao boa e rapida" },
      { label: "Haiku", description: "Revisao basica — maximo economia" }
    ]
  },
  {
    question: "Modelo para REVIEW (verificador, code-reviewer, testes, auditores)?",
    header: "Review",
    multiSelect: false,
    options: [
      { label: "Opus", description: "Deteccao maxima de problemas" },
      { label: "Sonnet", description: "Boa deteccao com custo menor" },
      { label: "Haiku", description: "Verificacao basica" }
    ]
  },
  {
    question: "Limite de custo do projeto (USD)?",
    header: "Budget",
    multiSelect: false,
    options: [
      { label: "Sem limite", description: "Nao bloquear gastos (default)" },
      { label: "$10", description: "Projeto pequeno" },
      { label: "$25", description: "Projeto medio" },
      { label: "$50", description: "Projeto grande" },
      { label: "$100", description: "Projeto enterprise" }
    ]
  },
  {
    question: "Routing de modelos: por papel ou por complexidade da task?",
    header: "Routing",
    multiSelect: false,
    options: [
      { label: "Per-role (Padrao)", description: "Preset estatico (planejador=opus, executor=sonnet, etc)" },
      { label: "Complexity", description: "Classifier do plano decide (Wave 5+) — task simples=haiku, complexa=opus" },
      { label: "Complexity-with-cap", description: "Classifier sugere, mas preset capa orcamento" }
    ]
  }
])
```

Mapear "Per-role" -> `per-role`, "Complexity" -> `complexity`, "Complexity-with-cap" -> `complexity-with-cap`. Salva em `modelos.routing`.

Mapear: "Sem limite" -> null, "$10" -> 10, "$25" -> 25, etc.

Workflows podem chamar `up-tools.cjs budget` em phase boundaries pra alertar quando passa de 50/75/90% do ceiling. Status `over_budget` pode bloquear novos spawns (controlado pelo workflow).

## 3. Atualizar config.json

Mapear respostas para valores:

```json
{
  "modo": "solo" | "time",
  "paralelizacao": true | false,
  "commit_docs": true | false,
  "auto_advance": true | false,
  "modelos": {
    "preset": "runtime" | "opus-completo" | "hibrido" | "sonnet-completo" | "economico" | "custom",
    "planning": "opus" | "sonnet" | "haiku",
    "execution": "opus" | "sonnet" | "haiku",
    "governance": "opus" | "sonnet" | "haiku",
    "review": "opus" | "sonnet" | "haiku"
  },
  "instrumentation": { "enabled": true },
  "budget_ceiling": null | 10 | 25 | 50 | 100
}
```

Para presets nao-custom, os campos planning/execution/governance/review sao preenchidos automaticamente a partir do preset.
Para "runtime", o campo modelos e omitido (null).

Escrever em `.plano/config.json`.

## 4. Confirmar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > CONFIGURACAO ATUALIZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Opcao          | Valor            |
|----------------|------------------|
| Modo           | {solo/time}      |
| Paralelizacao  | {Sim/Nao}        |
| Commit Docs    | {Sim/Nao}        |
| Auto-Advance   | {Sim/Nao}        |
| Modelos        | {preset}         |
|   Planning     | {opus/sonnet/haiku/default} |
|   Execution    | {opus/sonnet/haiku/default} |
|   Governance   | {opus/sonnet/haiku/default} |
|   Review       | {opus/sonnet/haiku/default} |
| Budget Ceiling | {null/$10/$25/$50/$100} |
| Instrumentation| Ativada (default)         |

Estas opcoes se aplicam a futuros comandos UP.

Para alterar apenas modelos: `node "$HOME/.claude/up/bin/up-tools.cjs" config set modelos.preset hibrido`
Para alterar budget: `node "$HOME/.claude/up/bin/up-tools.cjs" config set budget_ceiling 50`
Para ver gasto atual: `node "$HOME/.claude/up/bin/up-tools.cjs" budget`
```

</process>
