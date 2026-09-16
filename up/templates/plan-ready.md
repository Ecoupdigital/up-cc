# PLAN-READY.md Template

Template para `.plano/PLAN-READY.md`: índice curto que sinaliza que a próxima fase (ou o projeto,
com `--profundo`) foi planejada e está pronta para execução.

Gerado por `/up:plan` ao final do planejamento.
Lido por `/up:build` como pré-requisito de entrada.

<template>

```yaml
---
version: "3.1.0"
fora_de_escopo: []     # o que este plano deliberadamente NAO faz, uma linha por item
planned_at: ""
planned_by:
  runtime: ""           # claude-code | opencode | gemini-cli
intended_execution:
  runtime: ""           # same | claude-code | opencode | gemini-cli | any
project_name: ""
mode: ""                # greenfield | brownfield
profundo: false          # true so quando planejado com --profundo
total_phases: 0
total_plans: 0
status: ready_for_execution
---

# Pronto Para Execucao

`/up:build` executa o que está listado abaixo. Sem `--profundo`, normalmente é só a próxima fase
(1 a 3 planos). Com `--profundo`, o projeto inteiro foi planejado de uma vez.

## Como executar

```
/up:build
```

Pode ser executado neste mesmo runtime ou em outro. O estado está completamente salvo em `.plano/`.

## Fases planejadas

| # | Fase | Planos | Wave | Status |
|---|------|--------|------|--------|
| 1 | [nome] | [N] | 1 | planejada |

## Fora de escopo

- [item]: [motivo em uma linha]

## Listagem completa de planos

[para o /up:build validar que cada arquivo existe]

| ID | Path |
|----|------|
| 01-01 | fases/01-auth/01-01-PLAN.md |
```

</template>

<guidelines>

## Como o /up:build usa este arquivo

1. Arquivo deve existir.
2. Parse do frontmatter YAML.
3. Para cada plano listado (regex `fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md`), verificar se existe no disco.
4. Falta algum: alertar e oferecer planejamento local.
5. Tudo OK: prosseguir com a execução.

## Quando este arquivo é atualizado

- Criado: ao final de `/up:plan` (fase ou projeto).
- Lido: no início de `/up:build`.
- Atualizado: em cada `/up:plan` seguinte, quando a fase anterior já foi construída (novo índice para a
  próxima fase).
- Deletado: ao final do `/up:build` do projeto inteiro (vira PROJECT-COMPLETE.md).

</guidelines>
