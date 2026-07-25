---
phase: 14-memoria-do-projeto
plan: 002
subsystem: cli-tools
tags: [memoria, decisao, gate, numeracao-deterministica, cli, tdd]
dependency_graph:
  requires: []
  provides:
    - "up/bin/lib/memoria.cjs: roteador do comando `memoria` com os quatro submodulos declarados (decisao, fora-de-escopo, glossario, termo) e os helpers compartilhados (caminhos, garantirDir, lerFlag/lerFlags, contarPalavras)"
    - "up/bin/lib/memoria-decisao.cjs: registro de decisao deterministico (numeracao por varredura, gate das tres condicoes, criacao preguicosa, mudanca de status)"
    - "case 'memoria' em up/bin/up-tools.cjs, delegando para o roteador"
  affects:
    - "14-memoria-do-projeto/003-PLAN.md (dono do submodulo fora-de-escopo, so precisa criar memoria-rejeicoes.cjs)"
    - "14-memoria-do-projeto/004-PLAN.md (dono do submodulo glossario, so precisa criar memoria-glossario.cjs)"
    - "14-memoria-do-projeto/005-PLAN.md (dono do submodulo termo, so precisa criar memoria-termo.cjs; tambem consome dirDecisoes/lerFlag para a doutrina de quando chamar estes comandos)"
tech_stack:
  added: []
  patterns:
    - "Roteador de subcomando com submodulos declarados de uma vez em um mapa nome -> caminho relativo, require carregado dentro do case (nao no topo), e falha de carga convertida em erro fatal legivel (mesmo padrao do case 'multica')"
    - "Criacao preguicosa de diretorio: uma unica funcao (garantirDir) autorizada a criar, chamada so depois que toda regra de admissao passou"
    - "Numeracao deterministica por varredura de diretorio (nunca contador persistido em arquivo)"
    - "Frontmatter simples linha-a-linha (chave: valor, sem YAML real) para os registros de decisao, alterado por regex pontual (so as linhas de status/substituida_por) preservando o resto do arquivo byte a byte"
key_files:
  created:
    - "up/bin/lib/memoria.cjs"
    - "up/bin/lib/memoria-decisao.cjs"
    - "up/bin/lib/memoria-decisao.test.cjs"
  modified:
    - "up/bin/up-tools.cjs"
decisions:
  - "Submodulos declarados (fora-de-escopo, glossario, termo) apontam para arquivos que ainda nao existem neste ciclo; memoria.cjs converte a falha de require em 'submodulo ainda nao esta instalado neste pacote', nao em rastro de pilha, exatamente como a tarefa 1 exige."
  - "Gate das tres condicoes e a checagem de campos de conteudo obrigatorios (titulo/contexto/decisao/motivo) foram tratados como duas checagens distintas: a primeira falta bloqueia antes mesmo de avaliar o gate, para a mensagem de erro nao confundir 'faltou preencher' com 'faltou justificar o suficiente'."
  - "Separador de alternativa usa `indexOf('::')` em vez de `split('::')`, para o texto do motivo poder conter dois-pontos sem quebrar o parsing."
requirements-completed: [MEM-05, MEM-06, MEM-07, MEM-08]
metrics:
  duration: "~50min"
  completed: "2026-07-25"
---

# Fase 14 Plano 002: Registro de decisão determinístico Summary

**Comando `memoria decisao` completo (proximo-numero, listar, criar, status) com gate de três condições em E lógico, numeração por varredura de diretório e criação preguiçosa; espaço de comando `memoria` aberto com os quatro submódulos reservados para os planos 003, 004 e 005.**

## Performance

- **Tarefas:** 6/6 completas
- **Commits:** 7 (6 de tarefa + 1 de correção de estilo, nenhum de metadados por instrução explícita de não tocar STATE/ROADMAP)
- **Arquivos:** 3 criados, 1 modificado (786 inserções, 1 remoção)

## Realizações

- `memoria.cjs` roteia `decisao|fora-de-escopo|glossario|termo`, com os três últimos declarados mas ainda não instalados neste ciclo (erro legível, sem rastro de pilha, quando chamados).
- `memoria-decisao.cjs criar` só grava quando `dificil-reverter`, `surpreendente` e `trade-off` estão todos justificados com pelo menos três palavras (gate conjuntivo, coleta todas as faltas antes de recusar) **e** há pelo menos uma `--alternativa "nome :: motivo"`. Faltando qualquer coisa, nada é escrito, nem o diretório `.plano/decisoes/` é criado.
- Numeração sempre pela maior existente mais um, varrendo o diretório a cada chamada; buraco na sequência não é preenchido.
- `status` muda `proposta`/`aceita`/`substituida` (a última exige `--substituida-por` apontando para registro existente), reescrevendo só as duas linhas do frontmatter e preservando o resto do arquivo byte a byte.
- 25 casos de teste sem framework, com prova vermelho (8 passed, 17 failed, revertendo a implementação ao estado pós-tarefa-2) e verde (25 passed, 0 failed, restaurado) documentada abaixo.

## Task Commits

Cada tarefa foi commitada atomicamente na branch `up/fase-14-memoria-do-projeto`:

1. **Tarefa 1: roteador `memoria.cjs` com os quatro submódulos** - `65d6b5c` (feat)
2. **Tarefa 2: numeração determinística e listagem** - `78996e2` (feat)
3. **Tarefa 3: ação `criar` com o gate das três condições** - `fe923cb` (feat)
4. **Tarefa 4: ação `status`** - `4bcc9ac` (feat)
5. **Tarefa 5: liga `memoria` ao despachante `up-tools.cjs`** - `fb872bd` (feat)
6. **Tarefa 6: teste vermelho-verde** - `4f143f1` (test)
7. **Correção pós-tarefa 6: remoção de em-dash dos comentários** - `a11a772` (fix, achado durante o self-check, ver Desvios)

## Files Created/Modified

- `up/bin/lib/memoria.cjs` - roteador do comando `memoria`, mapa dos quatro submódulos, helpers `dirPlano`/`dirDecisoes`/`dirForaDeEscopo`/`arquivoGlossarioProjeto`/`garantirDir`/`lerFlag`/`lerFlags`/`contarPalavras`
- `up/bin/lib/memoria-decisao.cjs` - `listarRegistros`, `proximoNumero`, `formatarNumero`, `encontrarRegistro`, `extrairFrontmatterSimples`, `criar`, `mudarStatus`, `run`
- `up/bin/lib/memoria-decisao.test.cjs` - 25 casos sem framework
- `up/bin/up-tools.cjs` - linha nova no bloco de uso, `case 'memoria'` (logo após `case 'multica'`), entrada `memoria` na mensagem de uso sem comando. Nenhum case existente foi tocado.

## Decisions Made

Ver `decisions` no frontmatter. Resumo: (1) submódulos ainda não implementados falham com mensagem legível, não stack trace; (2) campos de conteúdo obrigatórios são checados antes do gate, para a mensagem de erro não confundir as duas causas; (3) o separador `::` da alternativa usa `indexOf` para permitir dois-pontos no texto do motivo.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 3 - Bloqueante] Em-dash nos comentários dos três arquivos novos**
- **Encontrado durante:** self-check após a tarefa 6, ao rodar `grep -nP '[\x{2013}\x{2014}]'` contra tudo que eu tinha escrito (regra inviolável do CLAUDE.md do projeto).
- **Issue:** 6 ocorrências de em-dash (`—`) em comentários de cabeçalho e um comentário de passo, em `memoria.cjs`, `memoria-decisao.cjs` e `memoria-decisao.test.cjs`. Nenhuma em `up-tools.cjs` (conferido linha a linha no diff da tarefa 5: as três linhas que acrescentei não têm dash nenhum).
- **Correção:** trocado por dois-pontos ou ponto final com nova frase, conforme o caso. Sem mudança de comportamento.
- **Verificação:** `grep -nP '[\x{2013}\x{2014}]' up/bin/lib/memoria.cjs up/bin/lib/memoria-decisao.cjs up/bin/lib/memoria-decisao.test.cjs` → vazio. Suite continuou 25 passed, 0 failed depois da troca.
- **Arquivos modificados:** `up/bin/lib/memoria.cjs`, `up/bin/lib/memoria-decisao.cjs`, `up/bin/lib/memoria-decisao.test.cjs`
- **Commit:** `a11a772`

Nenhum outro desvio. O plano foi executado exatamente como escrito em todo o resto: mesmos nomes de ação, mesmas flags, mesmo formato de arquivo, mesma ordem de seções.

## Provas rodadas (automated + vermelho/verde)

### Tarefa 1: `<aceite>` (nome desconhecido e submódulo ainda não instalado)

```
$ node up/bin/up-tools.cjs memoria
Error: Submodulo de memoria desconhecido: "". Disponiveis: decisao, fora-de-escopo, glossario, termo.
exit=1

$ node up/bin/up-tools.cjs memoria glossario listar
Error: O submodulo "glossario" ainda nao esta instalado neste pacote.
exit=1
```

### Tarefa 5: smoke pedido no `<prova>`

```
$ node up/bin/up-tools.cjs state load --raw   (ver aviso abaixo)
{ "config": {...}, "state_raw": "..." }   # imprime, mas ver nota de aviso apurado

$ node up/bin/up-tools.cjs phase-plan-index 14
{ "phase": "14", "plans": [ {"id":"001", "wave":1, ...}, {"id":"002", ...} ] }

$ node up/bin/up-tools.cjs memoria decisao proximo-numero
{
  "proximo": "0001",
  "existentes": [],
  "diretorio_existe": false
}
```

Todos os comandos pré-existentes seguem respondendo: `config get commit_docs` → `true`; `github status` →
JSON válido; comando desconhecido → `Error: Unknown command: bogus-command`, código 1.

### Tarefa 6: vermelho antes do verde

**Vermelho** (arquivo `memoria-decisao.cjs` temporariamente revertido, via `git show`, ao estado logo após a
tarefa 2, ou seja: sem `criar` nem `mudarStatus`):

```
  ok  - proximo-numero: diretorio ausente devolve 1 e nao cria nada
  ok  - proximo-numero: sequencia 1, 2 e 7 devolve 8 (buraco nao preenchido)
  FAIL - dois registros criados em sequencia recebem numeros distintos e crescentes
      decisao.criar is not a function
  ok  - listar: diretorio ausente devolve lista vazia
  FAIL - gate: falta dificil-reverter falha e nao cria diretorio
  FAIL - gate: falta surpreendente falha e nao cria diretorio
  FAIL - gate: falta trade-off falha e nao cria diretorio
  FAIL - gate: justificativa com menos de tres palavras falha
  FAIL - gate: mensagem nomeia as duas condicoes quando faltam duas de uma vez
  FAIL - alternativas: sem nenhuma alternativa falha
  FAIL - alternativas: ocorrencia fora do formato falha citando a ocorrencia
  FAIL - status invalido na criacao (substituida) falha
  FAIL - criar: chamada completa cria arquivo com as cinco secoes e uma linha por alternativa
  FAIL - criar: campo de fase so aparece no frontmatter quando a flag foi passada
  FAIL - status: muda para proposta e depois para aceita
  FAIL - status: substituida sem substituidor falha
  FAIL - status: substituidor inexistente falha
  FAIL - status: substituidor valido grava status e substituida_por, preservando o corpo
  FAIL - status: registro inexistente falha citando o numero procurado
  ok  - roteamento: submodulo desconhecido falha com codigo de saida 1
  ok  - roteamento: submodulo declarado mas ainda nao instalado falha com mensagem legivel
  ok  - roteamento: memoria sem submodulo falha listando os quatro nomes
  ok  - linha de comando: proximo-numero aprovado sai com codigo 0
  ok  - linha de comando: criar reprovado (sem gate) sai com codigo 1
  FAIL - linha de comando: criar aprovado sai com codigo 0 e grava o arquivo

8 passed, 17 failed
EXIT=1
```

**Verde** (arquivo restaurado à implementação completa das tarefas 3 e 4; `git diff --stat` confirmou
restauração byte a byte, sem diferença nenhuma):

```
  ok  - proximo-numero: diretorio ausente devolve 1 e nao cria nada
  ok  - proximo-numero: sequencia 1, 2 e 7 devolve 8 (buraco nao preenchido)
  ok  - dois registros criados em sequencia recebem numeros distintos e crescentes
  ok  - listar: diretorio ausente devolve lista vazia
  ok  - gate: falta dificil-reverter falha e nao cria diretorio
  ok  - gate: falta surpreendente falha e nao cria diretorio
  ok  - gate: falta trade-off falha e nao cria diretorio
  ok  - gate: justificativa com menos de tres palavras falha
  ok  - gate: mensagem nomeia as duas condicoes quando faltam duas de uma vez
  ok  - alternativas: sem nenhuma alternativa falha
  ok  - alternativas: ocorrencia fora do formato falha citando a ocorrencia
  ok  - status invalido na criacao (substituida) falha
  ok  - criar: chamada completa cria arquivo com as cinco secoes e uma linha por alternativa
  ok  - criar: campo de fase so aparece no frontmatter quando a flag foi passada
  ok  - status: muda para proposta e depois para aceita
  ok  - status: substituida sem substituidor falha
  ok  - status: substituidor inexistente falha
  ok  - status: substituidor valido grava status e substituida_por, preservando o corpo
  ok  - status: registro inexistente falha citando o numero procurado
  ok  - roteamento: submodulo desconhecido falha com codigo de saida 1
  ok  - roteamento: submodulo declarado mas ainda nao instalado falha com mensagem legivel
  ok  - roteamento: memoria sem submodulo falha listando os quatro nomes
  ok  - linha de comando: proximo-numero aprovado sai com codigo 0
  ok  - linha de comando: criar reprovado (sem gate) sai com codigo 1
  ok  - linha de comando: criar aprovado sai com codigo 0 e grava o arquivo

25 passed, 0 failed
EXIT=0
```

## Avisos apurados (não corrigidos, fora de escopo, conforme instrução recebida)

- `state load --raw` e os demais cinco comandos `state *` (e `requirements mark-complete`) do produto
  rodam sem erro mas não escrevem/leem no formato real dos arquivos `.plano/` desta v2. Verificado ao vivo
  neste repositório: `node up/bin/up-tools.cjs state advance-plan --raw` devolveu
  `{"error":"Cannot parse Current Plan or Total Plans in Phase from STATE.md"}` (saída limpa, sem crash,
  mas também sem gravar nada). Confirma o aviso recebido; não é bug introduzido por este plano e é da
  fase 17, não desta.
- Os dois defeitos conhecidos do `up-tools.cjs` (filtro de nome de plano cego para uma convenção, e
  `parseInt(fm.wave) || 1` promovendo onda 0 a onda 1) não foram tocados nem replicados no código novo:
  `memoria.cjs`/`memoria-decisao.cjs` não fazem parsing de nome de plano nem de onda.

## Issues Encontrados

Nenhum, além do em-dash documentado acima (achado pelo próprio self-check, corrigido na hora).

## Coordenação com a wave 2 (planos 003, 004, 005)

- `SUBMODULOS` em `memoria.cjs` já reserva as quatro entradas (`decisao`, `fora-de-escopo`, `glossario`,
  `termo`), cada uma apontando para um arquivo próprio (`./memoria-rejeicoes.cjs`,
  `./memoria-glossario.cjs`, `./memoria-termo.cjs`) que ainda não existe. Os planos 003/004/005 só
  precisam criar o arquivo correspondente exportando `run(cwd, args)` que devolve `{ result, resumo }` ou
  lança `Error` com mensagem em português. Nenhum deles precisa tocar em `memoria.cjs` nem em
  `up-tools.cjs`.
- `dirDecisoes`, `dirForaDeEscopo`, `arquivoGlossarioProjeto`, `garantirDir`, `lerFlag`, `lerFlags` e
  `contarPalavras` estão exportados por `memoria.cjs` e prontos para os três submódulos seguintes
  reaproveitarem (é assim que `memoria-decisao.cjs` já os usa).

## Self-Check

- `up/bin/lib/memoria.cjs`, `up/bin/lib/memoria-decisao.cjs`, `up/bin/lib/memoria-decisao.test.cjs`,
  `up/bin/up-tools.cjs` existem: CONFIRMADO.
- Commits `65d6b5c`, `78996e2`, `fe923cb`, `4bcc9ac`, `fb872bd`, `4f143f1`, `a11a772` existem no histórico
  da branch `up/fase-14-memoria-do-projeto`: CONFIRMADO (`git log --oneline --all | grep <hash>` para cada
  um).
- Suite de teste: `node up/bin/lib/memoria-decisao.test.cjs` → `25 passed, 0 failed`, código de saída 0:
  CONFIRMADO.
- Nenhum em-dash/en-dash nos arquivos escritos por este plano: CONFIRMADO
  (`grep -nP '[\x{2013}\x{2014}]' up/bin/lib/memoria.cjs up/bin/lib/memoria-decisao.cjs up/bin/lib/memoria-decisao.test.cjs`
  → vazio; as ocorrências pré-existentes em `up-tools.cjs` não foram tocadas por mim, confirmado linha a
  linha no diff da tarefa 5).
- Nenhum `TBD` nos arquivos escritos: CONFIRMADO.
- `.plano/STATE.md` e `.plano/ROADMAP.md` não foram tocados por este plano: CONFIRMADO
  (`git show --stat 65d6b5c..a11a772 -- .plano/STATE.md .plano/ROADMAP.md` → vazio).
- Nenhum arquivo fora de `up/bin/lib/memoria.cjs`, `up/bin/lib/memoria-decisao.cjs`,
  `up/bin/lib/memoria-decisao.test.cjs`, `up/bin/up-tools.cjs` foi staged ou commitado por mim
  (`up/bin/install.js`, do plano 001 rodando em paralelo, ficou modificado no working tree mas nunca foi
  adicionado por nenhum dos meus commits): CONFIRMADO.

## Self-Check: PASSOU

## Critérios de Sucesso do Plano

- [x] O gate das três condições é conjuntivo e mecânico, e faltar uma impede a escrita
- [x] A numeração sai de varredura do diretório, é crescente e não reaproveita buraco
- [x] O registro contém título, contexto, decisão, motivo e alternativas rejeitadas com motivo por alternativa
- [x] O status aceita proposta, aceita e substituída por outro registro
- [x] Nenhum diretório é criado antes de existir conteúdo real aprovado no gate
- [x] O espaço de comando `memoria` está aberto com os três submódulos declarados e erro legível para o que ainda não existe
- [x] O teste foi visto falhar antes de passar

## FORA DE ESCOPO (herdado do plano, não feito, e não deveria ter sido)

- Base de rejeições (`fora-de-escopo`, plano 003), glossário interno e do projeto (`glossario`, plano 004),
  doutrina de quando chamar estes comandos (plano 005): nenhum arquivo desses submódulos foi criado.
- Migração das decisões que hoje moram nas tabelas de STATE.md/PROJECT.md: não tocada.
- Nenhum registro de decisão real foi criado neste repositório (a fase decide o mecanismo, não popula a base).
- Nenhum subcomando existente da CLI foi alterado.

## DECISOES ESCALADAS

Nenhuma.

## Next Phase Readiness

O espaço de comando `memoria` e o submódulo `decisao` estão prontos para uso imediato via
`node up/bin/up-tools.cjs memoria decisao <proximo-numero|listar|criar|status> [flags]`. Os planos 003, 004
e 005 (wave 2 desta fase) podem começar em paralelo sem editar `memoria.cjs` nem `up-tools.cjs`: cada um só
cria o arquivo do próprio submódulo. Nenhum bloqueio identificado.

---
*Phase: 14-memoria-do-projeto*
*Completed: 2026-07-25*
