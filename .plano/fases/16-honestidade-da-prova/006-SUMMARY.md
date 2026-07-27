---
phase: 16-honestidade-da-prova
plan: "006-rework"
tags: [RG-001, mutacao, prova]
completed: "2026-07-27"
---

# Rework RG-001: prova por mutacao

## O que foi feito

Com a implementacao verde no lugar, apliquei oito mutacoes isoladas (uma por vez), rodei a
suite relevante, capturei a saida bruta e reverti. Nada ficou mutado no codigo final.

## Tabela mutacao -> casos vermelhos

| Mutacao | Alvo | Casos vermelhos | Discriminou? |
|---------|------|-----------------|--------------|
| M1 seletor so `phase-N` | `gate.cjs` | seletor fase 11; posicao; vocabulario smoke/test; campo escalar; evidencia esperada | SIM |
| M2 veredito por `fields[3]` (awk $4) | `gate.cjs` | **posicao: veredito nao e evidencia**; fragmento; campo escalar; evidencia esperada | SIM |
| M3 sem alias smoke/test | `gate.cjs` | vocabulario smoke:pass; vocabulario test:red-green; evidencia esperada | SIM |
| M4 sem legado | `gate.cjs` | **legado passa e avisa** | SIM |
| M5 `pareceCaminho` sempre false | `gate.cjs` | **contrato que parece caminho bloqueia** | SIM |
| M6 desliga `esperado_computado_no_teste` | `tautologia.cjs` | **tautologico e sinalizado**; heuristica nao bloqueia; log; summary contagem | SIM |
| M7 desliga `assercao_repete_implementacao` | `tautologia.cjs` | **asserção que repete a implementacao** | SIM |
| M8 apaga secao GRILL-05 | `grill.md` | **GRILL-05: ordem por dependencia...** | SIM |

Saida bruta completa de cada mutacao: `evidencia/006-mutacao.txt`.

## Ponto critico do plano 001

O caso `posicao: veredito nao e evidencia` ficou vermelho em M2 com a implementacao posicional
de verdade (a 4a coluna vira `evidence=smoke:pass` ou texto cru da evidencia). Isso e a prova
que o `001-red.txt` (Unknown command) nao entregava.

## Casos que nao discriminaram na matriz

Registrados por escrito em `006-mutacao.txt` (secao "Politica para casos..."). Nenhum dos tres
pontos de quebra, nem legado, nem caminho, nem os dois sinais de tautologia, sobreviveu a
mutacao da propria superficie. Sobreviventes sao fail-open, controles negativos, ou ramos fora
da matriz minima (tipo/justificativa plan-ready, etc.). Saida escolhida: **registrar o limite**,
nao remover e nao inventar mutacao extra fora do pedido.

## GRILL-05 (ponto 3 da avaliacao critica)

M8 (apagar a secao inteira) deixou o caso GRILL-05 vermelho. Nao foi necessario apertar a
asserção nesta rodada.

## Self-Check

- [x] Arquivos de producao restaurados apos as mutacoes (`diff` limpo vs backup)
- [x] Suites verdes de novo apos restore
- [x] `006-mutacao.txt` com saida bruta
- [x] Zero travessao no texto novo
