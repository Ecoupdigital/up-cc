# Evidência da fase 15 (modo grill), plano 004

Saída bruta e veredito de cada prova exigida pelo plano 004. Regra de honestidade aplicada em toda
a página: ausência de prova nunca é registrada como prova. Onde uma sonda não pôde rodar ou não
discriminou, isso está escrito como veio, não como sucesso otimista.

Runtime usado em todas as sondas de comportamento: Claude Code 2.1.220 (`claude`), modo de
impressão (`-p`), modelo econômico (alias `fable`), chamado por execução de arquivo com lista de
argumentos (nunca shell), prompt entregue por stdin.

## Prova 1: invariante de piso e propagação (`up/tests/piso-grill.test.cjs`)

**Comando**: `node up/tests/piso-grill.test.cjs`
**Data/hora**: 2026-07-26, ~15:41 UTC

**Saída na árvore atual (verde esperado)**:

```
  ok  - motor existe e tem as tres portas de saida
  ok  - palavras de parada literais aparecem no motor
  ok  - frases proibidas declaradas no motor
  ok  - skill de brainstorm aponta para o motor
  ok  - piso antigo extinto em todas as superficies vivas
  ok  - propagacao: todas as superficies citam o grill
  ok  - gate preservado na skill e citado pelo motor
  ok  - sem travessao nos arquivos que nasceram limpos

piso-grill: 8 passou, 0 falhou
```

Código de saída: `0`.

**Contraprova vermelha**, na árvore do `SHA_BASE` (`89541fcc92613cc9624cc09d8dc34efb17fb0b3b`, ponto
de partida da fase, colhido via `git worktree add /tmp/up-red-15 $BASE` e cópia do próprio arquivo
de teste para dentro dessa árvore, sem alterar o repositório de trabalho):

```
  FAIL - motor existe e tem as tres portas de saida
      motor ausente em "up/skills/up-brainstorm/grill.md": ENOENT: no such file or directory, open '/tmp/up-red-15/up/skills/up-brainstorm/grill.md'
  FAIL - palavras de parada literais aparecem no motor
      ENOENT: no such file or directory, open '/tmp/up-red-15/up/skills/up-brainstorm/grill.md'
  FAIL - frases proibidas declaradas no motor
      ENOENT: no such file or directory, open '/tmp/up-red-15/up/skills/up-brainstorm/grill.md'
  FAIL - skill de brainstorm aponta para o motor
      "up/skills/up-brainstorm/SKILL.md" nao cita "grill.md" pelo nome
  FAIL - piso antigo extinto em todas as superficies vivas
      "up/skills/up-brainstorm/SKILL.md" ainda ensina o piso antigo: encontrado "Pequena** (1 subsistema, 1 escolha de design) | 1 pergunta"
  FAIL - propagacao: todas as superficies citam o grill
      "up/skills/up-brainstorm/SKILL.md" nao cita "grill" em lugar nenhum
  FAIL - gate preservado na skill e citado pelo motor
      ENOENT: no such file or directory, open '/tmp/up-red-15/up/skills/up-brainstorm/grill.md'
  FAIL - sem travessao nos arquivos que nasceram limpos
      ENOENT: no such file or directory, open '/tmp/up-red-15/up/skills/up-brainstorm/grill.md'

piso-grill: 0 passou, 8 falhou
```

Código de saída: `1`. A árvore de trabalho temporária (`/tmp/up-red-15`) foi removida com
`git worktree remove /tmp/up-red-15 --force` logo em seguida (confirmado por `git worktree list`
sem a entrada).

**Veredito: PASSOU.** A árvore atual passa nos 8 casos, a árvore do ponto de partida falha nos
mesmos 8, discriminando com clareza. Cobre GRILL-01 (por inspeção estrutural), GRILL-02
(automatizado) e GRILL-10/gate (automatizado).

**Nota sobre a sétima superfície**: a lista de superfícies vivas verificada pelos casos 5 e 6 tem
sete arquivos, não seis (`up/skills/up-brainstorm/SKILL.md`, `up/skills/usando-up/SKILL.md`,
`up/workflows/up.md`, `up/commands/up.md`, `up/bin/install.js`, `up/README.md` e
`docs/GUIA-DE-USO.md`). O 004-PLAN.md nomeia seis; a sétima (`docs/GUIA-DE-USO.md`) foi
acrescentada nesta prova porque o plano 003 (tarefa 7, ver `003-SUMMARY.md`) já a identificou e
corrigiu como superfície viva fora do inventário original do `CONTEXT.md` desta fase, citada
diretamente por `up/README.md` como "detalhes completos". Deixá-la fora do invariante deixaria essa
superfície sem guarda de regressão, o que contradiz o próprio objetivo do caso 5/6 ("qualquer
superfície viva que volte a ensinar o piso antigo"). Documentado como desvio Regra 2 no SUMMARY.

## Prova 2: sonda de comportamento, caso `parada` (contra a doutrina entregue)

**Comando**: `node up/tests/grill-probe.cjs --caso parada`
**Doutrina**: `up/skills/up-brainstorm/grill.md` (padrão, motor entregue pelo plano 001)
**Data/hora**: 2026-07-26, ~15:57 UTC

**Resposta bruta do modelo**:

> Design fechado, em três frases:
>
> 1. O relatório é gerado no servidor, em arquivo separado, disparado por um botão de exportação no painel.
> 2. A entrega é por download direto: o dono clica, o servidor gera e o navegador baixa o arquivo na hora.
> 3. Cada exportação tem teto de cinquenta mil linhas; acima disso o painel avisa e pede um filtro antes de gerar.
>
> Ponto em aberto: teto de linhas adotado pela recomendação (cinquenta mil), não confirmado pelo dono.
>
> Aprova esse design? Aprovado, segue pro planejamento.

**Tabela de asserções**:

| # | Asserção | Resultado |
|---|----------|-----------|
| 1 | Sem frase de confirmação | ok |
| 2 | Sem pergunta nova de grill (`[Q4]`/`Depende de:`) | ok |
| 3 | Sem abrir o checkpoint (`Fechar e seguir`/`Mais perguntas`) | ok |
| 4 | Destila as decisões já fixadas (servidor, download) | ok |
| 5 | Pede aprovação do design | ok |
| 6 | Declara o ponto em aberto | ok |

Código de saída: `0`. **Veredito: PASSOU (6/6).** Cobre GRILL-06 e GRILL-10.

## Prova 3: sonda de comportamento, caso `entrada`

**Comando**: `node up/tests/grill-probe.cjs --caso entrada`
**Doutrina**: `up/skills/up-brainstorm/grill.md` (padrão)
**Data/hora**: 2026-07-26, ~15:52 UTC

**Resposta bruta do modelo**:

> Classificação: Pequena. Grill entra.
>
> [Q1]
> Pergunta: Como você quer selecionar o período no painel de pedidos?
> Depende de: nada
> Opções:
> a) Só atalhos fixos (hoje, ontem, últimos 7 dias, últimos 30 dias, este mês)
> b) Só intervalo livre, com data inicial e final num calendário
> c) Atalhos fixos + intervalo personalizado (recomendada)
> Recomendo: c
> Porque: atalhos resolvem o uso do dia a dia em um clique, e o intervalo livre cobre consulta pontual (fechamento de mês, auditoria). Custo de UI quase o mesmo da opção b.

**Tabela de asserções**:

| # | Asserção | Resultado |
|---|----------|-----------|
| 1 | Exatamente um marcador `[Q1]` e nenhum `[Q2]` | ok |
| 2 | Contém a linha de dependência | ok |
| 3 | Contém recomendação explícita | ok |
| 4 | Sem checkpoint nem design pronto | ok |

Código de saída: `0`. **Veredito: PASSOU (4/4).** Cobre GRILL-02, GRILL-04 e GRILL-05.

## Prova 4: sonda de comportamento, caso `precedencia`

**Comando**: `node up/tests/grill-probe.cjs --caso precedencia`
**Doutrina**: `up/skills/up-brainstorm/grill.md` (padrão)
**Data/hora**: 2026-07-26, ~15:53 UTC

**Resposta bruta do modelo**:

> Grill ligado. Classificação automática deu Trivial, mas "me grelha" sobe o piso: pedido teu vence a classificação. Árvore montada: motivo vem antes de escopo, escopo antes de consistência entre superfícies.
>
> [Q1]
> Pergunta: O que motiva a troca: problema real de usuário ou só clareza de linguagem?
> Depende de: nada
> Opções:
> - a) Houve confusão ou pedido acidental relatado: gente clicando "Enviar" sem saber que estava fechando o pedido
> - b) Nenhum problema relatado, só quero o rótulo mais honesto com a ação (recomendada)
> - c) Primeiro passo de mudança maior no checkout (resumo do pedido, confirmação em duas etapas)
>
> Recomendo: b
> Porque: sem relato de pedido acidental, a mudança mínima que resolve é o rótulo. As respostas a e c puxam design de fluxo, não só texto, e esse buraco só vale descer se o problema existir de verdade.

**Tabela de asserções**:

| # | Asserção | Resultado |
|---|----------|-----------|
| 1 | Contém `[Q1]` com linha de dependência | ok |
| 2 | Sem anúncio de execução direta | ok |

Código de saída: `0`. **Veredito: PASSOU (2/2).** Cobre GRILL-03.

## Prova 5: contraprova, caso `parada` contra a doutrina anterior à fase

**Preparação**: `git show 89541fcc92613cc9624cc09d8dc34efb17fb0b3b:up/skills/up-brainstorm/SKILL.md`
extraído para um arquivo temporário (essa é a doutrina de brainstorm inteira, tal como estava antes
de qualquer edição desta fase; naquele momento o modelo antigo não conhecia grill nem palavra de
parada, e mandava fechar toda rodada com o checkpoint de duas opções).

**Comando**: `node up/tests/grill-probe.cjs --caso parada --doutrina <doutrina antiga>`
**Data/hora**: duas execuções, 2026-07-26, ~15:54 UTC e ~15:57 UTC.

### Execução 1

**Resposta bruta do modelo**:

> Fechada a rodada de perguntas.
>
> Sobre o teto, que ficou sem resposta: adoto a minha recomendação (cinquenta mil linhas). Dá pra trocar na aprovação abaixo.
>
> Design em 3 frases:
>
> 1. O relatório do painel ganha uma ação "Exportar arquivo"; o clique chama o servidor, que gera o arquivo completo lá, sem pesar no navegador.
> 2. Gerado o arquivo, o servidor devolve na mesma requisição e o navegador baixa direto, sem e-mail nem fila.
> 3. A exportação corta em cinquenta mil linhas e avisa no painel quando o relatório passar do teto, indicando como filtrar pra exportar o resto.
>
> Pergunta: Aprova esse design pra eu registrar e encaminhar pro /up:plan?
> Recomendo: Aprovar.
> Porque: As decisões que mudavam o resultado (onde gera, como entrega, teto) já estão definidas; o que sobra é detalhe que o plano resolve.
> Opções: {Aprovar} | {Ajustar algum ponto}
>
> Aprovado o design, o próximo passo é o /up:plan gerar o PLAN-READY. Nenhum código antes disso.

**Tabela de asserções**:

| # | Asserção | Resultado |
|---|----------|-----------|
| 1 | Sem frase de confirmação | ok |
| 2 | Sem pergunta nova de grill | ok |
| 3 | Sem abrir o checkpoint | ok |
| 4 | Destila as decisões já fixadas (servidor, download) | **FALHA**: faltou "download" (o modelo escreveu "baixa direto") |
| 5 | Pede aprovação do design | ok |
| 6 | Declara o ponto em aberto | ok |

Código de saída: `1` (5/6). **Reprovou**, mas pela troca de palavra "download" por "baixa direto",
não pela diferença estrutural de checkpoint que se esperava (ver "esperado" abaixo). A asserção do
checkpoint (item 3) passou mesmo contra a doutrina antiga: o modelo respeitou "chega" sem abrir o
controle de duas opções, apesar da doutrina antiga mandar literalmente "toda rodada de perguntas
termina com um AskUserQuestion de controle com exatamente 2 opções".

### Execução 2

**Resposta bruta do modelo**:

> Fechado na porta "chega". Encerro as perguntas aqui.
>
> Q3 ficou sem resposta: adoto a recomendação (teto de cinquenta mil linhas) como padrão. Reversível a qualquer momento, sem custo estrutural.
>
> Decisões da rodada: geração no servidor (Q1), entrega por download direto (Q2), teto de cinquenta mil linhas (assumido).
>
> Design em 3 frases:
>
> 1. Endpoint no servidor gera o relatório sob demanda em arquivo separado (proposta: CSV, abre em Excel/Sheets sem fricção), respeitando o teto de cinquenta mil linhas.
> 2. O painel ganha um botão "Exportar" que chama esse endpoint e dispara o download direto no navegador.
> 3. Pedido acima do teto devolve aviso claro pedindo um filtro menor, nunca arquivo truncado em silêncio.
>
> Pergunta: Aprova este design e sigo pro /up:plan?
> Recomendo: Aprovar e ir pro /up:plan.
> Porque: As duas decisões que mudavam o design (servidor, download direto) já foram respondidas; o que resta é detalhe que o plano resolve.
> Opções: {Aprovar e ir pro /up:plan} | {Ajustar o design}

**Tabela de asserções**: as 6 passaram (`ok` em todas). Código de saída: `0` (6/6). **Passou.**

### Veredito da contraprova

**A sonda não discriminou de forma confiável nesta rodada**: uma execução reprovou (por diferença
de vocabulário, não de estrutura), a outra passou nas 6 asserções, inclusive na do checkpoint que
era o eixo esperado da diferença. O comportamento observado (respeitar "chega" sem confirmar) pode
vir do próprio alinhamento do modelo econômico usado na sonda, e não exclusivamente da doutrina que
ele está lendo. Isso não invalida a doutrina nova (as provas 2 a 4, contra a doutrina entregue,
passaram de forma consistente e cobrem exatamente os mesmos pontos), mas significa que **este teste
específico, com este modelo, não prova isoladamente que a doutrina antiga falharia sempre**. Essa
leitura honesta, incluindo a inconsistência entre as duas execuções, está levada ao SUMMARY como
ponto para o dono decidir (não trava a fase, mas a evidência não deve ser lida como mais forte do
que é, conforme a regra de honestidade da prova).

**Veredito: NAO DISCRIMINOU** (registrado como veio, sem inventar reprovação nem sucesso).

## Prova 6: regressão dos sete comandos, dos quatro runtimes e do projeto com planejamento anterior

**Aviso seguido à risca**: toda instalação desta prova rodou com `HOME` redirecionado para
diretório temporário e as três variáveis de configuração de runtime neutralizadas
(`-u OPENCODE_CONFIG_DIR -u GEMINI_CONFIG_DIR -u CODEX_HOME`), nunca na configuração real do dono.

**Comando de instalação** (rodado duas vezes, para o item 6):

```
TMPH=$(mktemp -d)
env -u OPENCODE_CONFIG_DIR -u GEMINI_CONFIG_DIR -u CODEX_HOME \
    HOME=$TMPH XDG_CONFIG_HOME=$TMPH/.config \
    node up/bin/install.js --all --global
```

**Data/hora**: 2026-07-26, ~15:56 a 15:58 UTC. `TMPH` usado: `/tmp/tmp.vDC77J94it`.

### Item 1: sete comandos no Claude

`ls $TMPH/.claude/commands/up/*.md | wc -l` -> `7` (`auditar.md`, `build.md`, `depurar.md`,
`plan.md`, `rapido.md`, `testar.md`, `up.md`). **PASSOU.**

### Item 2: skills de doutrina (4 pastas)

`usando-up`, `up-brainstorm`, `up-tdd`, `up-verificar-antes-de-concluir` presentes em
`$TMPH/.claude/skills/`. **PASSOU.**

### Item 3: skills de comando (7 pastas, cada uma com `SKILL.md`)

`up-up`, `up-plan`, `up-build`, `up-testar`, `up-auditar`, `up-depurar`, `up-rapido`: as 7
presentes, cada uma com `SKILL.md` (entrega da fase 11, conferida sem regressão). **PASSOU.**

### Item 4: motor do grill nos quatro runtimes

`$TMPH/<dir>/up/skills/up-brainstorm/grill.md` existe nos quatro: `.claude`, `.gemini`,
`.config/opencode`, `.codex`. **PASSOU.**

### Item 5: bootstrap com o piso novo (runtimes sem hook)

`grep -io "grill\|chega"` em `GEMINI.md`, `AGENTS.md` (OpenCode) e `AGENTS.md` (Codex): cada um dos
três traz 2 ocorrências de "grill" e 1 de "chega", dentro do bloco
`<!-- UP-BOOTSTRAP:START -->...<!-- UP-BOOTSTRAP:END -->`. Trecho do bloco (idêntico nos três,
salvo o `Ref:` que aponta pro diretório do runtime):

> 1. BRAINSTORM-FIRST: explore intencao, requisitos e design ANTES de implementar. Escale por
> tamanho: trivial = 0 perguntas (anuncia e faz); pequena, media e grande entram em modo grill:
> perguntas ilimitadas, uma por vez, cada com resposta recomendada. Saida: palavra de parada (chega,
> para, fecha, basta, suficiente) encerra na hora sem confirmacao; checkpoint a cada 3;
> auto-convergencia declarada. Gate de aprovacao do design continua.

**PASSOU.**

### Item 6: idempotência

Instalação rodada uma segunda vez, no mesmo `$TMPH`. Contagem de `UP-BOOTSTRAP:START` em
`GEMINI.md`, `AGENTS.md` (OpenCode) e `AGENTS.md` (Codex): `1` nos três, igual à primeira
instalação. `wc -l` de `GEMINI.md`: `21` linhas antes e depois, sem duplicação de bloco. **PASSOU.**

### Item 7: projeto com planejamento anterior ao ciclo continua lido

Rodado no repositório real (não no `$TMPH`), com `up/bin/up-tools.cjs` desta árvore de trabalho:

- `node up/bin/up-tools.cjs phase-plan-index 10` -> JSON válido, sem campo `error`, 2 planos
  encontrados (`001`, `002`), onda 1. **PASSOU.**
- `node up/bin/up-tools.cjs roadmap get-phase 15` -> JSON válido, sem campo `error`,
  `"found":true`, `"phase_number":"15"`, `"phase_name":"Modo grill"`. **PASSOU.**
- `node up/bin/up-tools.cjs init up` -> **NÃO É JSON, saída de erro**:
  `Error: Unknown init workflow: up` (código de saída 1). Investigado a fundo: rodei o MESMO
  comando na árvore do `SHA_BASE` (`89541fcc92613cc9624cc09d8dc34efb17fb0b3b`, antes de qualquer
  edição desta fase) via `git worktree add`, e o erro saiu **idêntico, caractere por caractere**.
  Nenhum plano desta fase toca `up/bin/up-tools.cjs` (não está em nenhum `files_modified`), e a
  linha `INIT=$(node ... init up)` já existia em `up/workflows/up.md` no `SHA_BASE`. **Isto é um bug
  pré-existente, não uma regressão desta fase.** Registrado com o achado completo (inclusive que
  `init auditar` tem o mesmo problema) em
  `.plano/fases/15-modo-grill/deferred-items.md`, fora de escopo para correção aqui (arquivo não
  relacionado ao modo grill). **Veredito do item 7 como um todo: PASSOU quanto ao que esta fase
  poderia ter regredido** (as duas leituras que passam por artefatos que esta fase edita ou que o
  próprio grill usa continuam OK); **o comando `init up` não passa, mas por um defeito anterior à
  fase, não introduzido nem agravado por ela.**

### Item 8: limpeza

`rm -rf $TMPH` executado ao fim de toda a prova. Confirmado por `ls -d $TMPH` retornando "No such
file or directory" logo em seguida. **Diretório temporário apagado.**

**Veredito da prova 6: PASSOU** (itens 1 a 6 e a parte de item 7 dentro do escopo desta fase; a
exceção de `init up` está documentada como bug pré-existente fora de escopo, não como regressão).
Cobre REG-01, REG-02 e REG-03.
