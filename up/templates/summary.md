# Summary Template

Arquivo: `.plano/fases/NN-nome/{fase}-{plano}-SUMMARY.md`. Curto: quem le e o `build close` e o dono.

```markdown
---
phase: NN-nome
plan: NN-MM
completed: YYYY-MM-DD
---

# Fase N Plano M: [Nome]

**[Uma linha com o que ficou verdadeiro. Ex.: "Login com e-mail e refresh rotativo via jose", nunca "plano completo".]**

## Prova

| Entrega | Tipo | Comando ou acao | Resultado |
|---------|------|-----------------|-----------|
| 1. [titulo] | logica \| ui \| integracao | `npm test -- auth` | 12 passed, 0 failed |

## Commits

- `abc123f` feat(NN-MM): [descricao]

## Desvios

[Correcoes fora do plano e o que ficou de fora, uma linha cada. Ou "Nenhum".]

## DECISOES ESCALADAS

[So se houve. Por decisao: Decisao / Recomendo / Porque / Alternativas. Sem decisao: omita a secao.]
```

`## Prova` e obrigatoria. Prova nao rodada: escreva "nao rodada" e o motivo, nunca invente resultado.
