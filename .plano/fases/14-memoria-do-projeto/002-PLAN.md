---
phase: 14-memoria-do-projeto
plan: 002
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [MEM-03, MEM-05, MEM-06, MEM-07, MEM-08]
files_modified:
  - up/bin/lib/memoria.cjs
  - up/bin/lib/memoria-decisao.cjs
  - up/bin/lib/memoria-decisao.test.cjs
  - up/bin/up-tools.cjs
must_haves:
  truths:
    - "Uma decisão que falha qualquer uma das três condições não gera registro nenhum"
    - "Uma decisão que passa gera registro numerado com as alternativas rejeitadas e o motivo de cada uma"
    - "Dois registros criados em sequência recebem números distintos e crescentes, calculados por varredura do que já existe"
    - "Nenhum diretório de decisões é criado enquanto não houver a primeira decisão aprovada no gate"
  artifacts:
    - path: "up/bin/lib/memoria.cjs"
      provides: "Roteador do espaço de memória do projeto na linha de comando, com os três submódulos declarados"
    - path: "up/bin/lib/memoria-decisao.cjs"
      provides: "Numeração determinística, gate das três condições, escrita do registro e mudança de status"
    - path: "up/bin/lib/memoria-decisao.test.cjs"
      provides: "Prova vermelho e verde da numeração, do gate, da criação preguiçosa e do status"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/memoria.cjs"
      via: "case novo no roteador de comandos, delegando por require"
---

# Fase 14 Plano 002: Registro de decisão determinístico

<objective>
Dar ao projeto um registro de decisão que só existe quando a decisão merece: gate de três condições em E lógico, numeração determinística por varredura, alternativas rejeitadas obrigatórias e criação preguiçosa do diretório. Abrir também o espaço de comando `memoria`, que os planos 003 e 004 vão ocupar sem tocar neste arquivo.
</objective>

**Onda:** 1. Não depende de nenhum outro plano desta fase.

**Bloqueia:** planos 003, 004 e 005 (todos consomem o roteador e o vocabulário de comando declarados aqui, cada um dono do seu submódulo).

## Contexto

Hoje a decisão do projeto mora em duas tabelas de texto (estado e projeto), nenhuma delas guarda alternativa rejeitada, e nada impede que qualquer escolha vire registro. O resultado é histórico sem valor de consulta.

A linha de comando de ferramentas já usa o padrão de espaço de nome com delegação para módulo próprio (é assim com integração de repositório e com espelho de quadro externo). Este plano segue o mesmo padrão, e é o único plano desta fase autorizado a editar o arquivo do roteador de comandos.

@up/bin/up-tools.cjs - roteador de comandos, padrão de case por espaço de nome
@up/bin/lib/core.cjs - helpers compartilhados: saída em JSON, erro fatal, geração de slug
@up/bin/lib/github.test.cjs - padrão de teste do lado UP: script simples, sem framework

## Contrato do espaço de comando (lei para os planos 003, 004 e 005)

Comando novo de primeiro nível: `memoria`, com três submódulos declarados desde já.

```
node up-tools.cjs memoria decisao <acao> [flags]
node up-tools.cjs memoria fora-de-escopo <acao> [flags]     (plano 003)
node up-tools.cjs memoria glossario <acao> [flags]          (plano 004)
node up-tools.cjs memoria termo <acao> [flags]              (plano 005)
```

O roteador conhece os quatro nomes e carrega o módulo correspondente por caminho relativo. Módulo ausente devolve erro legível, nunca rastro de pilha. Todo submódulo exporta `run(cwd, args)` e devolve `{ result, resumo }`; quem imprime é o roteador. Falha de regra é lançada como exceção com mensagem em português, e o roteador a converte em erro fatal com código de saída 1.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/memoria.cjs (novo)</files>
<contrato>Módulo CommonJS, sem dependência externa, no estilo dos demais módulos de `up/bin/lib/`: aspas simples, ponto e vírgula, dois espaços de indentação, exports nomeados em objeto literal no fim do arquivo.</contrato>
<action>
Criar o roteador e os helpers compartilhados dos quatro submódulos.

Constante `SUBMODULOS`: mapa de nome do submódulo para caminho relativo do módulo, com exatamente quatro entradas: `decisao` para `./memoria-decisao.cjs`, `fora-de-escopo` para `./memoria-rejeicoes.cjs`, `glossario` para `./memoria-glossario.cjs` e `termo` para `./memoria-termo.cjs`.

Funções de caminho, todas recebendo o diretório de trabalho e devolvendo caminho absoluto sem criar nada: `dirPlano`, `dirDecisoes` (subdiretório `decisoes`), `dirForaDeEscopo` (subdiretório `fora-de-escopo`), `arquivoGlossarioProjeto` (arquivo `GLOSSARY.md` dentro do diretório de planejamento).

Função `garantirDir(dir)`: cria o diretório com recursão e devolve o caminho. É a única função do módulo autorizada a criar diretório, e submódulo só a chama depois que a regra de admissão passou.

Função `lerFlag(args, nome)`: aceita as duas formas de passagem, `--nome valor` e `--nome=valor`, e devolve o valor com espaços das pontas removidos, ou nulo quando ausente ou vazio.

Função `lerFlags(args, nome)`: mesma leitura, para flag repetível, devolvendo lista na ordem de aparição, possivelmente vazia.

Função `contarPalavras(texto)`: conta sequências separadas por espaço em branco, devolvendo zero para nulo ou vazio.

Função `run(cwd, args, raw)`: pega `args[0]` como nome do submódulo. Nome ausente ou desconhecido gera erro fatal listando os quatro nomes válidos. Carrega o módulo dentro de bloco protegido; falha de carga vira erro fatal com a mensagem de que o submódulo ainda não está instalado neste pacote. Chama `run(cwd, args.slice(1))` do submódulo dentro de bloco protegido; exceção lançada vira erro fatal com a mensagem da exceção; sucesso vira saída pelo helper de saída padrão, passando `result` e `resumo`.
</action>
<aceite>O módulo carrega sem erro. Chamar com nome desconhecido devolve código de saída 1 e mensagem listando os quatro nomes. Chamar `memoria glossario` antes do plano 004 existir devolve erro legível de submódulo ausente, sem rastro de pilha.</aceite>
<prova>lógica: teste da tarefa 6 cobre nome desconhecido e submódulo ausente.</prova>
</task>

<task id="2" type="auto">
<files>up/bin/lib/memoria-decisao.cjs (novo)</files>
<contrato>Submódulo do espaço `memoria`. Exporta `run(cwd, args)` e também as funções internas usadas pelo teste. Nenhuma ação de escrita acontece nas ações de leitura.</contrato>
<action>
Implementar a leitura e a numeração.

Função `listarRegistros(cwd)`: lê o diretório de decisões; diretório ausente devolve lista vazia sem criar nada. Considera apenas arquivo cujo nome casa com quatro dígitos, hífen, slug em minúsculas e sufixo de markdown. Devolve lista de objetos com número inteiro, slug e nome do arquivo, ordenada por número crescente.

Função `proximoNumero(cwd)`: devolve 1 quando não há registro, senão o maior número encontrado mais um. A varredura é a fonte, nunca um contador guardado em arquivo.

Função `formatarNumero(n)`: devolve o número com quatro dígitos e zeros à esquerda.

Ação `proximo-numero`: devolve `result` com o próximo número já formatado, a lista de números existentes e um booleano dizendo se o diretório existe. Resumo em uma linha com o próximo número.

Ação `listar`: devolve `result` com a lista de registros (número, slug, título lido do frontmatter, status lido do frontmatter). Diretório ausente devolve lista vazia e o booleano em falso.
</action>
<aceite>Com diretório ausente, `proximo-numero` devolve 1 e não cria diretório nenhum. Com registros de números 1, 2 e 7 gravados, devolve 8. Buraco na sequência não é preenchido: a regra é maior mais um.</aceite>
<prova>lógica: teste da tarefa 6, casos de diretório ausente, sequência contínua e sequência com buraco.</prova>
</task>

<task id="3" type="auto">
<files>up/bin/lib/memoria-decisao.cjs</files>
<contrato>Ação `criar`. O gate das três condições é conjuntivo e mecânico: faltou uma, não escreve nada, nem diretório.</contrato>
<action>
Implementar a ação `criar`, com as flags: `--titulo`, `--contexto`, `--decisao`, `--motivo`, `--dificil-reverter`, `--surpreendente`, `--trade-off`, `--alternativa` (repetível), `--status` (opcional), `--fase` (opcional), `--slug` (opcional).

Gate das três condições, avaliado antes de qualquer escrita. Cada uma das três justificativas precisa existir e ter no mínimo três palavras. A checagem coleta todas as faltas antes de falhar, e a mensagem de erro nomeia quais condições faltaram, para o dono não descobrir uma por vez. Falta de qualquer uma lança exceção e nada é criado.

Regra das alternativas: pelo menos uma ocorrência de `--alternativa`, cada uma no formato `nome :: motivo`, com nome e motivo não vazios. Ocorrência fora do formato lança exceção citando a ocorrência inválida.

Regra dos campos de conteúdo: título, contexto, decisão e motivo são obrigatórios e não vazios. Motivo, contexto e decisão são texto livre de até três frases, e o módulo não corta nem reescreve o texto do dono.

Status: valores aceitos são `proposta` e `aceita`. Ausente vale `aceita`. O valor `substituida` não é aceito na criação, porque um registro nasce substituído por ninguém.

Slug: quando ausente, deriva do título com o helper de slug de `core.cjs`, cortado em quarenta e oito caracteres, sem hífen sobrando nas pontas.

Escrita: só aqui o diretório de decisões é criado, e só depois de todas as regras passarem. Nome do arquivo: número com quatro dígitos, hífen, slug, sufixo de markdown. Conteúdo, nesta ordem exata:

```
---
numero: "0001"
slug: onda-derivada
titulo: Onda passa a ser visao derivada
status: aceita
substituida_por: null
data: 2026-07-25
fase: 14
---

# 0001. <titulo>

## Contexto
<contexto>

## Decisao
<decisao>

## Motivo
<motivo>

## Condicoes do gate
- Dificil de reverter: <justificativa>
- Surpreendente sem contexto: <justificativa>
- Trade-off real: <justificativa>

## Alternativas rejeitadas
- <nome>: <motivo>
```

O campo de fase sai do frontmatter quando a flag não foi passada. A data é a data corrente no formato ano, mês e dia. O texto dos cabeçalhos do corpo é gravado com acentuação correta; a amostra acima está sem acento apenas para não ambiguar o contrato dentro deste plano.

Retorno: `result` com criado verdadeiro, número formatado, caminho relativo do arquivo, status e contagem de alternativas. Resumo em uma linha com número e caminho.
</action>
<aceite>Chamada sem uma das três justificativas devolve código de saída 1, a mensagem nomeia a condição faltante, e o diretório de decisões continua inexistente. Chamada completa cria o arquivo com as seções de contexto, decisão, motivo, condições do gate e alternativas rejeitadas, com uma linha por alternativa. Chamada sem alternativa nenhuma falha.</aceite>
<prova>lógica: teste da tarefa 6, com um caso por condição faltante, um caso sem alternativa e um caso completo.</prova>
</task>

<task id="4" type="auto">
<files>up/bin/lib/memoria-decisao.cjs</files>
<contrato>Ação `status`, que muda o status de um registro existente. É a única forma de um registro chegar a substituído, porque a substituição só é conhecida depois.</contrato>
<action>
Implementar a ação `status`, com as flags `--numero`, `--status` e `--substituida-por`.

Registro inexistente lança exceção citando o número procurado. Status aceito: `proposta`, `aceita` e `substituida`. Status `substituida` exige `--substituida-por` com número de registro existente; ausência ou número inexistente lança exceção. Os demais status recusam `--substituida-por`.

A escrita altera apenas as linhas de status e de substituído por dentro do frontmatter, preservando o restante do arquivo byte a byte. Retorno com número, status anterior, status novo e o número substituidor quando houver.
</action>
<aceite>Marcar um registro como substituído grava o status e o número substituidor no frontmatter e mantém o corpo idêntico. Marcar como substituído sem informar o substituidor falha com código de saída 1. Informar substituidor inexistente falha.</aceite>
<prova>lógica: teste da tarefa 6, com comparação do corpo antes e depois da mudança de status.</prova>
</task>

<task id="5" type="auto">
<files>up/bin/up-tools.cjs</files>
<contrato>Roteador de comandos. Ganha um case novo e uma linha no bloco de uso do topo do arquivo. Nenhum case existente é alterado.</contrato>
<action>
Acrescentar, no bloco de comentário de uso do topo do arquivo, uma linha descrevendo o comando novo: `memoria decisao|fora-de-escopo|glossario|termo <acao>`.

Acrescentar ao roteador um case para `memoria`, posicionado logo depois do case do espelho de quadro externo, que carrega o módulo do roteador de memória por require relativo e chama `run(cwd, args.slice(1), raw)`. O require fica dentro do case, e não no topo do arquivo, para não pagar carga em todo comando.

Acrescentar o nome do comando novo à mensagem de uso emitida quando nenhum comando é passado.
</action>
<aceite>Rodar `memoria decisao proximo-numero` em um projeto com diretório de planejamento devolve JSON válido. Rodar `memoria` sem submódulo devolve código de saída 1 e a lista dos quatro nomes. Todos os comandos já existentes continuam respondendo.</aceite>
<prova>smoke: rodar os comandos `state load`, `phase-plan-index 14` e `memoria decisao proximo-numero` neste repositório e colar a saída no resumo do plano.</prova>
</task>

<task id="6" type="auto">
<files>up/bin/lib/memoria-decisao.test.cjs (novo)</files>
<contrato>Teste no padrão já usado no lado UP: script executável direto por Node, sem framework, com contador de aprovados e reprovados e código de saída diferente de zero quando algo falha. Cada caso monta um projeto temporário próprio em diretório temporário do sistema e limpa ao final.</contrato>
<action>
Escrever os casos, todos vistos falhar antes de a implementação existir e passar depois. Ordem sugerida de escrita: escrever o teste primeiro, rodar e registrar a falha, depois implementar.

Casos de numeração: diretório ausente devolve o primeiro número e não cria diretório; sequência com números 1, 2 e 7 devolve 8; dois registros criados em sequência recebem números distintos e crescentes.

Casos do gate: uma chamada por condição faltante (três casos), cada uma falhando e deixando o diretório inexistente; chamada sem alternativa falhando; justificativa com menos de três palavras falhando; chamada completa criando o arquivo.

Casos de conteúdo: o arquivo criado contém as cinco seções obrigatórias e uma linha por alternativa; o frontmatter traz número, slug, status e data.

Casos de status: mudança para proposta e para aceita; mudança para substituída sem substituidor falha; com substituidor inexistente falha; com substituidor válido grava e preserva o corpo.

Caso de roteamento: submódulo desconhecido falha com código de saída 1; submódulo declarado mas ainda não instalado falha com mensagem legível.

Caso de linha de comando: uma execução real do binário de ferramentas, em projeto temporário, conferindo o código de saída 1 no caso reprovado e 0 no caso aprovado.
</action>
<aceite>`node up/bin/lib/memoria-decisao.test.cjs` imprime a contagem final e sai com código zero. Antes da implementação das tarefas 2, 3 e 4, o mesmo comando sai com código diferente de zero, e essa falha é registrada no resumo do plano.</aceite>
<prova>lógica, vermelho e verde: saída do teste falhando antes e passando depois, colada no resumo.</prova>
</task>

## Critérios de Sucesso

- [ ] O gate das três condições é conjuntivo e mecânico, e faltar uma impede a escrita
- [ ] A numeração sai de varredura do diretório, é crescente e não reaproveita buraco
- [ ] O registro contém título, contexto, decisão, motivo e alternativas rejeitadas com motivo por alternativa
- [ ] O status aceita proposta, aceita e substituída por outro registro
- [ ] Nenhum diretório é criado antes de existir conteúdo real aprovado no gate
- [ ] O espaço de comando `memoria` está aberto com os três submódulos declarados e erro legível para o que ainda não existe
- [ ] O teste foi visto falhar antes de passar

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Implementar a base de rejeições. Isso é o plano 003, dono do módulo de rejeições.
- Implementar a contagem de redefinições do glossário interno (plano 004) ou o glossário do projeto (plano 005). Cada um é dono do seu submódulo.
- Escrever doutrina de quando o agente deve chamar estes comandos. Isso é o plano 005, dono da skill de brainstorm.
- Migrar as decisões que já estão nas tabelas do documento de estado e do documento de projeto. Registro antigo fica onde está: este ciclo não reescreve histórico.
- Criar registro de decisão de verdade neste repositório. A fase decide o mecanismo, não popula a base.
- Mudar qualquer subcomando existente da linha de comando de ferramentas.
