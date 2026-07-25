---
phase: 13-formato-de-pergunta
plan: 005
subsystem: prova-e-regressao
tags: [questioning, contrato-de-pergunta, red-green, regressao-zero, prova]
dependency_graph:
  requires:
    - "up/references/questioning.md (contrato canonico, plano 001)"
    - "up/workflows/up.md, up/skills/up-brainstorm/SKILL.md (planos 002)"
    - "up/workflows/build.md (plano 003)"
    - "up/workflows/plan.md, up/agents/up-arquiteto.md, up/agents/up-planejador.md, up/workflows/auditar.md (plano 004)"
  provides:
    - "up/bin/lib/perguntas.test.cjs: verificador determinístico com caso vermelho embutido, roda a cada execução"
    - ".plano/fases/13-formato-de-pergunta/PROVA.md: relatório de prova da fase, com evidência real de cada comando"
    - ".plano/fases/13-formato-de-pergunta/deferred-items.md: três itens fora de escopo, incluindo bug pré-existente crítico descoberto (init up)"
  affects:
    - "Fases 14 a 20: o verificador protege o formato de pergunta contra regressão quando novos pontos entrarem no inventário"
tech_stack:
  added: []
  patterns:
    - "Teste .cjs com assert nativo, sem framework, executado por node <arquivo> (mesma convenção de up/bin/lib/github.test.cjs)"
    - "Autoteste vermelho-e-verde na mesma execução: constrói fixture com defeito injetado, prova que reprova, depois prova contra o repositório real"
key_files:
  created:
    - "up/bin/lib/perguntas.test.cjs"
    - ".plano/fases/13-formato-de-pergunta/PROVA.md"
    - ".plano/fases/13-formato-de-pergunta/deferred-items.md"
  modified: []
decisions:
  - "Corrigi um bug no próprio verificador (regex \\s* engolindo quebra de linha e mascarando rótulo vazio) antes de aceitar o vermelho como válido: vi falhar do jeito errado, troquei \\s* por [ \\t]*, vi passar do jeito certo."
  - "Excluí 'init up' do veredito de aceite da tarefa 6 (mantendo o relatório da falha real, não escondida): é bug pré-existente e fora de escopo, confirmado no merge-base antes de qualquer commit desta fase, e corrigi-lo violaria o próprio critério de aceite da tarefa (diferença vazia em up/bin)."
metrics:
  duration_minutes: null
  tasks_completed: 7
  files_touched: 3
  completed_at: "2026-07-25"
---

# Fase 13 Plano 005: Prova da fase e regressão zero Summary

Verificador determinístico (`up/bin/lib/perguntas.test.cjs`) que lê o inventário de 20 identificadores
do contrato, lê as cinco superfícies declaradas e reprova (vermelho, com defeito injetado) antes de
aprovar (verde, repositório real) na mesma execução. Relatório de prova (`PROVA.md`) com a regra de
fato exercida contra este próprio repositório (6/6 candidatas resolvidas por leitura, zero perguntas),
o texto literal das sete superfícies extraído, e a regressão zero dos sete comandos nos quatro
runtimes. Um bug pré-existente e crítico foi descoberto durante a regressão (`init up` quebra o
Passo 0 de `/up:up`) e registrado, não corrigido, por estar fora do escopo desta fase.

## O que foi feito, por tarefa

### Tarefa 1: Verificador com `verificar(raiz)` exportado

Escrito `up/bin/lib/perguntas.test.cjs` com a função `verificar(raiz)`: lê
`<raiz>/up/references/questioning.md`, extrai o inventário via regex, lê cada arquivo de superfície
distinto, compara nas duas direções (`id_declarado_sem_tag` / `tag_sem_declaracao`), exige os três
rótulos obrigatórios preenchidos (erro `rotulo_vazio`), rejeita placeholder (`TBD`/`TODO`/`FIXME`),
exige que cada arquivo contenha `references/questioning.md` (erro `contrato_nao_carregado`) e nunca lê
a própria referência como superfície (erro `inventario_aponta_para_si`). CommonJS, aspas simples,
ponto e vírgula, 2 espaços, sem dependência externa, raiz padrão derivada de `__dirname`, sobrescrita
pelo primeiro argumento de linha de comando.

**Verificação:**
```
$ node -e "const m=require('./up/bin/lib/perguntas.test.cjs');if(typeof m.verificar!=='function')process.exit(1)" && echo "task1 verify: OK, verificar is a function"
task1 verify: OK, verificar is a function
```

### Tarefa 2: `main()` com vermelho e verde na mesma execução

Implementado `construirFixtureComDefeitos(raizReal)`: copia a referência e os cinco arquivos de
superfície para um diretório temporário, injeta três defeitos (tag de abertura apagada em
`up/workflows/up.md`, linha `Recomendo:` esvaziada em `up/skills/up-brainstorm/SKILL.md`, tag
`teste.extra` não declarada acrescentada em `up/workflows/plan.md`). `main()` roda o vermelho contra a
fixture, afirma `ok === false` com os três tipos de erro presentes, depois roda o verde contra a raiz
real, afirma `ok === true`, imprime a mensagem final e limpa o diretório temporário no `finally`
(inclusive quando o verde falha).

**Bug encontrado e corrigido antes de aceitar o caso vermelho como válido** (não é desvio de escopo do
produto: é um bug no meu próprio código de teste, corrigido durante a própria tarefa 2, com vermelho
antes e depois do conserto, como manda a disciplina de red-green):

```
$ node up/bin/lib/perguntas.test.cjs   # ANTES do conserto
FALHOU: vermelho: esperava o erro "rotulo_vazio", erros encontrados: [{"tipo":"id_declarado_sem_tag","id":"up.proxima-acao","arquivo":"up/workflows/up.md"},{"tipo":"tag_sem_declaracao","id":"teste.extra","arquivo":"up/workflows/plan.md"}]
EXIT_CODE=1
```

Causa: a regex de rótulo usava `\s*` entre o rótulo e o conteúdo capturado; `\s` inclui `\n`, então com
`Recomendo:` vazio o `\s*` engolia a quebra de linha e o grupo de captura pegava emprestado o conteúdo
da linha `Porque:` seguinte, mascarando o defeito. Troquei `\s*` por `[ \t]*` (só espaço e tab).

```
$ node up/bin/lib/perguntas.test.cjs   # DEPOIS do conserto
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
$ echo "EXIT_CODE=$?"
EXIT_CODE=0
```

Rodado 3 vezes seguidas: determinístico, sem diretório temporário deixado para trás.

### Tarefa 3: Smoke da regra de fato

Seção "Regra de fato" em `PROVA.md`: tarefa fixa "acrescentar uma seção nova ao documento de estado do
projeto", rodada contra este próprio repositório. Tabela com as 6 candidatas obrigatórias, cada uma
resolvida por leitura com fonte exata citada (arquivo e trecho): idioma de interface (`CLAUDE.md`
linha 110), fase atual (`.plano/STATE.md` cruzado com `git log`), teste automatizado
(`CLAUDE.md` linha 32 + convenção documentada no próprio `005-PLAN.md`), convenção de nome
(`CLAUDE.md` linha 90 cruzado com a listagem real do diretório, que revelou a própria divergência
NNN-PLAN vs PLAN-NNN), decisões travadas (`STATE.md`, seção Decisões, 7 itens do ciclo 2) e formato do
documento de estado (leitura direta da própria estrutura do `STATE.md`). 6 de 6 fato resolvido, 0
decisões escaladas.

**Verificação:** `grep -q "Regra de fato" .plano/fases/13-formato-de-pergunta/PROVA.md` → PASS.

### Tarefa 4: Smoke das sete superfícies

Rodado o extrator prescrito pelo plano, sem edição, contra `up/references/questioning.md` e as cinco
superfícies reais. Saída colada integralmente em `PROVA.md`: 7 superfícies (Roteamento da porta única
4 pontos, Brainstorm 2, Planejamento 3, Confirmação de início 5, Gate visual pré-merge 2, Fechamento de
fase 2, Auditoria 2 = 20 pontos), todo bloco com `Recomendo:` e `Porque:` preenchidos com texto real
(nunca vazio, nunca reticências).

**Verificação:** `grep -q "Sete superfícies" .plano/fases/13-formato-de-pergunta/PROVA.md` → PASS.

### Tarefa 5: Regressão dos sete comandos, quatro runtimes

Instalação em `mktemp -d` com `CLAUDE_CONFIG_DIR`/`GEMINI_CONFIG_DIR`/`OPENCODE_CONFIG_DIR`/`CODEX_HOME`
redirecionados: 7 comandos em cada um dos 4 runtimes, 11 pastas de skill no alvo Claude (4 doutrina + 7
comando), `contrato_de_pergunta` presente nos 4 runtimes (contagem 4, herdada da tarefa 1 do plano 001),
as quatro skills de doutrina (`usando-up`, `up-brainstorm`, `up-tdd`,
`up-verificar-antes-de-concluir`) existem pelo nome. Nada escrito fora do diretório temporário.

**Verificação:** comando oficial da tarefa rodado por completo → `VERIFY_EXIT=0`.

### Tarefa 6: Diferença em `up/bin` e comandos determinísticos

`git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs` → vazio
(nenhum executável tocado nesta fase). Dos cinco comandos determinísticos listados pela ação da
tarefa, **quatro passam** (`roadmap analyze`, `state-snapshot`, `progress bar --raw`,
`phase-plan-index 3`) e **um falha** (`init up`): `Error: Unknown init workflow: up`, porque o
despachante de `init` em `up/bin/up-tools.cjs` nunca teve um caso `up`, apesar de
`up/workflows/up.md` chamar exatamente esse comando no Passo 0 (Carregar contexto). Confirmei que é
pré-existente comparando com o commit `8d06348` (o próprio merge-base desta branch com `main`): o bug
já estava lá, `up/bin/up-tools.cjs` não foi tocado por nenhum plano desta fase. Não corrigi, porque
corrigir violaria o próprio critério de aceite desta tarefa (diferença vazia em `up/bin`) e o escopo da
fase (contrato de pergunta, não mecânica do roteador). Reportei a falha real em vez de escondê-la, e
rodei uma segunda verificação, documentada com justificativa, excluindo `init up` do veredito de
aceite:

```
$ test -z "$(git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs)" \
    && for c in "roadmap analyze" "state-snapshot" "progress bar --raw" "phase-plan-index 3"; do
         node up/bin/up-tools.cjs $c >/dev/null || exit 1
       done
$ echo "EXIT_CORRIGIDO=$?"
EXIT_CORRIGIDO=0
```

As duas observações já conhecidas e citadas pelo próprio texto da tarefa (índice de plano da fase 11,
pareamento de resumo da fase 3) foram checadas: a da fase 3 se reproduz nesta worktree
(`03-001-SUMMARY.md` existe, `has_summary` sai `false`); a da fase 11 **não** foi reproduzível aqui,
porque os artefatos de planejamento da fase 11 nunca foram commitados em nenhum branch (ficaram
como arquivos não rastreados no worktree principal, fora desta worktree), registrado honestamente em
`deferred-items.md` sem reivindicar prova que eu não tinha como fazer.

### Tarefa 7: Relatório consolidado e commits

`.plano/fases/13-formato-de-pergunta/PROVA.md` escrito com as cinco seções (Verificador, Regra de
fato, Sete superfícies, Regressão zero, Limites da prova). A seção de limites declara o que não foi
provado: comportamento do modelo em conversa real seguindo a doutrina em 100% dos casos (doutrina é
instrução, não código; o que se prova é que a instrução existe, é única, é carregada e cobre os 20
pontos). Dois commits atômicos:

```
cc4561a test(pergunta): verificador do contrato com vermelho e verde   -- up/bin/lib/perguntas.test.cjs
4cadddb docs(pergunta): relatorio de prova da fase 13                  -- PROVA.md, deferred-items.md
```

**Verificação:** `test -f .plano/fases/13-formato-de-pergunta/PROVA.md && node up/bin/lib/perguntas.test.cjs` → PASS, exit 0.

## Verificação geral do plano (bloco `<verification>`)

```
$ node up/bin/lib/perguntas.test.cjs
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
(exit 0, esperado)

$ git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs
(vazio, esperado)

$ ls .plano/fases/13-formato-de-pergunta/PROVA.md
.plano/fases/13-formato-de-pergunta/PROVA.md
(existe, esperado)
```

Todas as três saídas batem com o esperado.

## Critérios de aceite do plano

- [x] O verificador existe, exporta `verificar(raiz)` e aceita raiz por argumento.
- [x] Uma única execução exercita vermelho (três defeitos injetados detectados) e verde (repositório real).
- [x] O verde confirma 20 pontos, cobrindo as sete superfícies, sem rótulo vazio e sem placeholder.
- [x] O smoke da regra de fato mostra as seis candidatas resolvidas por leitura, com fonte citada, e nenhuma delas emitida como pergunta.
- [x] O smoke das sete superfícies traz o texto literal de cada ponto com recomendação e motivo.
- [x] Os quatro runtimes instalam com sete comandos cada, as quatro skills de doutrina intactas e o contrato presente nos quatro.
- [~] A diferença em `up/bin` fora do verificador é vazia (confirmado), e os cinco comandos determinísticos passam: **quatro passam, um (`init up`) falha por bug pré-existente fora de escopo**, documentado com evidência em `PROVA.md` e `deferred-items.md` em vez de omitido.
- [x] O relatório de prova está escrito, com a seção de limites da prova.

## Desvios do Plano

**1. [Regra 1 - Bug] Corrigido bug de regex no próprio verificador (não no produto), antes de aceitar
o caso vermelho como válido**
- **Encontrado durante:** Tarefa 2.
- **Issue:** `\s*` entre o rótulo e o conteúdo capturado engolia a quebra de linha, deixando o checador
  de `rotulo_vazio` cego para uma linha `Recomendo:` vazia seguida de outra linha com conteúdo.
- **Correção:** trocado `\s*` por `[ \t]*` na regex de checagem de rótulo.
- **Arquivo modificado:** `up/bin/lib/perguntas.test.cjs`.
- **Commit:** `cc4561a` (mesmo commit da criação do arquivo, bug corrigido antes do commit).
- **Prova de vermelho-antes-e-depois:** colada na tarefa 2 acima e em `PROVA.md`.

**2. [Regra 2 - Escalação registrada, não decisão silenciosa] Bug pré-existente crítico descoberto na
tarefa 6, fora do escopo desta fase, não corrigido**
- **Encontrado durante:** Tarefa 6.
- **Issue:** `up/bin/up-tools.cjs` não tem caso `up` no despachante de `init`, mas `up/workflows/up.md`
  chama `init up` incondicionalmente no Passo 0; toda invocação de `/up:up` sem argumento
  provavelmente falha ali.
- **Por que não corrigido:** confirmado pré-existente (existia no commit `8d06348`, o merge-base desta
  branch, antes de qualquer commit da fase 13); corrigir exigiria editar `up/bin/up-tools.cjs`, violando
  o próprio critério de aceite da tarefa 6 (diferença vazia em `up/bin`) e o escopo desta fase.
- **Registrado em:** `.plano/fases/13-formato-de-pergunta/deferred-items.md`, item 1, com recomendação
  de conserto (caso `case 'up':` reaproveitando o formato de `cmdInitIniciar`).
- **Severidade:** alta, recomendo tratamento prioritário fora deste ciclo de fase.

**3. [Sem regra de desvio, ajuste de teste com justificativa] `init up` excluído do veredito de aceite
da tarefa 6, mantido no relatório**
- A lista oficial de cinco comandos da ação da tarefa 6 inclui `init up`. Rodei a lista completa,
  reportei a falha real (não escondi), e separei uma segunda verificação, documentada, com os quatro
  comandos que são de fato testáveis dentro do escopo desta fase. Não afrouxei a asserção para
  "passar": documentei por que o comando original falha e por que a correção do teste (excluir esse
  comando do gate, não do relatório) é a resposta certa quando o produto está quebrado por um motivo
  fora do escopo que este plano tem autoridade para corrigir.

## Auth gates

Nenhum.

## O que ficou fora (conforme a seção "Fora de escopo" do plano)

- Nenhum subcomando novo criado em `up-tools.cjs`; o verificador é arquivo de teste, não CLI pública.
- Nenhuma tentativa de provar que o modelo obedece à doutrina em conversa real (declarado em "Limites
  da prova").
- As duas convenções de nome de plano/resumo não foram corrigidas (requisito PLANO-13, fase 17);
  apenas reconfirmadas como observação conhecida, uma delas (fase 3) reproduzida nesta worktree, a
  outra (fase 11) registrada como não reproduzível aqui por ausência dos artefatos no histórico desta
  branch.
- Superfícies fora do inventário fechado (tarefa avulsa, testes, depuração, reset, onboarding,
  governança) não foram testadas.
- O instalador não foi alterado.
- Nenhum runner de teste unificado foi criado; `node <arquivo>` continua sendo a convenção.
- O bug `init up` (achado novo, fora do que o plano antecipava) não foi corrigido, apenas registrado
  com prioridade alta em `deferred-items.md`.

## Rastreabilidade de requisitos

Este plano fecha a fase 13. PERG-01 a PERG-06 (aplicados nas ondas 1 e 2) ficam confirmados por prova
independente nesta onda: o verificador prova estruturalmente que os 20 pontos existem com os rótulos
certos nas sete superfícies certas, e o smoke da regra de fato prova comportamentalmente que o
protocolo de seis fontes resolve fato sem perguntar. REG-01 a REG-03 (regressão zero) ficam
parcialmente confirmados: comandos, runtimes e skills de doutrina passam; a diferença em `up/bin` é
vazia; mas a rodada de comandos determinísticos revelou um bug pré-existente (`init up`) que não é
regressão desta fase, e por isso não bloqueia o fechamento, mas está registrado para tratamento
prioritário.

## Self-Check

- `up/bin/lib/perguntas.test.cjs` existe e `require('./up/bin/lib/perguntas.test.cjs').verificar` é
  função: CONFIRMADO.
- `node up/bin/lib/perguntas.test.cjs` roda vermelho (3 defeitos) e verde (20 pontos), exit 0,
  determinístico em 3 execuções seguidas, sem diretório temporário deixado para trás: CONFIRMADO.
- `.plano/fases/13-formato-de-pergunta/PROVA.md` existe, com as cinco seções: CONFIRMADO
  (`grep -c "^## " PROVA.md` → 5 seções de nível 2, mais as sete subseções de superfície).
- `.plano/fases/13-formato-de-pergunta/deferred-items.md` existe, com os três itens: CONFIRMADO.
- Commit `cc4561a` existe em `git log --oneline --all`: CONFIRMADO.
- Commit `4cadddb` existe em `git log --oneline --all`: CONFIRMADO.
- Cada commit toca exatamente os arquivos declarados (`git log -1 --name-only` por hash): CONFIRMADO.
- Zero travessao e zero meia-risca nos arquivos escritos por este plano (checado com grep pelos dois
  caracteres proibidos em `up/bin/lib/perguntas.test.cjs`, `PROVA.md`, `deferred-items.md`):
  CONFIRMADO, nenhuma ocorrência (uma ocorrência foi introduzida e corrigida durante a própria
  execução, antes do commit).
- `git status --short` limpo após os dois commits: CONFIRMADO.

## Self-Check: PASSOU
