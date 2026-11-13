# Template de PLAN.md (plano de uma página)

Template para `.plano/fases/NN-slug/NN-MM-PLAN.md`. Alvo: até ~4 KB. Escrito pela sessão
(orquestrador de `/up:plan`), sem `up-planejador`, exceto com `--profundo`.

O plano é contrato concreto: o que fica verdadeiro, o que fica de fora, **onde mexer** e **o comando
que prova**. O modelo forte pensa aqui; o executor (às vezes um modelo menor) segue. Receita linha a
linha continua proibida: sem código, import, SQL, tipo ou assinatura de função no plano.

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

[Uma a três frases: o que o usuário ou o sistema consegue fazer depois.]
Onde: [arquivos ou áreas a tocar, descobertos lendo o código: `src/auth/`, `app/login/page.tsx`]
Implícitos: [só o que do padrão de Product Engineer muda o resultado desta entrega. Vazio se nada.]
Prova: [comando exato, `npm test -- auth`, ou "captura de /rota" para UI]

### 2. [Próxima entrega]

[...]
Onde: [...]
Implícitos: [...]
Prova: [...]

## Critério de pronto

- [Critério observável 1]
- [Critério observável 2]
```

</template>

<guidelines>

## Tamanho e forma

- Alvo até ~4 KB. 2 a 5 entregas pedidas por plano. Implícitos não contam nesse limite.
- `### N. título` é o marcador de entrega que `phase-plan-index` e `validate-plan` reconhecem.

## Onde

Quem planeja lê o código e escreve os arquivos ou pastas que a entrega toca. Isso poupa o executor
de redescobrir o projeto. `Onde:` diz o lugar, não o que escrever nele. Arquivo novo entra com o
caminho onde vai nascer. `validate-plan` avisa entrega sem `Onde:` (aviso, não erro: plano antigo
segue executável).

## Implícitos

Destile de `up/references/product-engineering.md` só o que se aplica àquela entrega (busca e
paginação numa listagem, os 4 estados numa tela assíncrona, validação client+server num formulário).
O executor não carrega a referência inteira: o que importa vem nesta linha.

## Prova

O comando exato que o executor roda para provar a entrega (`npm test -- x`, `node script.cjs`,
`curl ...`) ou "captura de /rota" para UI. `validate-plan` avisa prova sem comando. O resultado
real fica no SUMMARY, depois de rodar.

## Critério de pronto

As poucas frases que resumem "a fase está pronta quando isto for verdade", conferidas ao ler o SUMMARY.

## O que vive no `--profundo`

`must_haves` estruturado, pesquisa documentada inline e o loop de refazer do `validate-plan`, em
`up/workflows/plan-profundo.md` com `up-planejador`.
</guidelines>
