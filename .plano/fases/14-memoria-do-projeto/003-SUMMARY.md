---
phase: 14-memoria-do-projeto
plan: 003
subsystem: cli-tools
tags: [memoria, rejeicoes, fora-de-escopo, dedup-por-conceito, cli, tdd]
dependency_graph:
  requires:
    - "up/bin/lib/memoria.cjs (plano 002): roteador, dirForaDeEscopo, garantirDir, lerFlag, lerFlags"
    - "up/bin/lib/core.cjs: generateSlugInternal, toPosixPath, escapeRegex"
  provides:
    - "up/bin/lib/memoria-rejeicoes.cjs: acoes listar, registrar, alias e buscar da base de rejeicoes por conceito de dominio, ocupando a entrada `fora-de-escopo` ja declarada pelo plano 002"
  affects:
    - "14-memoria-do-projeto/005-PLAN.md (doutrina de quando consultar `memoria fora-de-escopo buscar` no brainstorm, chama estes comandos)"
    - "14-memoria-do-projeto/006-PLAN.md (prova ponta a ponta do criterio 4 do briefing, exercita este submodulo)"
tech_stack:
  added: []
  patterns:
    - "Casamento por conceito de dominio, nunca por palavra-chave solta: chave casa quando TODOS os tokens significativos aparecem no pedido e ela tem duas ou mais tokens, ou quando a forma normalizada contigua da chave aparece inteira no pedido; uma unica palavra compartilhada nunca casa sozinha"
    - "Duas guardas fechadas de admissao (item ja implementado, motivo temporario) que rodam antes de qualquer escrita, com listas de marca fechadas e mensagem que aponta o lugar certo do registro (documento de estado)"
    - "Criacao preguicosa de diretorio: so `registrar` chama `garantirDir`, e so depois das duas guardas e das regras de conteudo passarem"
    - "Normalizacao deterministica (minusculas, NFD sem marca diacritica, so letra/digito, espacos colapsados) como unica base de comparacao do modulo inteiro"
    - "Reescrita cirurgica do frontmatter (so o bloco de aliases) preservando o corpo do arquivo byte a byte, mesmo padrao do `mudarStatus` do plano 002"
key_files:
  created:
    - "up/bin/lib/memoria-rejeicoes.cjs"
    - "up/bin/lib/memoria-rejeicoes.test.cjs"
  modified: []
decisions:
  - "O conceito e derivado so da flag --conceito (nunca de --titulo), porque o contrato do arquivo separa as duas coisas: `--conceito` e o identificador (slug), `--titulo` e o rotulo legivel. Registrar sem --conceito falha citando o campo, sem fallback silencioso para o titulo."
  - "A verificacao de conceito duplicado usa o caminho do arquivo (`<conceito>.md` existe?), nao uma leitura previa da lista inteira, porque e a checagem mais barata e nao exige que o diretorio exista para funcionar (existsSync de um arquivo dentro de um diretorio ausente devolve false sem lancar erro)."
  - "montarPergunta devolve texto pronto em prosa (nao rotulado Pergunta:/Recomendo:/Porque:), porque o plano 005 e quem decide o momento e o empacotamento final da pergunta ao dono; este modulo entrega o conteudo (semelhanca, motivo original, recomendacao com porque), nao a apresentacao."
requirements-completed: [MEM-03, MEM-09, MEM-10, MEM-11, MEM-12]
metrics:
  duration: "~45min"
  completed: "2026-07-26"
---

# Fase 14 Plano 003: Base de rejeições por conceito de domínio Summary

**Comando `memoria fora-de-escopo` completo (listar, registrar, alias, buscar): dedup determinístico por conceito de domínio, nunca por palavra-chave, com duas guardas de entrada que barram item já implementado e motivo temporário antes de qualquer escrita.**

## Performance

- **Tarefas:** 6/6 completas
- **Commits:** 5 (4 de tarefa/feature + 1 de teste vermelho-verde), nenhum de metadados por instrução explícita de não tocar `.plano/STATE.md` nem `.plano/ROADMAP.md`
- **Arquivos:** 2 criados (521 + 398 linhas), 0 modificados. `up/bin/lib/memoria.cjs` e `up/bin/up-tools.cjs` não foram tocados.

## Realizações

- `memoria-rejeicoes.cjs listar` devolve os conceitos com título, data e tipo de motivo, mais o booleano `base_existe`, sem nunca criar `.plano/fora-de-escopo/`.
- `registrar` só grava depois de passar as duas guardas de admissão (item já implementado, motivo temporário) e as regras de conteúdo (campos obrigatórios, conceito único). A palavra solta "depois" em prosa legítima não produz recusa falsa, provado em teste dedicado.
- `alias` amplia o vocabulário de um conceito existente sem tocar no motivo: reescreve só o bloco de aliases do frontmatter, corpo preservado byte a byte. Apelido repetido é ignorado em silêncio.
- `buscar` é o coração do plano: casamento por conceito de domínio. Uma chave (slug, título ou apelido) casa quando todos os seus tokens significativos aparecem no pedido **e** ela tem duas ou mais tokens significativos, ou quando a forma normalizada contígua da chave aparece inteira no pedido. Uma única palavra compartilhada nunca casa sozinha: o caso "painel de controle do usuário" **não** casa com "painel de métricas em tempo real" está provado no teste.
- Cada achado da busca traz uma pergunta pronta para o dono, montada em três partes (semelhança citada com título e data, motivo original em uma frase, recomendação de manter a recusa com o porquê), incluindo o gatilho de reabertura quando declarado no arquivo.
- 25 casos de teste sem framework, com prova vermelho (24 de 25 falhando contra um stub sem implementação, código de saída 1) e verde (25 de 25, código de saída 0) documentada abaixo.

## Task Commits

Cada tarefa foi commitada atomicamente na branch `up/fase-14-memoria-do-projeto`:

1. **Tarefa 1: base de leitura (`normalizar`, `tokensSignificativos`, `listarRejeicoes`, ação `listar`)** - `76ec801` (feat)
2. **Tarefa 2: ação `registrar` com as duas guardas de admissão** - `71c59e0` (feat)
3. **Tarefa 3: ação `alias`** - `7186887` (feat)
4. **Tarefas 4 e 5: ação `buscar` (casamento por conceito) e `montarPergunta`** - `249b2e1` (feat, tratadas juntas porque a pergunta sugerida é campo do retorno de `buscar`, sem superfície própria)
5. **Tarefa 6: teste vermelho-verde** - `1ceae6f` (test)

## Files Created/Modified

- `up/bin/lib/memoria-rejeicoes.cjs` - `PALAVRAS_VAZIAS`, `MARCAS_IMPLEMENTADO`, `MARCAS_ADIAMENTO`, `normalizar`, `tokensSignificativos`, `extrairFrontmatter`, `extrairSecao`, `extrairGatilho`, `listarRejeicoes`, `verificarGuardaImplementado`, `verificarGuardaAdiamento`, `registrar`, `reescreverAliasesFrontmatter`, `adicionarAlias`, `primeiraFrase`, `montarPergunta`, `avaliarChave`, `buscar`, `run`
- `up/bin/lib/memoria-rejeicoes.test.cjs` - 25 casos sem framework, cobrindo normalização, criação preguiçosa, as duas guardas, apelido, casamento por conceito (incluindo o caso obrigatório do briefing) e pergunta sugerida

## Decisions Made

Ver `decisions` no frontmatter. Resumo: (1) conceito vem só de `--conceito`, sem fallback para `--titulo`; (2) duplicata de conceito é checada por existência do arquivo, não por leitura prévia da lista inteira; (3) `montarPergunta` devolve texto pronto em prosa, deixando o empacotamento formal da pergunta (rótulos `Pergunta:/Recomendo:/Porque:` do contrato) para a doutrina do plano 005, que decide o momento de perguntar.

## Desvios do Plano

Nenhum. O plano foi executado exatamente como escrito: mesmos nomes de ação, mesmas flags, mesmo formato de arquivo, mesma ordem de seções, mesmas duas listas fechadas de marca (nenhuma ampliada por conta própria).

## Provas rodadas (automated + vermelho/verde)

### Tarefa 6: vermelho antes do verde

**Vermelho** (`memoria-rejeicoes.cjs` temporariamente substituído por um stub cujas funções lançam "ainda não implementado", implementação real preservada à parte):

```
  FAIL - normalizar: minusculas, sem acento, so letra/digito, espacos colapsados
  FAIL - tokensSignificativos: descarta palavra vazia e token curto, sem repeticao
  FAIL - listarRejeicoes: base ausente devolve lista vazia e nao cria diretorio
  FAIL - acao listar: base ausente devolve lista vazia, booleano falso, sem criar diretorio
  FAIL - acao buscar: base ausente devolve lista vazia sem erro e sem criar diretorio
  FAIL - listarRejeicoes: dois arquivos gravados a mao voltam com conceito, titulo, apelidos e motivo
  FAIL - registrar: motivo com marca de implementado falha e nao cria a base
  FAIL - registrar: motivo com marca de adiamento falha e nao cria a base
  FAIL - registrar: palavra solta "depois" em prosa legitima nao produz recusa falsa
  FAIL - registrar: motivo estrutural cria a base e o arquivo
  FAIL - registrar: mesmo conceito duas vezes falha na segunda
  FAIL - registrar: campos obrigatorios ausentes falham citando os campos
  FAIL - alias: acrescentar dois apelidos grava os dois e preserva o corpo
  FAIL - alias: apelido repetido devolve zero acrescentados, sem erro
  FAIL - alias: conceito inexistente falha citando o conceito procurado
  FAIL - buscar: pedido que compartilha uma unica palavra com o conceito NAO casa
  FAIL - buscar: pedido que contem todos os tokens significativos do titulo casa
  FAIL - buscar: apelido de duas palavras casa em ordem trocada
  FAIL - buscar: forma contigua de apelido de uma palavra casa
  FAIL - buscar: resultado ordenado por pontuacao decrescente e cortado no limite
  FAIL - pergunta: traz as tres partes, semelhanca, motivo original e recomendacao com pergunta
  FAIL - pergunta: achado com gatilho de reabertura declarado traz o gatilho no texto
  FAIL - roteamento: memoria fora-de-escopo listar (base ausente) via CLI sai com codigo 0
  ok  - linha de comando: registrar recusado (marca de implementado) sai com codigo 1
  FAIL - linha de comando: registrar aprovado sai com codigo 0 e grava o arquivo

1 passed, 24 failed
EXIT=1
```

(O único `ok` do vermelho é coincidência: o stub também lança exceção para qualquer chamada, então o caso "registrar recusado" via CLI acerta o código de saída 1 por acidente, não por implementar a guarda real. Confirmado ao ler a mensagem de erro capturada nesse caso: `'Error: memoria-rejeicoes: ainda nao implementado'`, não a mensagem real da guarda.)

**Verde** (implementação real restaurada, idêntica à commitada em `76ec801`..`249b2e1`):

```
  ok  - normalizar: minusculas, sem acento, so letra/digito, espacos colapsados
  ok  - tokensSignificativos: descarta palavra vazia e token curto, sem repeticao
  ok  - listarRejeicoes: base ausente devolve lista vazia e nao cria diretorio
  ok  - acao listar: base ausente devolve lista vazia, booleano falso, sem criar diretorio
  ok  - acao buscar: base ausente devolve lista vazia sem erro e sem criar diretorio
  ok  - listarRejeicoes: dois arquivos gravados a mao voltam com conceito, titulo, apelidos e motivo
  ok  - registrar: motivo com marca de implementado falha e nao cria a base
  ok  - registrar: motivo com marca de adiamento falha e nao cria a base
  ok  - registrar: palavra solta "depois" em prosa legitima nao produz recusa falsa
  ok  - registrar: motivo estrutural cria a base e o arquivo
  ok  - registrar: mesmo conceito duas vezes falha na segunda
  ok  - registrar: campos obrigatorios ausentes falham citando os campos
  ok  - alias: acrescentar dois apelidos grava os dois e preserva o corpo
  ok  - alias: apelido repetido devolve zero acrescentados, sem erro
  ok  - alias: conceito inexistente falha citando o conceito procurado
  ok  - buscar: pedido que compartilha uma unica palavra com o conceito NAO casa
  ok  - buscar: pedido que contem todos os tokens significativos do titulo casa
  ok  - buscar: apelido de duas palavras casa em ordem trocada
  ok  - buscar: forma contigua de apelido de uma palavra casa
  ok  - buscar: resultado ordenado por pontuacao decrescente e cortado no limite
  ok  - pergunta: traz as tres partes, semelhanca, motivo original e recomendacao com pergunta
  ok  - pergunta: achado com gatilho de reabertura declarado traz o gatilho no texto
  ok  - roteamento: memoria fora-de-escopo listar (base ausente) via CLI sai com codigo 0
  ok  - linha de comando: registrar recusado (marca de implementado) sai com codigo 1
  ok  - linha de comando: registrar aprovado sai com codigo 0 e grava o arquivo

25 passed, 0 failed
EXIT=0
```

## Issues Encontrados

Nenhum.

## Coordenação com a wave 2 (planos 004 e 005)

- Só `up/bin/lib/memoria-rejeicoes.cjs` e seu teste foram criados. `up/bin/lib/memoria.cjs`, `up/bin/up-tools.cjs`, `.plano/STATE.md` e `.plano/ROADMAP.md` não foram tocados, conforme a regra de coordenação da wave.
- Durante a execução, `up/bin/lib/memoria-glossario.cjs`/`.test.cjs` e `up/bin/lib/memoria-termo.cjs`/`.test.cjs` apareceram no working tree (planos 004 e 005 rodando em paralelo no mesmo worktree). Nenhum deles foi lido, editado ou incluído em qualquer commit deste plano.
- `dirForaDeEscopo`, `garantirDir`, `lerFlag`, `lerFlags` (de `memoria.cjs`) e `generateSlugInternal`, `toPosixPath`, `escapeRegex` (de `core.cjs`) foram os únicos pontos de integração consumidos, todos já exportados pelo plano 002.

## Self-Check

- `up/bin/lib/memoria-rejeicoes.cjs` e `up/bin/lib/memoria-rejeicoes.test.cjs` existem: CONFIRMADO.
- Commits `76ec801`, `71c59e0`, `7186887`, `249b2e1`, `1ceae6f` existem no histórico da branch `up/fase-14-memoria-do-projeto`: CONFIRMADO (`git log --oneline` lista todos).
- Suite de teste: `node up/bin/lib/memoria-rejeicoes.test.cjs` → `25 passed, 0 failed`, código de saída 0: CONFIRMADO.
- Nenhum em-dash/en-dash nos dois arquivos escritos: CONFIRMADO (`grep -nP '[\x{2013}\x{2014}]' up/bin/lib/memoria-rejeicoes.cjs up/bin/lib/memoria-rejeicoes.test.cjs` → vazio).
- Nenhum `TBD` nos arquivos escritos: CONFIRMADO.
- `.plano/STATE.md` e `.plano/ROADMAP.md` não foram tocados por este plano: CONFIRMADO (nenhum commit meu os referencia).
- `up/bin/lib/memoria.cjs` e `up/bin/up-tools.cjs` não foram tocados por este plano: CONFIRMADO (nenhum commit meu os referencia; `git log --oneline --all -- up/bin/lib/memoria.cjs up/bin/up-tools.cjs` não traz hash `14-003`).
- Caso obrigatório do briefing ("painel de controle do usuário" não casa com "painel de métricas em tempo real") coberto por teste dedicado e passando: CONFIRMADO.

## Self-Check: PASSOU

## Critérios de Sucesso do Plano

- [x] A base é indexada por conceito de domínio, com apelidos declarados, e não por palavra-chave
- [x] Propor de novo um conceito recusado devolve o motivo original e uma pergunta pronta com recomendação e porquê
- [x] Item já implementado é recusado na entrada, com mensagem que aponta o lugar certo do registro
- [x] Motivo temporário é recusado na entrada, com mensagem que separa adiamento de rejeição
- [x] A palavra solta de tempo, em prosa legítima, não produz recusa falsa
- [x] Nenhum diretório é criado antes da primeira rejeição estrutural aceita
- [x] O teste foi visto falhar antes de passar

## FORA DE ESCOPO (herdado do plano, não feito, e não deveria ter sido)

- Roteador de memória, módulo de decisão ou arquivo de comandos de ferramentas: nenhum tocado.
- Glossário (planos 001 e 004): nenhum arquivo criado.
- Doutrina de quando consultar a base e em que ponto do brainstorm (plano 005): não escrita.
- População da base de rejeições deste repositório com conteúdo real: não feita, a fase entrega o mecanismo.
- Casamento por similaridade estatística, distância de edição ou embedding: não implementado, a regra é determinística.
- As duas listas fechadas de marca não foram ampliadas por conta própria.

## DECISOES ESCALADAS

Nenhuma.

## Next Phase Readiness

`memoria fora-de-escopo <listar|registrar|alias|buscar>` está pronto para uso imediato via
`node up/bin/up-tools.cjs memoria fora-de-escopo <acao> [flags]`. O plano 005 pode consumir `buscar` para
a doutrina de brainstorm sem qualquer mudança neste módulo. Nenhum bloqueio identificado.

---
*Phase: 14-memoria-do-projeto*
*Completed: 2026-07-26*
