# Fase 13: Formato de pergunta - Relatório de Verificação

---
phase: 13-formato-de-pergunta
verified: 2026-07-25T13:05:00Z
status: gaps_found
score: 7/9 requisitos PROVADOS
evidence:
  - "logic:test_pass"
  - "glue:smoke"
gaps:
  - truth: "Uma escolha de arquitetura aparece ao dono como pergunta com recomendação, e não é decidida pelo agente (critério 4 do roadmap, PERG-05)"
    status: failed
    reason: "Provado no caminho de planejamento e não provado no caminho de execução. O agente de execução não carrega o contrato, não tem bloco de escalação, e o build não tem estágio que recolha decisão escalada. Além disso o próprio texto do executor manda decidir arquitetura sozinho no modo builder."
    artifacts:
      - path: "up/agents/up-executor.md"
        issue: "Zero ocorrências de questioning.md e zero ocorrências de DECISOES ESCALADAS. A linha 316 diz, para mudança arquitetural em modo builder: Decidir autonomamente. Escolher a opcao mais segura/padrao. NAO parar, NAO perguntar. Contradiz PERG-05 por escrito. Hoje é texto inalcançável, porque nada injeta builder_mode no prompt do executor."
      - path: "up/workflows/build.md"
        issue: "Zero ocorrências de DECISOES ESCALADAS. O checkpoint arquitetural que o executor devolve em modo normal não tem estágio de apresentação no formato do contrato, ao contrário do Estágio E que o plan.md criou para o arquiteto e o planejador."
    missing:
      - "Carregar o contrato de pergunta em up/agents/up-executor.md e trocar o retorno de checkpoint arquitetural pelo bloco DECISOES ESCALADAS"
      - "Estágio no build.md que recolha o bloco escalado do executor e o apresente no formato do contrato, espelhando o Estágio E do plan.md"
      - "Remover ou reescrever up/agents/up-executor.md:316, que hoje contradiz PERG-05 por escrito"
  - truth: "O verificador entregue protege o formato de pergunta contra regressão quando as fases 14 a 20 mexerem nas superfícies"
    status: failed
    reason: "Ponto cego reproduzível: apagar do inventário todas as linhas de uma superfície faz aquela superfície desaparecer da varredura, e o verificador aprova com os pontos restantes. Não existe asserção sobre a contagem de pontos nem sobre a contagem de superfícies."
    artifacts:
      - path: "up/bin/lib/perguntas.test.cjs"
        issue: "arquivosDistintos é derivado do próprio inventário (linha 69). Superfície sem nenhuma linha no inventário nunca é lida, então as tags dela ficam invisíveis para as duas direções de comparação. Provado: apagando as 2 linhas de auditoria, verificar devolve ok=true com pontos=18 e zero erros, enquanto as 2 tags continuam em up/workflows/auditar.md."
    missing:
      - "Asserção de piso na contagem de pontos do inventário (hoje 20) e na contagem de superfícies distintas (hoje 7)"
      - "Varredura das superfícies por descoberta de arquivo, e não apenas pela lista que o inventário declara"
  - truth: "Os sete comandos do UP continuam funcionando ao fim da fase (REG-01)"
    status: failed
    reason: "Dois dos sete comandos falham no primeiro passo. Causa pré-existente, não introduzida por esta fase, e por isso registrada como dívida e não como falha da fase. REG-01 continua corretamente desmarcado em REQUIREMENTS.md."
    artifacts:
      - path: "up/workflows/up.md"
        issue: "Linha 39 chama init up, que não existe no despachante. A porta única do produto morre no Passo 0."
      - path: "up/workflows/auditar.md"
        issue: "Linha 33 chama init auditar, que também não existe no despachante."
      - path: "up/bin/up-tools.cjs"
        issue: "Linha 218: o switch de init aceita planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso, verificar-trabalho, melhorias, ideias e iniciar. Não aceita up nem auditar. Arquivo intocado por esta fase."
    missing:
      - "Caso up e caso auditar no despachante de init, ou correção da chamada nos dois workflows"
      - "Checagem do código de retorno nos dois workflows, que hoje só testam o prefixo @file:"
---

**Objetivo da Fase (ROADMAP):** nenhuma pergunta do UP chega crua ao dono, e o agente para de perguntar o que ele mesmo poderia descobrir.

**Branch:** `up/fase-13-formato-de-pergunta`, 14 commits sobre o merge-base `8d06348`, árvore de trabalho limpa. Confirmado por `git rev-list --count`, `git status --porcelain` e `git rev-parse --abbrev-ref HEAD`.

**Método:** goal-backward. Cada critério do roadmap e cada requisito PERG e REG foi transformado na pergunta "isto é verdade agora, no produto, e qual é a prova?". Nenhuma afirmação abaixo vem de SUMMARY nem de PROVA.md: toda evidência foi produzida nesta verificação.

---

## 1. Evidência de tipo, produzida agora

### logic:test_pass (verificador do plano 005)

Rodado por mim, saída real:

```
$ node up/bin/lib/perguntas.test.cjs
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
EXIT_CODE=0
```

O vermelho é embutido e roda antes do verde na mesma execução: monta fixture em diretório temporário, injeta três defeitos em três arquivos diferentes, exige que o verificador reprove com os três tipos, e só então roda o verde contra o repositório real. Isso satisfaz a exigência de ter visto falhar antes de passar, sem depender de memória de sessão anterior.

Não parei aí. O verificador declara um caminho de erro que o vermelho embutido nunca exercita (`contrato_nao_carregado`). Testei eu mesmo, em fixture separada:

```
=== controle: fixture intacta deve passar ===
ok=true pontos=20 erros=0

=== defeito A: trocar a linha que carrega o contrato em build.md ===
ok=false erros=[{"tipo":"contrato_nao_carregado","id":null,"arquivo":"up/workflows/build.md"}]
```

O caminho funciona. Esse é o único nível 3 (wiring) automatizado que a fase entregou, e ele é real.

### glue:smoke (instalação nos quatro runtimes)

Rodado por mim, com os quatro diretórios de configuração redirecionados para diretório temporário:

```
INSTALL_EXIT=0
claude:   7   (auditar build depurar plan rapido testar up)
gemini:   7
opencode: 7
codex:    7
skills claude: up-auditar up-brainstorm up-build up-depurar up-plan up-rapido up-tdd
               up-testar up-up up-verificar-antes-de-concluir usando-up   (11 = 4 doutrina + 7 comando)
contrato_de_pergunta:  claude 4 | gemini 4 | opencode 4 | codex 4
ids no inventário:     claude 20 | gemini 20 | opencode 20 | codex 20
tags aplicadas:        claude 20 | gemini 20 | opencode 20 | codex 20
```

Prova extra que a fase não fez: rodei o verificador contra a cópia instalada, não só contra o repositório.

```
$ node -e "require('.../perguntas.test.cjs').verificar('$TMPUP/claude')"
ok=true pontos=20 erros=[]
```

O contrato sobrevive à instalação verificável, não apenas presente.

**Nota de vocabulário, para não maquiar:** o vocabulário fechado do gate tem três resultados, e `smoke` casa com `glue`. Esta fase não toca integração externa nenhuma. O `glue:smoke` registrado aqui é uma instalação real nos quatro runtimes seguida de inspeção, que é o que os quatro planos de doutrina declararam como prova. Encaixei no slot mais próximo do vocabulário fechado em vez de inventar um quarto.

---

## 2. Verdade a verdade, contra os critérios do roadmap

| # | Critério de sucesso | Status | Evidência produzida agora |
|---|---------------------|--------|---------------------------|
| 1 | Em brainstorm de tarefa pequena, toda pergunta traz recomendação e motivo, sem exceção | VERIFIED como instrução | A superfície de brainstorm tem os 2 pontos declarados, ambos com os três rótulos preenchidos, e a skill carrega o contrato antes da primeira pergunta (`up/skills/up-brainstorm/SKILL.md:16`). Varredura minha por linha terminando em interrogação fora de bloco `<pergunta>` na skill: 0 |
| 2 | Em repositório com planejamento populado, o brainstorm não pergunta o que já está no estado, nos requisitos ou no mapa | VERIFIED como instrução, UNCERTAIN em runtime | O protocolo de seis fontes existe em ordem fixa na seção 2 do contrato, o teste de classificação tem os três casos, e quatro superfícies declaram por escrito a própria lista de "o que resolve sozinho e nunca pergunta". O exercício 6 de 6 que a PROVA.md relata é narrativo e não reexecutável por comando: eu confirmei a instrução, não a obediência |
| 3 | Roteamento da porta única, planejamento, confirmação de início, menu de fechamento e gate visual apresentam a opção recomendada com o motivo | VERIFIED | Os 20 pontos existem, os 20 têm `Pergunta`, `Recomendo` e `Porque` com conteúdo, os 20 têm linha `Opções`, e a opção recomendada vem em primeiro lugar em 20 de 20 (19 casam literalmente, 1 casa em substância com redação variante) |
| 4 | Uma escolha de arquitetura aparece ao dono como pergunta com recomendação, e não é decidida pelo agente | FAILED em parte | Provado no caminho de planejamento: arquiteto e planejador carregam o contrato, devolvem `## DECISOES ESCALADAS` com a regra da linha `Nenhuma.`, e o `plan.md` Estágio E recolhe, ordena por custo de reverter e apresenta via `plan.decisoes-escaladas`. NÃO provado no caminho de execução: ver gap 1 |
| 5 | Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior continua funcionando sem migração | FAILED em parte, por causa pré-existente | Quatro runtimes: VERIFIED. Planejamento legado: VERIFIED. Sete comandos: 2 de 7 morrem no primeiro passo por bug pré-existente. Ver gap 3 |

**Score de verdades: 3 VERIFIED, 2 FAILED em parte.**

---

## 3. Requisito a requisito: PROVADO ou NÃO PROVADO

### PERG-01: toda pergunta chega com resposta recomendada e motivo - **PROVADO**

Conferência dos 20 pontos, feita por mim com extração própria do inventário e leitura de cada bloco nos arquivos de superfície:

```
0 blocos incompletos: todos os 20 tem Pergunta, Recomendo e Porque preenchidos
blocos com linha Opcoes: 20   sem linha Opcoes: 0
opcao recomendada em primeiro lugar: 20/20 (19 literais + 1 variante de redacao da mesma opcao)
```

Qualidade da linha `Porque`, que o contrato exige que nomeie evidência:

| Natureza da linha Porque | Quantos |
|---------------------------|---------|
| Prosa fixa que nomeia a evidência no próprio texto | 6 |
| Misto: espaço reservado mais prosa que já entrega o critério | 7 |
| Só espaço reservado, a evidência é nomeada em runtime | 7 |

Nenhuma das 20 é enchimento genérico. As 7 puramente reservadas dependem do modelo preencher na hora, e isso é o limite que a própria fase declara e que nenhum `assert` alcança.

### PERG-02: nenhuma das sete superfícies emite pergunta crua - **PROVADO**

Conferência dos 20 identificadores contra o produto, com a armadilha desarmada:

```
grep ingênuo em up/workflows + up/skills + up/references:  21
  desses, 1 é o exemplo literal do template do contrato:   up/references/questioning.md:112  <pergunta id="identificador">
identificadores realmente aplicados:                       20
identificadores declarados no inventário:                  20
diff declarados vs aplicados:                              vazio
```

O grep ingênuo devolve 21 exatamente como previsto. Aviso adicional para quem repetir a conferência: se a varredura incluir `up/bin/`, o total vira 26, porque `perguntas.test.cjs` contém cinco ocorrências entre a própria regex e as injeções da fixture. O número honesto é 20.

Superfícies distintas: 7, com 4 + 2 + 3 + 5 + 2 + 2 + 2 = 20. As cinco superfícies com texto literal (`up.md`, `plan.md`, `build.md`, `auditar.md`, `up-brainstorm/SKILL.md`) todas carregam o contrato, e isso é asserção do verificador, não leitura minha: exercitei o caminho `contrato_nao_carregado` adversarialmente e ele reprova.

Varredura própria por pergunta crua sobrevivente, ou seja, linha terminando em interrogação fora de bloco `<pergunta>`:

```
up/workflows/up.md                     0
up/workflows/plan.md                   0
up/workflows/build.md                  0
up/workflows/auditar.md                0
up/skills/up-brainstorm/SKILL.md       0
up/agents/up-arquiteto.md              4  -> linhas 102 a 104 são itens de pesquisa do próprio agente
                                          (o que pesquisar via Context7), linha 300 é template. Nenhuma
                                          é pergunta ao dono
up/agents/up-planejador.md             3  -> linhas 269 a 272 são prompts reflexivos internos do método
                                          goal-backward. Nenhuma é pergunta ao dono
```

**Ressalva de leitura, não de entrega:** PERG-02 nomeia a sétima superfície como "handoff da auditoria". O que existe hoje é a superfície Auditoria com dois pontos, e o que faz papel de handoff é `auditar.converter-em-fases` ("Converto os achados aprovados em fases do roadmap?"). O gate duro entre diagnosticar e projetar é AUD-08, requisito da fase 19, e não desta. A superfície está coberta no formato do contrato; o gate duro ainda não existe, e nem deveria.

### PERG-03: antes de perguntar, o agente tenta resolver por conta própria - **PROVADO como instrução**

O protocolo de resolução prévia existe com seis fontes em ordem fixa (decisões travadas, artefatos de planejamento, mapa do código, leitura e busca direta, histórico do repositório, configuração e ambiente), com a regra de parar na primeira fonte que responde, a regra de anunciar em uma linha o que descobriu, e a regra de que duas fontes discordando é decisão e sobe.

Além do contrato central, quatro superfícies declaram a própria lista fechada de fatos que nunca perguntam. A do `build.md` é a mais dura e fecha com "Perguntar qualquer um desses itens é violação do contrato".

O que NÃO está provado: obediência em conversa real. O exercício de seis candidatas que a PROVA.md registra é uma tabela narrativa, sem comando reexecutável. Não o reproduzi e não o conto como prova de execução.

### PERG-04: fato descobrível nunca vira pergunta - **PROVADO como instrução**

Mesma base do PERG-03, mais o teste de classificação com os três casos e o bloco de três proibições, incluindo a regra de segredo que só pede credencial depois de esbarrar na parede que a exige. Também está na skill de bootstrap, que chega a todo runtime: `up/skills/usando-up/SKILL.md` ganhou a linha "Fato que você consegue descobrir você descobre, não pergunta". Isso é o único ponto da fase que entra no prompt de sessão sem depender de o agente carregar a referência.

### PERG-05: escolha de arquitetura ou trade-off nunca é resolvida pelo agente sozinho - **NÃO PROVADO integralmente**

Está marcado `[x]` em REQUIREMENTS.md. A marcação está otimista.

Provado no caminho de planejamento. Os dois agentes carregam o contrato e escalam:

```
up/agents/up-arquiteto.md:66    carrega references/questioning.md
up/agents/up-arquiteto.md:553   bloco ## DECISOES ESCALADAS
up/agents/up-arquiteto.md:581   checklist exige o bloco presente, com "Nenhuma." quando não há nada
up/agents/up-planejador.md:120  carrega references/questioning.md
up/agents/up-planejador.md:462  bloco ## DECISOES ESCALADAS
up/agents/up-planejador.md:489  mesma checklist
up/workflows/plan.md:230        Estágio E recolhe, descarta "Nenhuma.", ordena por custo de reverter,
                                pergunta uma por vez e faz retrabalho dirigido em caso de divergência
```

Não provado no caminho de execução:

```
$ grep -c "questioning.md\|DECISOES ESCALADAS\|contrato_de_pergunta" up/agents/up-executor.md
0
$ grep -c "DECISOES ESCALADAS\|escalad" up/workflows/build.md
0
$ for f in up/agents/*.md; do grep -q questioning.md "$f" && echo "$f"; done
up/agents/up-arquiteto.md
up/agents/up-planejador.md
(2 de 12 agentes)
```

Pior: `up/agents/up-executor.md:316` diz, para mudança arquitetural em modo builder, "Decidir autonomamente. Escolher a opcao mais segura/padrao. NAO parar, NAO perguntar." Isso é o inverso literal de PERG-05, dentro do produto.

Atenuação honesta: esse texto é hoje inalcançável. Nada injeta `<builder_mode>` no prompt do executor. A única coisa que escreve `builder_mode` é o arquiteto, dentro de `config.json` (linhas 323 e 328), e o executor não lê `config.json`. Em modo normal a Regra 4 manda PARAR e diz "Decisao do usuario necessaria", o que respeita a substância de PERG-05, mas não o formato do contrato, e `build.md` não tem estágio que transforme esse checkpoint em pergunta com recomendação.

Veredito: a escolha de arquitetura sobe ao dono no formato novo quando nasce no planejamento, e não sobe no formato novo quando nasce na execução. PERG-06, que é o requisito que define o alcance da fase, cita apenas arquiteto e planejador, então a fase entregou o alcance que declarou. PERG-05, como está escrito, não está inteiro.

### PERG-06: a regra vale também para os agentes de arquitetura e de planejamento - **PROVADO**

Evidência acima. Os dois agentes nomeados carregam o contrato e devolvem o bloco de escalação, com a regra da linha `Nenhuma.` na checklist de saída de cada um, e o `plan.md` fecha o circuito apresentando ao dono. Este é o requisito que a fase cumpriu por inteiro, e é ele que delimita o alcance do PERG-05 nesta fase.

### REG-01: os sete comandos continuam funcionando - **NÃO PROVADO, por causa pré-existente**

Os sete comandos existem e instalam nos quatro runtimes. Dois deles morrem no primeiro passo:

```
$ node up/bin/up-tools.cjs init up
Error: Unknown init workflow: up
$ node up/bin/up-tools.cjs init auditar
Error: Unknown init workflow: auditar
```

Mapeei todas as chamadas de `init` do produto e testei uma a uma, com o argumento que o workflow realmente passa:

| Chamada | Onde | Resultado |
|---------|------|-----------|
| `init up` | up/workflows/up.md:39 | **QUEBRA** |
| `init auditar` | up/workflows/auditar.md:33 | **QUEBRA** |
| `init rapido` | up/workflows/rapido.md:43 | ok |
| `init operacao-fase` | up/workflows/remover-fase.md:32 | ok |
| `init executar-fase 13 --raw` | up/workflows/build.md:353 | ok |
| `init planejar-fase 13` | up/agents/up-planejador.md:331 | ok |

Nota: `init executar-fase` e `init planejar-fase` falham quando invocados sem o número da fase, mas os workflows sempre passam o número, então não são defeito.

Correção de um detalhe da linha de base que me foi passada: o erro sai em **stderr**, não em stdout. Medi:

```
$ INIT=$(node up/bin/up-tools.cjs init up 2>/dev/null); echo $?
1
$ [ -z "$INIT" ] && echo vazio
vazio
```

Ou seja, `INIT` não recebe a string de erro: recebe **string vazia**. O código de retorno é 1 e é descartado, porque a única checagem depois da atribuição é o prefixo `@file:` (`up.md:40`, `auditar.md:34`). O workflow segue e tenta parsear JSON de nada. O efeito é o mesmo, o mecanismo é esse.

Pré-existência provada por mim:

```
$ git diff 8d06348..HEAD -- up/workflows/up.md | grep -E '^[+-].*init up'
(nada: a linha não foi adicionada nem removida pela fase)
$ git diff 8d06348..HEAD -- up/workflows/auditar.md | grep -E '^[+-].*init auditar'
(nada)
$ git diff --stat 8d06348..HEAD -- up/bin/up-tools.cjs
(vazio: o despachante não foi tocado por nenhum plano da fase)
```

Registrado como dívida, não como falha da fase. A fase manteve REG-01 corretamente **desmarcado** em REQUIREMENTS.md, o que é a atitude certa e é raro.

### REG-02: os quatro runtimes continuam instalando e operando - **PROVADO**

Instalação real feita por mim, seção 1 deste relatório. Exit 0, sete comandos por runtime, onze pastas de skill no alvo Claude, contrato com os vinte identificadores e as vinte tags nos quatro, e o verificador aprovando a cópia instalada.

### REG-03: projeto com planejamento anterior ao ciclo continua funcionando sem migração - **PROVADO com dívida conhecida**

Comandos determinísticos rodados por mim contra este `.plano/`, que tem as fases 03 a 10 na convenção antiga:

```
ok: roadmap analyze
ok: state-snapshot
ok: progress bar --raw
ok: phase-plan-index 3
ok: phase-plan-index 5
ok: phase-plan-index 9
ok: roadmap get-phase 13
```

Dívida pré-existente confirmada: `phase-plan-index 3` devolve `has_summary: false` para o plano `001-PLAN.md` que tem resumo em disco como `03-001-SUMMARY.md`. É o requisito PLANO-13, fase 17. Não é regressão desta fase.

Uma falha minha, corrigida, para o registro: anotei `config get` como falhando. Era invocação errada minha, o subcomando exige chave. Com chave, `config get github_native` devolve "Key not found", porque este `config.json` não grava as chaves cujo padrão vive em `core.cjs`. Comportamento pré-existente, fora do escopo desta fase, e não é o que REG-01 mede.

---

## 4. Artefatos: três níveis

| Artefato | Nível 1 existe | Nível 2 substantivo | Nível 3 conectado | Status |
|----------|----------------|---------------------|-------------------|--------|
| `up/references/questioning.md` | sim, +155 linhas | sim: 4 seções, protocolo de 6 fontes, bloco de escalação, inventário de 20 | sim: carregado por 5 superfícies e 2 agentes, asserção do verificador | VERIFIED |
| `up/workflows/up.md` | sim | 4 pontos completos | carrega o contrato (linha 27) | VERIFIED |
| `up/skills/up-brainstorm/SKILL.md` | sim | 2 pontos completos, mais duas regras que valem nas rodadas sem texto literal | carrega o contrato (linha 16) | VERIFIED |
| `up/workflows/plan.md` | sim | 3 pontos completos, mais o Estágio E | carrega o contrato (linha 37), consome os blocos escalados | VERIFIED |
| `up/workflows/build.md` | sim | 9 pontos completos, mais a lista fechada de fatos que nunca pergunta | carrega o contrato (linha 89) | VERIFIED |
| `up/workflows/auditar.md` | sim | 2 pontos completos, recomendação calculada de contagem de commits | carrega o contrato (linha 22) | VERIFIED |
| `up/agents/up-arquiteto.md` | sim | separa o que infere do que escala, bloco de escalação, checklist | carrega o contrato (linha 66), consumido pelo Estágio E | VERIFIED |
| `up/agents/up-planejador.md` | sim | idem | carrega o contrato (linha 120), consumido pelo Estágio E | VERIFIED |
| `up/skills/usando-up/SKILL.md` | sim, +2 linhas | resume as três regras em uma linha de bootstrap | chega a todo runtime pelo hook de sessão | VERIFIED |
| `up/bin/lib/perguntas.test.cjs` | sim, 266 linhas | vermelho embutido real, 8 tipos de erro, sem framework | roda sozinho, e o caminho de wiring reprova de verdade | VERIFIED com ponto cego (gap 2) |
| `up/agents/up-executor.md` | não tocado | sem contrato, sem escalação, com linha contraditória | **ORPHANED** para PERG-05 | FAILED (gap 1) |

---

## 5. Ponto cego do verificador, reproduzido

Este é o único achado que pertence a algo que a própria fase construiu. Sequência exata:

```
=== controle: cópia intacta ===
ok=true  pontos=20  erros=0

=== apagar 5 linhas do inventário: 3 de build.md e as 2 de auditar.md ===
ok=false pontos=15
erros=[tag_sem_declaracao build.onda-falhou, tag_sem_declaracao build.replan-esgotado,
       tag_sem_declaracao build.revisor-bloqueou]
   -> as 3 de build.md são pegas, as 2 de auditar.md NÃO aparecem

=== apagar do inventário SÓ as 2 linhas da superfície Auditoria (superfície inteira) ===
ok=true  pontos=18  erros=[]
>>> PONTO CEGO CONFIRMADO
$ grep -c '<pergunta id="auditar' fixture/up/workflows/auditar.md
2
```

Causa, na linha 69 do verificador: `arquivosDistintos` é derivado do próprio inventário. Superfície que perde todas as linhas do inventário nunca entra na lista de arquivos lidos, então as tags dela ficam fora das duas direções de comparação, fora da checagem de rótulos e fora da checagem de contrato carregado. Não existe asserção de piso na contagem: `pontos` é reportado, nunca comparado com 20.

Consequência prática: a fase 13 se apresenta como guarda de regressão para as fases 14 a 20, que vão mexer nessas mesmas superfícies. A guarda pega ponto novo que entra sem declaração e declaração que perde a tag. Não pega superfície inteira saindo da lista fechada. O conserto é de duas linhas.

---

## 6. Anti-padrões

| Onde | Padrão | Severidade | Impacto |
|------|--------|------------|---------|
| `up/agents/up-executor.md:316` | Instrução que contradiz PERG-05 por escrito, hoje inalcançável | Blocker de requisito, latente | Se alguém religar o modo builder, o produto passa a decidir arquitetura sozinho por instrução própria |
| `up/bin/lib/perguntas.test.cjs:69` | Guarda que confia no dado que deveria guardar | Warning | Regressão silenciosa de superfície inteira nas fases 14 a 20 |
| `up/workflows/up.md:40` e `up/workflows/auditar.md:34` | Retorno de subprocesso capturado sem checar código de saída | Blocker pré-existente | A porta única segue com string vazia em vez de metadados |
| 20 pontos de pergunta | 7 linhas `Porque` puramente reservadas | Info | Aceitável e declarado: a evidência é nomeada em runtime, não em texto fixo |
| `up/bin/up-tools.cjs` | Cinco famílias de comando que rodam sem erro e não escrevem nada (`requirements mark-complete`, `state advance-plan` e irmãos) | Warning pré-existente | Levou o fechamento desta fase a ser feito à mão. Registrado pela própria fase em `deferred-items.md` itens 4 e 5, e confirmado por mim como fora do diff da fase |

Travessões: **zero introduzidos pela fase.**

```
# o padrao de busca abaixo esta escrito por codepoint para nao inserir o caractere neste relatorio
$ git diff 8d06348..HEAD -- . ':(exclude).plano' | grep '^+' | grep -c $'\u2014'   -> 0   (em-dash)
$ git diff 8d06348..HEAD -- . ':(exclude).plano' | grep '^+' | grep -c $'\u2013'   -> 0   (en-dash)
```

A base pré-existente de 43 arquivos com travessão permanece intocada e não é regressão desta fase. `up/agents/up-planejador.md` sozinho tem 29, todos anteriores à fase.

---

## 7. Cerimônia de fechamento: uma lacuna real

`.plano/governance/approvals.log` **não tem nenhuma entrada para a fase 13**.

```
$ grep -c "fase=13" /home/projects/up-cc/.plano/governance/approvals.log
0
$ grep -E "APPROVED|APPROVE|REQUEST_CHANGES|BLOCKED" .../approvals.log
2026-07-09T03:16:43Z | fase=11 plano=001 | APPROVED | evidence=smoke:pass  | ...
2026-07-09T03:22:33Z | fase=12 plano=001 | APPROVED | evidence=test:red-green | ...
2026-07-25T04:55:10Z | planning | up-revisor | REQUEST_CHANGES | confidence=72
2026-07-25T05:20:56Z | planning | up-revisor | APPROVE | confidence=86
```

O arquivo não existe nesta worktree e nunca existiu em git: `.plano/governance/` está no `.gitignore` (linha 2). A única cópia viva está no worktree principal. Mesmo assim, o ROADMAP já marca a fase 13 como `Complete 5/5` em `2026-07-25` e REQUIREMENTS.md já marca PERG-01 a PERG-06 como concluídos. A fase foi declarada fechada sem a linha do gate que o próprio produto exige.

Os campos que faltavam para essa linha são os que este relatório produz: `evidence=logic:test_pass` e `evidence=glue:smoke`.

---

## 8. O que precisa de olho humano

1. **Obediência em conversa real.** Nenhum `assert` garante que um agente, numa sessão futura, carrega a referência, resolve o protocolo de seis fontes e preenche as 7 linhas `Porque` reservadas com evidência de verdade em vez de enchimento. Uma rodada real de `/up:plan` numa tarefa pequena, lida pelo dono, é o único teste disso.
2. **Se o modo builder do executor deve morrer ou virar contrato.** É decisão do dono, não do verificador: ou a linha 316 sai, ou o modo builder volta a existir e passa a escalar no formato novo.
3. **Se `init up` entra nesta fase ou vira fase própria.** É o defeito mais grave do repositório hoje e a fase o registrou em vez de esconder, o que foi correto. Continua quebrado.

---

## 9. Veredito

**A fase entregou o que prometeu, com duas exceções nomeadas e uma dívida herdada.**

Entregou de verdade: contrato de pergunta em fonte única, os 20 pontos aplicados sem nenhum faltando, os 7 pontos de superfície carregando o contrato antes da primeira pergunta, os dois agentes de planejamento escalando em vez de decidir, um verificador que se prova capaz de reprovar antes de aprovar, e tudo isso sobrevivendo à instalação nos quatro runtimes de forma verificável. Não achei uma única pergunta crua sobrevivente nas cinco superfícies com texto literal. Nenhum travessão introduzido. Nenhum arquivo executável do produto tocado além do verificador novo.

Não entregou: PERG-05 inteiro. A escolha de arquitetura sobe ao dono no formato novo quando nasce no planejamento, e não sobe quando nasce na execução, onde o agente não tem contrato, não tem bloco de escalação, não tem estágio que o apresente, e ainda carrega uma linha que manda decidir sozinho. Marcar PERG-05 como concluído em REQUIREMENTS.md foi arredondar para cima.

Não entregou por inteiro: a guarda de regressão que a fase promete às fases 14 a 20 tem um furo reproduzível de duas linhas.

Não é culpa da fase: REG-01. Dois dos sete comandos morrem no primeiro passo, incluindo a porta única do produto, por bug anterior ao primeiro commit da fase. A fase achou, documentou com prova de pré-existência, recusou-se a consertar fora de escopo e deixou REG-01 desmarcado. Isso é honestidade de prova, e é o oposto de arredondar.

| Requisito | Veredito |
|-----------|----------|
| PERG-01 | PROVADO |
| PERG-02 | PROVADO |
| PERG-03 | PROVADO como instrução |
| PERG-04 | PROVADO como instrução |
| PERG-05 | **NÃO PROVADO integralmente** |
| PERG-06 | PROVADO |
| REG-01 | **NÃO PROVADO**, causa pré-existente, não é falha da fase |
| REG-02 | PROVADO |
| REG-03 | PROVADO com dívida conhecida |

**7 de 9 PROVADOS. Status: gaps_found.**

A evidência do tipo certo existe e é fresca, rodada nesta verificação: `evidence=logic:test_pass` e `evidence=glue:smoke`. O que impede o `passed` não é falta de prova: são os dois furos nomeados nos gaps 1 e 2. O gap 3 é dívida herdada e não conta contra a fase.
