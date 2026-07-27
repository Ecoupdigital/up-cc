---
phase: 17-planejamento-por-grafo
plan: "005"
completed: "2026-07-27"
---

# Fase 17 Plano 005: Fechamento e regressao - Summary

## O que foi feito

1. **Verbete de onda**: SAIDA 1. `up/references/glossario-up.md` define onda como visao
   derivada da dependencia declarada. Confere com `deriveFrontier` e a doutrina do 002.
   Evidencia: `005-verbete.txt`.
2. **Comandos**: 7 comandos; 6 com workflow resolvivel; `depurar` e self-contained (pre-existente).
   Gates e frontier presentes em build.md. `005-comandos.txt`.
3. **Runtimes**: instalacao claude/gemini/opencode/codex em HOME temp, FALHOU=0.
   Conteudo instalado cita phase-plan-index, frontier, gate verdict. `005-runtimes.txt`.
4. **Projeto antigo**: validate-plan legado com avisos (nao reprova schema); ordering_mode=onda.
   `005-projeto-antigo.txt` com linha PASS.
5. **Suite**: plans 22/22, plan-checks 23/23, github 10/10. `005-suite.txt`.
6. **Escrita**: sem travessao nos artefatos da fase. `005-escrita.txt`.
7. **Fechamento**: ROADMAP fase 17 completa; STATE atualizado; REQUIREMENTS PLANO-01..13 [x].

## Itens herdados (fase 16)

- **A**: PLAN-READY schema 2 real em dir temp; `gate plan-ready` pass=true. `herdado-A-*.txt`.
- **B**: workflows instalados greppados por gate verdict / frontier / phase-plan-index. `herdado-B-*.txt`.

## Mutacao

`evidencia/006-mutacao.txt`: M1-M6 + M3b. Suites limpas apos reversoes.

## LINHA PARA O LOG

```
2026-07-27T00:00:00Z | fase=17 | executor | APPROVED | evidence=logic:test_pass | seams=plans.cjs+plan-checks.cjs
```

(nao gravado em governance/ porque gitignored; revisor transcreve no main)

## Self-check

- Suite verde; travessao zero nos artefatos md da fase e libs novas.
- Proximo passo: revisao e merge da branch.
