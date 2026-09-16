# Template de PLAN.md (plano de uma página)

Template para `.plano/fases/NN-slug/NN-MM-PLAN.md`. Alvo: até ~3 KB. Escrito pela sessão
(orquestrador de `/up:plan`), sem `up-planejador`, exceto com `--profundo`.

O plano é contrato: o que fica verdadeiro, o que fica de fora, a prova. Nunca receita (sem import,
SQL, tipo, assinatura de função ou caminho de arquivo como passo a passo).

<template>

```markdown
---
phase: NN-slug
plan: NN-MM
type: frontend|backend|database|misto
wave: 1
depends_on: []
autonomous: true
---

# Fase [N] Plano [M]: [Nome]

**Objetivo:** [O que fica verdadeiro quando este plano termina, e por quê. Uma a três frases.]

## Fora de escopo

- [O que este plano deliberadamente não faz]

## Entregas

### 1. [Título da entrega, resultado observável]

[Uma a três frases: o que o usuário ou o sistema consegue fazer depois. Sem código, sem caminho de
arquivo como receita.]
Implícitos: [o que do padrão de Product Engineer se aplica a esta entrega: busca/filtro/paginação
numa listagem, os 4 estados numa tela assíncrona, validação client+server num formulário, etc.
Vazio se a entrega não abre superfície nova para o usuário.]
Prova: [teste automatizado | captura de tela | smoke, descrito em uma frase]

### 2. [Próxima entrega]

[...]
Implícitos: [...]
Prova: [...]

## Critério de pronto

- [Critério observável 1]
- [Critério observável 2]
```

</template>

<guidelines>

## Tamanho e forma

- Alvo até ~3 KB. `validate-plan` avisa (não bloqueia) se passar disso; se passar muito, é sinal de
  que a fase tem mais de um plano ou entregas demais (ver limite de fase em `up/workflows/plan.md`
  e `up/agents/up-arquiteto.md`).
- 2 a 5 entregas pedidas por plano. Implícitos de uma entrega não contam nesse limite.
- `### N. título` é o marcador de entrega que `phase-plan-index` e `validate-plan` reconhecem.

## Implícitos, não checklist

A linha `Implícitos:` cita em uma frase o que do padrão de Product Engineer
(`up/references/product-engineering.md`) se aplica àquela entrega. Não é para listar os 13 itens do
padrão em toda entrega: só o que muda o resultado esperado. O executor faz a análise completa
sozinho; o plano só aponta o que não é óbvio a partir do título da entrega.

## Prova

Uma frase por entrega: o tipo (teste automatizado, captura de tela, smoke) e o que ela precisa
mostrar. O comando exato e o resultado ficam para o SUMMARY, escrito depois de rodar a prova de
verdade.

## Critério de pronto

Substitui o antigo bloco `must_haves` (truths/artifacts/key_links). São as poucas frases que
resumem "a fase está pronta quando isto for verdade", conferidas pelo orquestrador ao ler o SUMMARY,
sem agente de verificação separado.

## O que saiu deste template (vive no `--profundo`)

`must_haves` estruturado, pesquisa documentada inline, checklist de 9 itens de self-check e o loop de
refazer do `validate-plan`. Quem precisa desse nível de detalhe (projeto grande, planejar num
runtime e executar em outro) usa `/up:plan --profundo`, que mantém `up-planejador` como hoje.
</guidelines>
