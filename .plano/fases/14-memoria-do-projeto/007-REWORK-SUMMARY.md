---
phase: 14-memoria-do-projeto
plan: 007
subsystem: rework-verificacao
tags: [memoria, rework, brainstorm-skill, guardas-de-admissao, tdd]
dependency_graph:
  requires:
    - "14-VERIFICATION.md: laudo que apontou DEB-14-01 e DEB-14-02"
  provides:
    - "up/skills/up-brainstorm/SKILL.md: linha executavel da consulta a base de rejeicoes"
    - "up/bin/lib/memoria-rejeicoes.cjs: normalizarGuarda colapsa contracao pra/para nas duas guardas de admissao"
  affects:
    - "MEM-09 deixa de ser so prosa: a consulta agora tem invocacao real"
    - "MEM-12: guarda de adiamento fecha o buraco de contracao apontado no laudo"
tech_stack:
  added: []
  patterns:
    - "Normalizacao escopada por funcao de uso (normalizarGuarda), sem alterar a normalizacao geral usada por busca/alias/slug"
key_files:
  created: []
  modified:
    - up/skills/up-brainstorm/SKILL.md
    - up/bin/lib/memoria-rejeicoes.cjs
    - up/bin/lib/memoria-rejeicoes.test.cjs
decisions:
  - "[Rework] Normalizacao da contracao pra/para restrita a uma funcao nova (normalizarGuarda), usada so pelas duas guardas de admissao. A funcao normalizar() geral ficou intocada de proposito: busca por conceito, dedup de alias e geracao de slug dependem da forma neutra sem esse colapso, e mudar o comportamento delas nao foi pedido nem provado necessario."
metrics:
  tasks_completed: 2
  files_changed: 3
  commits: 2
  completed_date: "2026-07-26"
---

# Fase 14 Plano 007: Rework de Verificacao (dois furos do laudo) Summary

Fechamento pontual dos dois furos reais que `14-VERIFICATION.md` (DEB-14-01 e DEB-14-02) apontou na fase 14. Nada alem disso foi tocado: sem runner de teste no `package.json`, sem gate automatico da regua do glossario, sem mecanizar o corte do MEM-06, sem tocar `init up`/`init auditar` nem travessao pre-existente.

## Furo 1: a consulta a base de rejeicoes nao tinha linha executavel

**O que o laudo provou:** `up/skills/up-brainstorm/SKILL.md` nomeava o espaco de comando (`memoria`) e o submodulo (`fora-de-escopo`), mas nunca escrevia a invocacao real. Oito workflows do produto usam a convencao `node "$HOME/.claude/up/bin/up-tools.cjs" <comando>` de forma explicita; a skill nao. Efeito pratico: um agente lendo a skill precisava inferir a linha de comando sozinho, o que degrada confiabilidade em vez de impedir, mas era o ponto mais fragil da entrega (MEM-09 ficava provado no mecanismo, com debito no gatilho).

**Correcao:** acrescentada a linha executavel exata, no ponto certo do fluxo (antes de explorar a intencao), seguindo a mesma convencao dos oito workflows:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" memoria fora-de-escopo buscar --pedido "<texto do pedido do dono>"
```

Junto com a linha, a skill agora diz como interpretar a saida: JSON com `achados` (lista) e `base_existe` (booleano); lista vazia segue a regra de silencio ja existente; lista nao vazia, usar o campo `pergunta` do primeiro achado (maior pontuacao primeiro), verbatim, como a pergunta ao dono.

**Prova real, contra um projeto temporario do zero (nao inferida, executada):**

```
$ node up/bin/up-tools.cjs memoria fora-de-escopo registrar \
    --conceito "chat ao vivo" --titulo "Chat ao vivo com atendente humano" \
    --motivo "O produto e self-service por decisao de custo operacional e atendimento humano inverteria o modelo."
{
  "conceito": "chat-ao-vivo",
  "caminho": ".plano/fora-de-escopo/chat-ao-vivo.md",
  "aliases_count": 0,
  "base_criada_agora": true
}

$ node up/bin/up-tools.cjs memoria fora-de-escopo buscar --pedido "quero adicionar um chat ao vivo pro cliente falar com humano"
{
  "achados": [
    {
      "conceito": "chat-ao-vivo",
      "titulo": "Chat ao vivo com atendente humano",
      "motivo": "O produto e self-service por decisao de custo operacional e atendimento humano inverteria o modelo.",
      "registrado_em": "2026-07-26",
      "caminho": ".plano/fora-de-escopo/chat-ao-vivo.md",
      "chave_casada": "chat-ao-vivo",
      "pontuacao": 2,
      "pergunta": "O pedido novo parece com o conceito ja recusado \"Chat ao vivo com atendente humano\" (recusado em 2026-07-26). O motivo original foi: O produto e self-service por decisao de custo operacional e atendimento humano inverteria o modelo. Recomendo manter a recusa, porque o motivo original e estrutural e o pedido novo nao trouxe fato que o contradiga. Mantemos a recusa ou revisamos ela agora?"
    }
  ],
  "base_existe": true
}
```

A linha que a skill agora manda rodar, rodada literalmente, devolveu o achado com a pergunta pronta. A skill deixou de ser prosa sem invocacao.

**Commit:** `4bc1451` (docs, linha executavel).

## Furo 2: buraco de normalizacao nas guardas de admissao

**O que o laudo provou:** as duas listas fechadas (`MARCAS_IMPLEMENTADO`, `MARCAS_ADIAMENTO`) barravam `"deixar para depois"` e `"fica pra depois"`, mas deixavam passar `"deixar pra depois"`. Mesma intencao, contracao da preposicao diferente.

**Vermelho antes da correcao** (teste acrescentado a `memoria-rejeicoes.test.cjs`, rodado contra o codigo tal como estava):

```
$ node up/bin/lib/memoria-rejeicoes.test.cjs
  ...
  ok  - registrar: motivo com marca de adiamento falha e nao cria a base
  FAIL - registrar: contracao "pra" da marca "deixar pra depois" falha igual a "deixar para depois"
      Missing expected exception.
  ok  - registrar: forma "deixar para depois" continua barrada apos a normalizacao de contracao
  ...
26 passed, 1 failed
```

**Correcao:** funcao nova `normalizarGuarda(texto)` em `up/bin/lib/memoria-rejeicoes.cjs`, que normaliza o texto (mesma normalizacao de sempre) e depois colapsa a contracao `"pra"` (palavra inteira, via `\bpra\b`, nunca prefixo de outra palavra) para `"para"`. As duas funcoes de guarda (`verificarGuardaImplementado`, `verificarGuardaAdiamento`) passaram a usar `normalizarGuarda` no lugar de `normalizar`. A funcao `normalizar()` geral **nao foi alterada**: busca por conceito, dedup de alias e geracao de slug continuam dependendo da forma neutra sem esse colapso, porque nada no laudo pediu ou provou necessidade de mudar esse comportamento ali.

**Verde depois da correcao:**

```
$ node up/bin/lib/memoria-rejeicoes.test.cjs
  ...
  ok  - registrar: motivo com marca de adiamento falha e nao cria a base
  ok  - registrar: contracao "pra" da marca "deixar pra depois" falha igual a "deixar para depois"
  ok  - registrar: forma "deixar para depois" continua barrada apos a normalizacao de contracao
  ...
27 passed, 0 failed
```

**Prova real via linha de comando (nao so via `require` direto), contra projeto temporario do zero:**

```
$ node up/bin/up-tools.cjs memoria fora-de-escopo registrar \
    --conceito "modo escuro automatico" --titulo "Modo escuro automatico por horario" \
    --motivo "Isso a gente pode deixar pra depois, tem coisa mais urgente agora."
Error: Rejeicao nao registrada: o motivo indica adiamento (marca "deixar para depois"), e adiamento nao e rejeicao. O lugar certo desse registro e a secao de pendencias do documento de estado do projeto.
codigo de saida: 1
```

Nenhum diretorio `.plano/fora-de-escopo/` foi criado nessa tentativa (checado por conta propria).

**Regressao:** as duas baterias de teste relacionadas rodaram limpas depois da correcao: `memoria-rejeicoes.test.cjs` (27 passed, 0 failed) e `memoria-e2e.test.cjs` (16 passed, 0 failed, sem alteracao). As outras duas baterias do espaco `memoria` (`memoria-decisao.test.cjs`, 25 passed; `memoria-glossario.test.cjs`, 19 passed; `memoria-termo.test.cjs`, 19 passed) tambem rodaram sem regressao, ja que a mudanca foi isolada a duas funcoes de um unico submodulo.

**Commit:** `99424d1` (fix + testes, contracao pra/para).

## Limitacao registrada, e explicitamente NAO resolvida: parafrase fura a guarda

O verificador furou as duas guardas com parafrase: `"esse recurso ja foi entregue"` e `"nao temos tempo neste trimestre"` passam, mesmo dizendo a mesma coisa que `"ja existe"` e `"por enquanto"`. Isso **nao foi corrigido neste rework**, por decisao deliberada, e a limitacao esta registrada por escrito em dois lugares:

1. **No codigo**, no comentario de topo de `up/bin/lib/memoria-rejeicoes.cjs`: as duas guardas sao listas lexicas fechadas, colapsam a contracao pra/para, mas nao entendem parafrase. Perseguir cada parafrase possivel com mais palavra-chave e jogo de gato e rato que a lista sempre perde: cada frase nova bloqueada abre espaco pra outra reformulacao nao prevista. Fechar o caso adversarial exigiria classificacao semantica (um modelo, nao uma lista de string), que e decisao de arquitetura fora do escopo deste modulo.
2. **Aqui neste SUMMARY**, para quem revisar o rework: a guarda existe para pegar o caso descuidado (marca literal, com ou sem acento, com ou sem contracao de preposicao), nao a tentativa deliberada de reescrever a frase para escapar da lista. Nao tentei ampliar a lista com sinonimos de "ja implementado" ou "por enquanto" para cobrir mais parafrases: isso teria o mesmo defeito estrutural que o laudo criticou, so que adiado, e o pedido desta rodada foi explicito em nao tentar resolver esse ponto.

## O que NAO foi feito (fora do escopo pedido, por instrucao explicita)

- Nenhuma secao `scripts` criada em `package.json`, nenhum runner de teste (fase 16).
- Nenhum gate automatico para a regua do glossario (`memoria glossario check`).
- Nenhuma mecanizacao do corte de tres frases do MEM-06 (declarado parcial e aceito).
- `init up` e `init auditar` nao tocados.
- Nenhum travessao pre-existente corrigido.

## Self-Check

Arquivos:
- ENCONTRADO: `up/skills/up-brainstorm/SKILL.md` (linha executavel presente, seção "Consulta à memória antes de explorar")
- ENCONTRADO: `up/bin/lib/memoria-rejeicoes.cjs` (`normalizarGuarda` definida e usada nas duas guardas, limitacao de parafrase documentada no comentario de topo)
- ENCONTRADO: `up/bin/lib/memoria-rejeicoes.test.cjs` (dois casos novos: contracao barrada, forma "para" continua barrada)

Commits (`git log --oneline` na branch `up/fase-14-memoria-do-projeto`):
- ENCONTRADO: `4bc1451` (docs, linha executavel na skill)
- ENCONTRADO: `99424d1` (fix, normalizarGuarda + testes)

Verificacoes adicionais:
- `git diff` dos tres arquivos tocados, checado por `grep -P '[\x{2014}\x{2013}]'`: vazio, sem em-dash nem en-dash introduzido.
- Nenhum `TBD` introduzido.
- Bateria completa do espaco `memoria` reexecutada apos as duas correcoes: `memoria-rejeicoes.test.cjs` (27/27), `memoria-e2e.test.cjs` (16/16), `memoria-decisao.test.cjs` (25/25), `memoria-glossario.test.cjs` (19/19), `memoria-termo.test.cjs` (19/19). Total 106 casos, 0 falhas.
- Prova de ponta a ponta via binario real (nao so `require` direto) para os dois furos, capturada nas secoes acima.

## Self-Check: PASSOU

---
*Phase: 14-memoria-do-projeto*
*Completed: 2026-07-26*
