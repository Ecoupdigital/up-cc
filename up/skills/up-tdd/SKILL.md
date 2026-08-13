---
name: up-tdd
description: "Use ao implementar qualquer feature, ajuste ou bugfix, antes de escrever o codigo de implementacao. A prova exigida varia por tipo de codigo: teste red-green para logica, captura visual para UI, smoke-test para integracao."
---

> Vocabulário UP: fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

# UP TDD por Tipo

A Lei de Ferro real e "evidencia fresca antes de afirmar pronto" (ver `up-verificar-antes-de-concluir`). TDD-unit nao e universal: e UMA forma de prova. O tipo de codigo decide qual prova o gate exige.

Leia o tipo via `classify-task` (`frontmatter_type`, reasons) do `up-tools.cjs`, ou classifique pela natureza da mudanca. Os 3 tipos, a prova de cada e o formato do campo `evidence=<tipo>:<resultado>` estao na ref `tdd-evidence-types`. O gate `approvals.log` passa com a linha de evidencia do tipo certo (`logic:test_pass` | `ui:visual` | `glue:smoke`), escrita pelo orquestrador a partir da prova. O `up-revisor` so entra com `--review`.

## Logica / parser / calculo / API-propria / bugfix -> red-green-refactor de verdade

**Lei:** NENHUM CODIGO DE PRODUCAO SEM UM TESTE FALHANDO ANTES. Escreveu codigo antes do teste? Delete. Recomece dos testes.

- **RED:** escreva UM teste minimal de um comportamento, codigo real (sem mock salvo inevitavel).
- **Verifique RED (obrigatorio, nunca pule):** rode o teste. Confirme que FALHA (nao da erro), que a mensagem e a esperada, que falha porque a feature falta. Se voce nao viu o teste falhar, nao sabe se ele testa a coisa certa.
- **GREEN:** codigo minimo pra passar. Nada de `options?` extra, nada de "melhorar alem do teste". YAGNI.
- **Verifique GREEN (obrigatorio):** rode, confirme que passa, que os outros testes seguem verdes, saida limpa (zero warnings).
- **REFACTOR:** so depois do verde. Remove duplicacao, melhora nomes, mantem verde, nao adiciona comportamento.
- **Bugfix:** escreva o teste que reproduz o bug antes do fix. Regressao: escreve -> roda (passa) -> reverte o fix -> roda (DEVE falhar) -> restaura -> roda (passa).

## Regra anti-tautologia: o valor esperado vem de fonte independente

O valor esperado vem de fonte independente: literal conhecido bom, exemplo trabalhado a mao, ou o
proprio requisito. Nunca recomputado do mesmo jeito que o codigo computa.

Teste que recomputa passa por construcao, nunca discorda do codigo, e por isso nao e prova de nada.

Cenario unico (funcao que transforma titulo em identificador legivel: remove acento, baixa a caixa
e troca espaco por hifen):

**RUIM (tautologico):**
```js
assert.strictEqual(
  slugify(entrada),
  entrada.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, '-')
);
```
Se a implementacao errar a ordem das operacoes, o teste erra junto e continua verde.

**BOM (honesto):**
```js
assert.strictEqual(slugify('Ola Mundo'), 'ola-mundo');
```
Se a implementacao mudar de comportamento, este teste fica vermelho, que e a unica coisa que um
teste precisa saber fazer.

Tres fontes independentes aceitas:
- Literal conhecido bom (ex.: `'ola-mundo'`).
- Exemplo trabalhado (entrada e saida escritas a mao antes do codigo).
- O requisito citado por identificador (ex.: REQ-SLUG-01).

Racionalizacao que mata o atalho: "escrever o esperado a mao e duplicar logica" responde
"duplicar de proposito e o ponto: e a segunda opiniao".

Onde isto e verificado: a verificacao estatica sinaliza o achado por heuristica e o revisor
confirma ou descarta, sem bloquear o gate sozinha.

## UI / CSS -> prova visual obrigatoria

NAO e red-green com mock. A prova e a captura. Tire screenshot ANTES e DEPOIS via Playwright (ou `up-tester`) e compare. "O CSS parece certo" nao prova nada. Sem o antes/depois, o gate nao passa.

## Glue / integracao (Asaas, uazapi, Supabase, Shopify, webhooks) -> smoke-test obrigatorio

Nao da pra red-green de verdade contra dependencia externa. A prova e o smoke-test: rode UMA chamada real (ou contra sandbox) e confirme a resposta esperada. "O endpoint existe" nao prova integracao.

## Common rationalizations (matam o atalho)

- "Testo depois." -> Teste que passa de primeira nao prova nada.
- "Deletar X horas de codigo e desperdicio." -> Falacia do custo afundado. Codigo nao verificado e divida tecnica.
- "TDD e dogmatico, estou sendo pragmatico." -> TDD E pragmatico.
- "Pulo o TDD so dessa vez." -> Isso e racionalizacao. Pare.
- "Escrever o esperado a mao e duplicar logica." -> Duplicar de proposito e o ponto: e a segunda opiniao.
- "Violar a letra da regra e violar o espirito da regra."

Excecoes (so com permissao explicita): prototipo descartavel, codigo gerado, arquivo de config.
