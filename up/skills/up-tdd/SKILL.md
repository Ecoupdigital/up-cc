---
name: up-tdd
description: "Use ao implementar qualquer feature, ajuste ou bugfix, antes de escrever o codigo de implementacao. A prova exigida varia por tipo de codigo: teste red-green para logica, captura visual para UI, smoke-test para integracao."
---

# UP TDD por Tipo

A Lei de Ferro real e "evidencia fresca antes de afirmar pronto" (ver `up-verificar-antes-de-concluir`). TDD-unit nao e universal: e UMA forma de prova. O tipo de codigo decide qual prova o gate exige.

Leia o tipo via `classify-task` (`frontmatter_type`, reasons) do `up-tools.cjs`, ou classifique pela natureza da mudanca. O gate `approvals.log` so passa com a evidencia do tipo certo.

## Logica / parser / calculo / API-propria / bugfix -> red-green-refactor de verdade

**Lei:** NENHUM CODIGO DE PRODUCAO SEM UM TESTE FALHANDO ANTES. Escreveu codigo antes do teste? Delete. Recomece dos testes.

- **RED:** escreva UM teste minimal de um comportamento, codigo real (sem mock salvo inevitavel).
- **Verifique RED (obrigatorio, nunca pule):** rode o teste. Confirme que FALHA (nao da erro), que a mensagem e a esperada, que falha porque a feature falta. Se voce nao viu o teste falhar, nao sabe se ele testa a coisa certa.
- **GREEN:** codigo minimo pra passar. Nada de `options?` extra, nada de "melhorar alem do teste". YAGNI.
- **Verifique GREEN (obrigatorio):** rode, confirme que passa, que os outros testes seguem verdes, saida limpa (zero warnings).
- **REFACTOR:** so depois do verde. Remove duplicacao, melhora nomes, mantem verde, nao adiciona comportamento.
- **Bugfix:** escreva o teste que reproduz o bug antes do fix. Regressao: escreve -> roda (passa) -> reverte o fix -> roda (DEVE falhar) -> restaura -> roda (passa).

## UI / CSS -> prova visual obrigatoria

NAO e red-green com mock. A prova e a captura. Tire screenshot ANTES e DEPOIS via Playwright (ou `up-tester`) e compare. "O CSS parece certo" nao prova nada. Sem o antes/depois, o gate nao passa.

## Glue / integracao (Asaas, uazapi, Supabase, Shopify, webhooks) -> smoke-test obrigatorio

Nao da pra red-green de verdade contra dependencia externa. A prova e o smoke-test: rode UMA chamada real (ou contra sandbox) e confirme a resposta esperada. "O endpoint existe" nao prova integracao.

## Common rationalizations (matam o atalho)

- "Testo depois." -> Teste que passa de primeira nao prova nada.
- "Deletar X horas de codigo e desperdicio." -> Falacia do custo afundado. Codigo nao verificado e divida tecnica.
- "TDD e dogmatico, estou sendo pragmatico." -> TDD E pragmatico.
- "Pulo o TDD so dessa vez." -> Isso e racionalizacao. Pare.
- "Violar a letra da regra e violar o espirito da regra."

Excecoes (so com permissao explicita): prototipo descartavel, codigo gerado, arquivo de config.
