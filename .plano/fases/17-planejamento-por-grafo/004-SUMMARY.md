---
phase: 17-planejamento-por-grafo
plan: "004"
completed: "2026-07-27"
---

# Fase 17 Plano 004: Durabilidade, fora de escopo e exemplo ruim - Summary

Regra de durabilidade (sem caminho/bloco no corpo; excecao de prototipo; secao fora de
escopo obrigatoria) na doutrina, no template e no harness. 13 casos novos (total 23).

## O que foi feito

1. Doutrina de durabilidade + marcadores + fora de escopo + surface + exemplos em `up-planejador.md`.
2. Template `plan-ready.md`: secao fora de escopo completada (ja existia a chave da fase 16),
   exemplos bom/ruim; CEO sedimentado intacto.
3. 13 testes D1-D13 (vermelho em `004-red.txt` por ausencia de funcoes).
4. `checkDurability` + `checkRequiredSections` no harness; verde 23/23.
5. `validate-plan` aplica as tres regras com sugestoes de correcao.
6. Autoaplicacao nos 5 planos da fase: **FAIL** (ver decisao escalada).

## Prova

### Vermelho
13 FAILs: `checkDurability is not defined` (funcoes removidas temporariamente).

### Verde
```
23 passed, 0 failed
```

### validate-plan smoke
Arquivo temp com `plan_schema: 2` e caminho no corpo: issues de `durability_path`.

### Autoaplicacao
Os 5 planos da fase 17 falham (caminhos no corpo de action/verify, adjetivos no 003).
Evidencia: `004-autoaplicacao.txt`.

## DECISOES ESCALADAS

**1. Autoaplicacao dos 5 planos da fase 17 fica FAIL de proposito documentado.**
A nota do proprio 004-PLAN diz que a proibicao e o que a fase constroi, e que caminhos em
`<files>` sao trava de escopo. O corpo das tarefas desta fase ainda descreve caminhos em
comandos de verify e em nomes de evidencia. Reescrever os 5 planos apagaria a especificacao
que o executor acabou de seguir. Novos planos gerados apos o ciclo devem passar. Aceito FAIL
honesto em vez de maquiar PASS.

**2. Frontmatter inteiro isento da varredura de caminho** (nao so files_modified), porque
artifacts/key_links tambem citam paths como metadado de escopo.

## LINHA PARA O LOG

```
(data) | fase=17 plano=004 | executor | APPROVED | evidence=logic:test_pass | seams=plan-checks.cjs:checkDurability+checkRequiredSections
```

## Self-check

- 23 testes verdes; travessao zero nos tocados.
- Template: uma chave fora_de_escopo; CEO preservado.
