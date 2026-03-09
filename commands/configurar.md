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
  }
])
```

## 3. Atualizar config.json

Mapear respostas para valores:

```json
{
  "modo": "solo" | "time",
  "paralelizacao": true | false,
  "commit_docs": true | false,
  "auto_advance": true | false
}
```

Escrever em `.plano/config.json`.

## 4. Confirmar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > CONFIGURACAO ATUALIZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Opcao          | Valor       |
|----------------|-------------|
| Modo           | {solo/time} |
| Paralelizacao  | {Sim/Nao}   |
| Commit Docs    | {Sim/Nao}   |
| Auto-Advance   | {Sim/Nao}   |

Estas opcoes se aplicam a futuros /up:planejar-fase e /up:executar-fase.
```

</process>
