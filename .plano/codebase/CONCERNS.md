# Preocupacoes do Codebase

**Data da Analise:** 2026-03-08

## Divida Tecnica

**Desalinhamento Critico de Nomes de Comandos entre Workflows e CLI:**
- Problema: Os workflows e agentes em `up/workflows/*.md` e `up/agents/*.md` invocam `up-tools.cjs` com nomes de init em ingles (`init execute-phase`, `init plan-phase`, `init new-project`, `init quick`, `init resume`), mas `up/bin/up-tools.cjs` so aceita nomes em portugues (`init executar-fase`, `init planejar-fase`, `init novo-projeto`, `init rapido`, `init retomar`). Todas essas invocacoes falharao com "Unknown init workflow".
- Arquivos afetados:
  - `up/workflows/executar-fase.md` (linha 15: `init execute-phase`)
  - `up/workflows/executar-plano.md` (linha 16: `init execute-phase`)
  - `up/workflows/novo-projeto.md` (linha 12: `init new-project`)
  - `up/workflows/planejar-fase.md` (linha 12: `init plan-phase`)
  - `up/workflows/rapido.md` (linha 37: `init quick`)
  - `up/workflows/retomar.md` (linha 19: `init resume`)
  - `up/workflows/discutir-fase.md` (linha 37: `init phase-op`)
  - `up/workflows/progresso.md` (linha 11: `init progress`)
  - `up/workflows/verificar-trabalho.md` (linha 21: `init verify-work`)
  - `up/agents/up-executor.md` (linha 36: `init execute-phase`)
  - `up/agents/up-planejador.md` (linha 244: `init plan-phase`)
  - CLI: `up/bin/up-tools.cjs` (linhas 94-114, switch `case 'init'`)
- Impacto: **Todos os workflows UP sao potencialmente quebrados na inicializacao.** O primeiro passo de cada workflow e carregar contexto via `init`, e todos falham porque usam nomes em ingles. Isso efetivamente quebra todo o sistema UP em producao.
- Abordagem de correcao: Adicionar aliases em ingles no switch de `init` em `up-tools.cjs`, ou renomear as invocacoes nos workflows para usar nomes em portugues. A abordagem de aliases e mais segura pois nao quebra nenhum uso existente.

**Comandos CLI Ausentes Referenciados por Workflows:**
- Problema: Tres comandos de topo e um subcomando sao chamados por workflows/agentes mas nao existem em `up/bin/up-tools.cjs`:
  1. `phase-plan-index` -- chamado em `up/workflows/executar-fase.md` (linha 37)
  2. `state-snapshot` -- chamado em `up/workflows/progresso.md` (linha 36)
  3. `summary-extract` -- chamado em `up/workflows/progresso.md` (linha 45)
  4. `state record-metric` -- chamado em `up/agents/up-executor.md` (linha 346)
- Arquivos: `up/bin/up-tools.cjs` (comandos ausentes), workflows/agentes listados acima
- Impacto: Workflows `executar-fase` e `progresso` falham em passos criticos. O agente executor falha ao registrar metricas. Esses comandos existem no GSD (`get-shit-done/bin/gsd-tools.cjs`) mas nunca foram portados para UP.
- Abordagem de correcao: Implementar os comandos ausentes em `up-tools.cjs`, portando a logica equivalente de `gsd-tools.cjs`.

**Duplicacao de Codigo entre Sistemas GSD e UP:**
- Problema: O repositorio mantem dois sistemas paralelos (GSD e UP) com logica compartilhada substancial duplicada em vez de compartilhada.
  - `get-shit-done/bin/lib/core.cjs` (492 linhas) vs `up/bin/lib/core.cjs` (270 linhas) -- mesma estrutura, UP e uma versao simplificada
  - GSD tem 5421 linhas de lib modular (`state.cjs`, `phase.cjs`, `roadmap.cjs`, `init.cjs`, `commands.cjs`) vs UP tem 1361 linhas em arquivo monolitico (`up-tools.cjs`)
  - `bin/install.js` (2464 linhas) vs `up/bin/install.js` (824 linhas) -- logica de instalacao similar duplicada
  - Hooks (`hooks/gsd-statusline.js` vs `up/hooks/up-statusline.js`) -- quase identicos exceto comentarios
- Arquivos: Todos os pares listados acima
- Impacto: Correcoes de bugs em um sistema nao propagam para o outro. Novas features precisam ser implementadas duas vezes. A base de codigo cresce desnecessariamente.
- Abordagem de correcao: Extrair utilidades compartilhadas para um modulo `shared/` com funcoes parametrizadas por nome do sistema (`.planning` vs `.plano`, `gsd-` vs `up-`). Alternativa: se UP substitui GSD, deprecar e remover GSD.

**Arquivos Duplicados entre Raiz e `up/` com Divergencia:**
- Problema: Agentes UP existem em dois locais: `agents/up-*.md` (raiz, para desenvolvimento) e `up/agents/up-*.md` (empacotado para npm). Sete dos oito agentes divergem, embora a maioria das diferencas sejam triviais (trailing newline, `.planning` vs `.plano`).
  - `agents/up-depurador.md` tem 7 referencias a `.planning/debug` que deveriam ser `.plano/debug`
  - `agents/up-executor.md`, `up-planejador.md`, `up-roteirista.md`, `up-sintetizador.md`, `up-verificador.md` -- diferencas apenas de trailing newline
  - `commands/up/ajuda.md` diverge de `up/commands/ajuda.md`
  - `commands/up/mapear-codigo.md` **nao existe** na raiz (apenas em `up/commands/`)
  - `agents/up-mapeador-codigo.md` **nao existe** na raiz (apenas em `up/agents/`)
- Arquivos: `agents/up-*.md`, `up/agents/up-*.md`, `commands/up/`, `up/commands/`
- Impacto: Confusao sobre qual e a fonte canonica. Desenvolvedores podem editar a copia errada. O comando `mapear-codigo` e o agente `up-mapeador-codigo` so existem em `up/`, quebrando a convencao.
- Abordagem de correcao: Estabelecer `up/` como fonte canonica. Remover copias na raiz ou gerar copias na raiz automaticamente via script de build. Adicionar `mapear-codigo.md` e `up-mapeador-codigo.md` a raiz para consistencia.

**Arquivo Monolitico up-tools.cjs (1361 linhas):**
- Problema: Toda logica CLI do UP esta em um unico arquivo `up/bin/up-tools.cjs` em vez de modulos separados como GSD (`state.cjs`, `phase.cjs`, `roadmap.cjs`, etc.).
- Arquivos: `up/bin/up-tools.cjs`
- Impacto: Dificulta navegacao, manutencao e teste de funcionalidades individuais. O acoplamento interno torna refatoracao arriscada.
- Abordagem de correcao: Dividir em modulos como GSD: `up/bin/lib/state.cjs`, `up/bin/lib/phase.cjs`, `up/bin/lib/roadmap.cjs`, `up/bin/lib/init.cjs`. Manter `up-tools.cjs` como router fino.

## Bugs Conhecidos

**Referencia Incorreta `.planning` no agente depurador da raiz:**
- Sintomas: O agente `agents/up-depurador.md` na raiz usa caminhos `.planning/debug` em vez de `.plano/debug`. O debug criara e buscara arquivos no diretorio errado.
- Arquivos: `agents/up-depurador.md` (linhas 160-161, 229, 271, 284, 303, 327)
- Gatilho: Invocar o agente depurador em um projeto UP -- ele tentara ler/escrever em `.planning/debug/` que nao existe.

**Referencia Incorreta `.plano/phases/` no git-integration.md:**
- Sintomas: A referencia `up/references/git-integration.md` usa `.plano/phases/` em vez de `.plano/fases/` nos caminhos de commit e summary.
- Arquivos: `up/references/git-integration.md` (linhas 125, 131)
- Gatilho: Agentes que referenciam este documento para padroes de commit usarao caminhos incorretos.

## Consideracoes de Seguranca

**Construcao de Comandos Shell com Concatenacao de String:**
- Risco: `up/bin/lib/core.cjs` constroi comandos git via concatenacao de string (`'git ' + escaped.join(' ')`) passados para `execSync()`. Embora haja sanitizacao basica no `execGit()` (escapando argumentos que contem caracteres especiais), a funcao `isGitIgnored()` usa concatenacao direta com apenas `replace(/[^a-zA-Z0-9._\-/]/g, '')`.
- Arquivos: `up/bin/lib/core.cjs` (linhas 77, 93)
- Mitigacao atual: `execGit()` escapa argumentos com single quotes e filtra caracteres perigosos. `isGitIgnored()` remove caracteres nao-alfanumericos. O risco e baixo porque inputs sao tipicamente caminhos de arquivo gerados pelo sistema, nao input do usuario direto.

**Comando `find` com `execSync` sem sanitizacao de `cwd`:**
- Risco: `cmdInitNovoProjeto()` em `up/bin/up-tools.cjs` (linhas 322-328) executa um comando `find` via `execSync` com o `cwd` como diretorio de trabalho. Se `cwd` contiver caracteres especiais no nome, o comando pode se comportar inesperadamente.
- Arquivos: `up/bin/up-tools.cjs` (linhas 322-328)
- Mitigacao atual: O `cwd` e passado como opcao do `execSync` (nao interpolado na string de comando), o que mitiga injection. Risco baixo.

**Installer Sobrescreve `settings.json` Incondicionalmente:**
- Risco: `up/bin/install.js` (linha 686) sobrescreve `settings.statusLine` sem preservar configuracao pre-existente do usuario. Se o usuario tinha um statusLine customizado, ele e perdido.
- Arquivos: `up/bin/install.js` (linhas 686, 710)
- Mitigacao atual: Nenhuma. O installer deveria verificar se ja existe um statusLine e pedir confirmacao ou criar backup.

## Gargalos de Performance

**Leituras Sincronas Multiplas de Arquivos no up-tools.cjs:**
- Problema: Varias funcoes leem o mesmo arquivo (`STATE.md`, `ROADMAP.md`) multiplas vezes em uma unica invocacao. `cmdPhaseComplete()` le `ROADMAP.md` ate 3 vezes e `STATE.md` 2 vezes.
- Arquivos: `up/bin/up-tools.cjs` (funcoes `cmdPhaseComplete`, `cmdRoadmapAnalyze`, `cmdStateUpdateProgress`)
- Causa: Cada funcao le independentemente sem cache. Como o CLI processa uma invocacao e sai, o impacto e minimo per-call, mas workflows chamam `up-tools.cjs` multiplas vezes em sequencia.

**Hook statusline faz I/O sincronas a cada chamada:**
- Problema: `up/hooks/up-statusline.js` le o diretorio `todos/`, faz `statSync` em cada arquivo, le o conteudo JSON, e escreve um bridge file -- tudo sincronamente a cada tool use.
- Arquivos: `up/hooks/up-statusline.js` (linhas 63-78)
- Causa: Design original nao otimizado. Guard timeout de 3s mitiga hang, mas o overhead de I/O sincronas se acumula.

## Areas Frageis

**Parsing de Markdown via Regex em up-tools.cjs:**
- Arquivos: `up/bin/up-tools.cjs` (funcoes `stateExtractField`, `stateReplaceField`, `cmdRoadmapGetPhase`, `cmdRoadmapAnalyze`, `cmdPhaseComplete`, `cmdRoadmapUpdatePlanProgress`)
- Por que fragil: Toda manipulacao de `STATE.md` e `ROADMAP.md` depende de regex que esperam formatacao markdown especifica (ex: `**Field:** value`, `### Phase N: Name`). Se o usuario editar manualmente e alterar a formatacao (ex: remover bold, mudar nivel de heading), as funcoes silenciosamente falham ou retornam null/false.
- Cobertura de testes: **Zero testes para UP.** GSD tem 15 arquivos de teste, mas nenhum testa `up-tools.cjs` ou `up/bin/lib/core.cjs`. Os testes GSD validam logica similar em `gsd-tools.cjs`, mas divergencias no port para UP podem introduzir bugs nao cobertos.

**Sistema de Bridges entre Hooks via Arquivo Temporario:**
- Arquivos: `up/hooks/up-statusline.js` (linhas 31-41), `up/hooks/up-context-monitor.js` (linhas 30-36)
- Por que fragil: O statusline escreve metricas de contexto em `/tmp/claude-ctx-{session}.json`, e o context-monitor le esse arquivo. Se o arquivo estiver corrompido, stale (>60s), ou com race condition (escrita parcial), o monitor silenciosamente ignora -- mas isso tambem significa que avisos criticos de contexto podem ser perdidos sem indicacao.
- Cobertura de testes: Nenhum teste para hooks.

**Regex de Renumeracao de Fases:**
- Arquivos: `up/bin/up-tools.cjs` (funcao `cmdPhaseRemove`, linhas 960-973)
- Por que fragil: A renumeracao de fases apos remocao itera de 99 ate `removedInt` fazendo regex replace global em todo o ROADMAP.md. Isso pode causar substituicoes colaterais se numeros de fase aparecerem em outros contextos (ex: "Phase 5 depende de Phase 4" -- ao remover Phase 3, ambos sao renumerados por regexes separados, com risco de colisao intermediaria).
- Cobertura de testes: Coberta nos testes GSD (`tests/phase.test.cjs`), mas UP nao executa esses testes.

## Lacunas de Cobertura de Teste

**Nenhum Teste para Sistema UP:**
- O que nao e testado: Todo o sistema UP -- `up/bin/up-tools.cjs` (1361 linhas), `up/bin/lib/core.cjs` (270 linhas), `up/bin/install.js` (824 linhas), `up/hooks/up-statusline.js` (89 linhas), `up/hooks/up-context-monitor.js` (113 linhas).
- Arquivos: Todos em `up/bin/`, `up/hooks/`
- Risco: Bugs podem ser introduzidos a cada mudanca sem deteccao. O desalinhamento critico de nomes de comandos (init ingles vs portugues) teria sido detectado por testes basicos de integracao.
- Prioridade: **Alta** -- Este e o problema mais impactante. O UP e publicado no npm e instalado por usuarios, mas nao tem nenhum teste automatizado.

**Testes GSD Nao Validam Compatibilidade com UP:**
- O que nao e testado: Os 15 arquivos de teste em `tests/` testam apenas `gsd-tools.cjs` e bibliotecas GSD. Nao testam `up-tools.cjs` mesmo que compartilhe logica similar.
- Arquivos: `tests/*.test.cjs`
- Risco: Divergencias no port de GSD para UP passam despercebidas. Bug fixes aplicados em GSD e testados nao sao verificados em UP.
- Prioridade: **Alta**

**Installer Sem Testes:**
- O que nao e testado: `up/bin/install.js` -- conversao de frontmatter, substituicao de caminhos, conversao Gemini TOML, flatten de comandos OpenCode, limpeza de settings.json.
- Arquivos: `up/bin/install.js` (824 linhas)
- Risco: Instalacao pode falhar silenciosamente ou gerar arquivos malformados para Gemini/OpenCode. A funcao `convertAgentToGemini()` e `convertAgentToOpencode()` manipulam YAML com string parsing em vez de parser YAML, o que e fragil.
- Prioridade: **Media** -- GSD installer (`bin/install.js`) tem testes parciais em `tests/codex-config.test.cjs` e `tests/agent-frontmatter.test.cjs`, mas o UP installer e completamente separado.

**Hooks Sem Testes:**
- O que nao e testado: Logica de calculo de contexto, debounce de avisos, bridge file I/O, edge cases (stdin timeout, JSON malformado, arquivo bridge stale).
- Arquivos: `up/hooks/up-statusline.js`, `up/hooks/up-context-monitor.js`
- Risco: Baixo individualmente (hooks sao best-effort), mas um bug no context monitor pode fazer o usuario perder contexto sem aviso.
- Prioridade: **Baixa**

**npm package.json Sem Scripts de Teste:**
- O que nao e testado: `up/package.json` nao tem campo `scripts` -- nao ha `test`, `lint`, ou `prepublishOnly`. Nao ha nenhuma barreira de qualidade antes de `npm publish`.
- Arquivos: `up/package.json`
- Risco: Versoes quebradas podem ser publicadas no npm sem verificacao.
- Prioridade: **Alta**

## Inconsistencias de Linguagem

**Mistura de Ingles e Portugues nos Caminhos e Comandos Internos:**
- Problema: O UP se propoe a ser "em portugues", mas internamente mistura idiomas de forma inconsistente:
  - CLI `up-tools.cjs`: init aceita apenas nomes PT (`planejar-fase`, `executar-fase`)
  - Workflows: invocam com nomes EN (`plan-phase`, `execute-phase`)
  - Diretorios: `.plano/fases/` (PT) mas `up/references/git-integration.md` usa `.plano/phases/` (EN)
  - Chaves JSON nos retornos: `phase_found`, `plan_count`, `commit_docs` (todos em ingles)
  - Nomes de funcoes: `cmdInitPlanejarFase`, `cmdPhaseFind`, `cmdRoadmapAnalyze` (mistura PT e EN)
- Arquivos: `up/bin/up-tools.cjs`, `up/workflows/*.md`, `up/agents/*.md`, `up/bin/lib/core.cjs`
- Impacto: Confusao para desenvolvedores, dificuldade em prever se um comando usa PT ou EN. O desalinhamento critico de init e consequencia direta desta inconsistencia.
- Abordagem de correcao: Padronizar: user-facing em PT, internals em EN (ou vice-versa). Adicionar aliases para aceitar ambos.

## Catch Blocks Vazios

**Erros Silenciados Excessivamente:**
- Problema: `up/bin/up-tools.cjs` contem 10 blocos `catch {}` vazios que silenciam erros completamente, sem logging ou fallback explicito. Isso dificulta debugging quando algo falha.
- Arquivos: `up/bin/up-tools.cjs` (linhas 282, 328, 357, 399, 684, 890, 942, 1072, 1088, 1299)
- Impacto: Erros de I/O, permissao, ou parsing sao ignorados silenciosamente. Funcoes retornam valores default sem indicar que algo falhou.
- Abordagem de correcao: Pelo menos logar para stderr em modo debug, ou retornar um campo `warnings` no output JSON indicando falhas parciais.
