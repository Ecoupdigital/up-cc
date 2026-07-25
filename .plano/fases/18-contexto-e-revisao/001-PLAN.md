---
phase: 18-contexto-e-revisao
plan: 001
type: logic
autonomous: true
wave: 1
depends_on: []
requirements: [CTX-01, CTX-02, CTX-04, CTX-05, CTX-06, CTX-07, CTX-08]
objective: "Primitiva de handoff, contador de janela e registro de higiene, todos deterministicos na CLI"
prova: logica (vermelho e verde)
files_modified:
  - up/bin/lib/contexto.cjs
  - up/bin/lib/contexto.test.cjs
  - up/bin/lib/janela.cjs
  - up/bin/lib/janela.test.cjs
  - up/bin/up-tools.cjs
must_haves:
  truths:
    - "Uma sessao nova consegue continuar o trabalho lendo apenas o documento de handoff e os ponteiros dele"
    - "O handoff nasce fora do repositorio e nao entra em nenhum commit"
    - "Segredo colado no texto do handoff vira rotulo redigido antes de o arquivo existir em disco"
    - "Conteudo que ja vive num artefato do projeto e recusado na escrita, com a indicacao de onde ele ja mora"
    - "O sistema sabe dizer se a janela de contexto virou entre o brainstorm e o planejamento"
  artifacts:
    - path: "up/bin/lib/contexto.cjs"
      provides: "Redacao de segredo, indice de linhas dos artefatos, deteccao de duplicacao e escrita do handoff"
    - path: "up/bin/lib/janela.cjs"
      provides: "Contador de janela por projeto, marcacao do briefing e comparacao"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/contexto.cjs e up/bin/lib/janela.cjs"
      via: "casos handoff, janela e higiene de fase no despachante"
---

# Fase 18 Plano 001: Ferramentas determinísticas de higiene de contexto

**Onda**: 1 (sem dependência; roda em paralelo com o plano 004)

## Objetivo

Entregar tudo o que a higiene de contexto precisa ter em código, para que a doutrina do plano 002 tenha
o que chamar em vez de só recomendar. São três mecanismos, todos determinísticos e todos testáveis:

A primitiva de handoff, que comprime o fio vivo num documento gravado em diretório temporário do sistema
e aplica as quatro regras duras (fora do repositório, comandos sugeridos obrigatórios, referência em vez
de cópia, segredo redigido). O julgamento do que resumir é do agente; a aplicação das regras é do código,
porque regra que só vive em prosa não é provável.

O contador de janela, que permite responder se houve corte de contexto entre o momento em que o briefing
foi escrito e o momento em que o planejamento começou.

O registro de higiene da fase, que grava a fronteira de limpeza entre execuções de plano.

Este plano também entrega a biblioteca que o plano 003 vai consumir para aplicar a mesma regra de
referência ao documento de estado. Uma implementação, dois consumidores.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisões P1 e P4),
`.plano/codebase/CONVENTIONS.md` (padrões de CLI, tratamento de erro e exportação),
`up/bin/lib/github.test.cjs` (formato de teste sem framework em uso no repositório) e
`up/bin/lib/core.cjs` (funções de saída e de erro).

Regra dura de edição, porque outros planos da fase também tocam o despachante em ondas seguintes: nunca
reescrever `up/bin/up-tools.cjs` inteiro. Somente edição por âncora, relendo o arquivo imediatamente
antes. Se a edição falhar porque o arquivo mudou, reler e reaplicar.

## Tarefas

### 1. Escrever os testes das duas bibliotecas e vê-los falhar

Criar `up/bin/lib/contexto.test.cjs` e `up/bin/lib/janela.test.cjs` no mesmo formato de
`up/bin/lib/github.test.cjs`: sem framework, com asserção nativa, contador de passou e falhou, rodáveis
por node direto, com código de saída diferente de zero quando há falha.

Casos obrigatórios de redação. Cada um destes textos, passado pela função de redação, não pode sobreviver
em claro na saída, e o rótulo correspondente tem de aparecer na lista de redações: chave começando em
`sk-` com vinte ou mais caracteres; token de repositório começando em `ghp_`, `gho_`, `ghu_`, `ghs_` ou
`ghr_`; chave de nuvem começando em `AKIA` com dezesseis maiúsculas ou dígitos; token de mensageria
começando em `xoxb-`; token de três segmentos começando em `eyJ`; bloco delimitado por linha de início e
fim de chave privada; atribuição no formato senha, password, token, api_key, secret e authorization com
Bearer; credencial embutida em endereço no formato esquema, usuário, senha e host; documento de pessoa
física no formato com pontos e traço; endereço de e-mail. Um caso negativo obrigatório: o texto
`o executor terminou a tarefa 3 e o teste passou` atravessa sem nenhuma redação.

Casos obrigatórios de duplicação. Montar um projeto temporário com um resumo de fase contendo uma linha
de sessenta caracteres. Copiar essa linha para dentro de um campo do handoff faz a escrita recusar, com a
linha ofensora e o caminho relativo do artefato onde ela já mora no resultado. Uma paráfrase da mesma
ideia atravessa. Uma linha curta, de menos de quarenta caracteres, idêntica a uma linha do artefato,
atravessa, porque abaixo do limiar de significância não há cópia, há coincidência.

Casos obrigatórios de escrita do handoff. Chamada sem nenhum comando sugerido recusa e nomeia o campo
faltante. Com um comando, escreve. O caminho devolvido começa pelo diretório temporário do sistema e não
está contido no diretório do projeto. Rodar com a variável de ambiente de diretório temporário apontando
para dentro do projeto faz a escrita recusar, em vez de gravar dentro do repositório. Ponteiro absoluto
recusa. Ponteiro relativo inexistente recusa. Ponteiro relativo existente entra na seção de ponteiros.

Casos obrigatórios do contador de janela. Projeto sem marcador devolve contador zero e a marca de
marcador ausente, sem lançar. Três registros de reinício seguidos levam o contador a três. Dois projetos
diferentes têm contadores independentes. Marcar um briefing grava a marca no frontmatter dele, e marcar
de novo substitui em vez de duplicar a chave. Comparar briefing marcado com a janela vigente igual
devolve corte falso; com a janela vigente maior devolve corte verdadeiro e a diferença; briefing sem
marca devolve indeterminado, e nunca corte falso, porque ausência de marca não é prova de continuidade.

Rodar os dois arquivos e registrar as saídas vermelhas. Elas são a metade vermelha da prova.

### 2. Implementar a biblioteca de higiene de contexto

Criar `up/bin/lib/contexto.cjs`, CommonJS, sem dependência externa, exportando por objeto literal no fim
do arquivo, conforme a convenção do repositório.

A função de redação devolve o texto redigido e a lista de rótulos com contagem de ocorrências. A
substituição é sempre um marcador no formato de rótulo entre colchetes. Rótulos: chave de interface,
token de repositório, chave de nuvem, token de mensageria, token de três segmentos, chave privada, senha,
credencial em endereço, documento pessoal e e-mail. A ordem de aplicação importa: primeiro os formatos
com prefixo fixo, depois a atribuição genérica, por último o e-mail, para que um endereço dentro de uma
atribuição já tenha sido coberto pela regra mais específica.

A função de índice de artefatos devolve um mapa de linha normalizada para caminho relativo do artefato
onde ela aparece. Artefatos indexados, todos opcionais: o arquivo de plano pronto, o documento de estado,
o roadmap, o mapa git, o log de aprovações e todo resumo de fase dentro do diretório de fases. Aceita uma
lista de artefatos a excluir, porque o plano 003 precisa tirar o próprio documento de estado do índice.
Normalização: remover marcador de lista, marcador de título e espaço de borda, colapsar espaço interno e
passar para minúsculas. Entram no índice apenas linhas com quarenta ou mais caracteres depois de
normalizadas.

A função de detecção de duplicação devolve a lista de linha e artefato das linhas do texto que batem com
o índice.

A função de resolução de caminho devolve o caminho absoluto dentro do diretório temporário do sistema, no
formato de prefixo do produto, nome do diretório do projeto e carimbo compacto. Se o caminho resolvido
estiver contido no diretório do projeto, a função lança, porque gravar dentro do repositório viola a
regra de o handoff nunca ser versionado.

A função de montagem devolve a string do documento. A função de escrita orquestra: valida obrigatórios,
valida ponteiros, redige, detecta duplicação, resolve caminho, grava e devolve caminho, tamanho, seções,
comandos, ponteiros, redações e duplicações. Quando há duplicação, não grava nada e devolve a lista
preenchida.

Formato do documento produzido, nesta ordem: bloco de frontmatter com data de geração, nome do projeto,
fase quando informada, origem igual a handoff e a marca de não versionado; título; uma linha de aviso
dizendo que o documento é efêmero, vive fora do repositório e não deve ser versionado nem copiado para
dentro do projeto; seção do que está em voo; seção do porquê; seção do próximo passo; seção de comandos
sugeridos, com um item por comando em código em linha; seção de ponteiros, com um item por caminho
relativo; seção de redações aplicadas, com um item por rótulo, ou a frase de que nada foi redigido.

O documento gerado usa português acentuado nos títulos de seção. As chaves do resultado em JSON seguem a
convenção do repositório, sem acento.

### 3. Implementar o contador de janela

Criar `up/bin/lib/janela.cjs`, CommonJS, zero dependência externa, exportando por objeto literal.

O marcador vive no diretório temporário do sistema, um por projeto, com nome derivado de um resumo curto
e estável do caminho absoluto do projeto. Conteúdo: contador inteiro, data da última atualização, origem
do último reinício e o caminho do projeto.

Funções exportadas: registrar reinício de contexto, que incrementa e grava; ler o estado atual, que
devolve contador, origem e data, tolerando ausência do arquivo; marcar um arquivo de briefing, que
escreve ou substitui a chave de janela no frontmatter dele, criando o bloco de frontmatter quando o
arquivo não tem; e comparar um arquivo de briefing com o estado atual, devolvendo se cortou, a marca
gravada, a janela vigente e a diferença.

Todas as leituras são tolerantes a falha: arquivo corrompido equivale a arquivo ausente. Higiene de
contexto nunca pode derrubar um comando.

### 4. Ligar o caso de handoff no despachante

Em `up/bin/up-tools.cjs`, acrescentar o caso de handoff, com o cabeçalho de comentário de seção no padrão
do arquivo. Assinatura pública do subcomando de escrita: campos de texto do que está em voo, do porquê e
do próximo passo, todos obrigatórios; sinalizador de comando repetível, com pelo menos um; sinalizador de
ponteiro repetível; número de fase opcional; mais os sinalizadores gerais de diretório e de saída crua.

Saída de sucesso: o objeto devolvido pela biblioteca, pela função de saída padrão. Com saída crua,
escrever apenas o caminho absoluto, para o workflow capturar em variável.

Saída de falha pela função de erro padrão, com código diferente de zero e mensagem que diz o que
corrigir. Três mensagens distintas: campo obrigatório ausente, ponteiro inválido, e duplicação. A
mensagem de duplicação lista cada linha ofensora e o artefato onde ela já mora, e termina instruindo a
trocar a cópia por um ponteiro.

Acrescentar também a listagem de handoffs do projeto atual existentes no diretório temporário, ordenados
do mais recente para o mais antigo, com caminho e data, para a sessão nova achar o documento sem depender
de o dono ter guardado o caminho.

### 5. Ligar os casos de janela e de higiene de fase no despachante

No mesmo arquivo, acrescentar o caso de janela com três subcomandos: estado, que devolve o estado atual;
marcação, que grava a marca vigente no frontmatter do arquivo informado; e comparação, que devolve se
cortou. Todos aceitam diretório e saída crua. Na saída crua, a comparação escreve apenas uma palavra,
entre cortou, intacta e indeterminada, para o workflow ramificar em shell sem parsear JSON.

Acrescentar, dentro da seção de fase que já existe, o registro de limpeza, que anexa uma linha ao arquivo
de higiene da fase, dentro do diretório da fase, no formato de campos separados por barra vertical,
começando pelo carimbo de tempo e trazendo o rótulo de limpeza, a onda e o plano seguinte. Cria o arquivo
com um cabeçalho de uma linha quando ele não existe. Acrescentar a consulta de higiene, que devolve a
contagem de fronteiras registradas e a lista de linhas.

Atualizar o bloco de comentário do topo do arquivo, que lista os subcomandos disponíveis, incluindo os
três novos na mesma forma dos vizinhos. Se houver texto de uso impresso em caso de subcomando
desconhecido, incluir os novos ali também.

### 6. Ver os testes passarem

Rodar os dois arquivos de teste e registrar as saídas verdes, com o número de casos. Guardar as quatro
saídas (as duas vermelhas da tarefa 1 e as duas verdes daqui) no resumo do plano: elas são a prova.

### 7. Smoke de ponta a ponta

Num diretório de trabalho de teste, rodar o subcomando de handoff com um texto que contenha uma chave
falsa e uma linha copiada de um resumo existente. Conferir que a primeira chamada recusa por duplicação,
que depois de trocar a cópia por ponteiro a chamada grava, que o arquivo está no diretório temporário,
que a seção de comandos sugeridos existe e que a chave aparece como rótulo redigido.

Rodar o registro de fronteira de limpeza duas vezes numa fase de teste e conferir que a consulta devolve
duas linhas com onda e plano seguinte preenchidos.

Conferir com o estado do repositório que a árvore de trabalho continua limpa depois de tudo, o que prova
do lado do repositório que o handoff não é versionado.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/bin/lib/contexto.cjs` | Novo. Redação de segredo, índice de artefatos com exclusão configurável, detecção de duplicação, resolução de caminho temporário, montagem e escrita do handoff. Zero dependência externa. Nunca grava dentro do diretório do projeto |
| `up/bin/lib/janela.cjs` | Novo. Contador de janela por projeto no diretório temporário, marcação de briefing e comparação. Leitura tolerante a falha |
| `up/bin/lib/contexto.test.cjs` e `up/bin/lib/janela.test.cjs` | Novos. Testes sem framework, rodáveis por node direto, com código de saída diferente de zero em falha |
| `up/bin/up-tools.cjs` | Editado por âncora, nunca reescrito. Ganha os casos de handoff e de janela, mais o registro e a consulta de higiene dentro da seção de fase, mais a menção na lista de subcomandos do cabeçalho. Nenhum comportamento existente muda |

## Critério de aceite

O subcomando grava o documento no diretório temporário do sistema e o caminho devolvido não está contido
no diretório do projeto. Chamada sem comando sugerido é recusada. Texto com segredo sai com rótulo
redigido e a contagem de redações aparece no resultado. Linha copiada de artefato do projeto é recusada
com o apontamento de onde ela já mora, e a mesma informação passa quando entra como ponteiro relativo.
Ponteiro absoluto e ponteiro inexistente são recusados.

O contador de janela distingue os três resultados de comparação, e dois projetos diferentes não se
misturam. O registro de fronteira grava uma linha por chamada e a consulta devolve a contagem.

A árvore de trabalho e o diff continuam limpos depois da execução. Os testes rodam verdes e foram vistos
vermelhos antes.

## Tipo de prova

Lógica, vermelho e verde. As quatro saídas dos arquivos de teste, as vermelhas antes da implementação e
as verdes depois, entram no resumo do plano. O smoke da tarefa 7 é prova complementar, não substitui.

## FORA DE ESCOPO

A doutrina que manda usar estas ferramentas. É o plano 002, que edita o gancho de início de sessão, a
skill de brainstorm e os workflows de porta única, de planejamento e de construção. Este plano não toca
em nenhum arquivo de doutrina nem de workflow.

A decisão de quando fazer handoff. Vem do limiar de zona segura e do monitor, que são do plano 005.

A aplicação da regra de referência ao documento de estado. É o plano 003, que consome esta biblioteca.

Compressão automática da conversa. O agente redige os três campos de fio vivo; a biblioteca não lê
transcrição nem resume nada.

Qualquer forma de versionar o handoff, inclusive cópia de conveniência dentro do projeto.

Unificar o arquivo de retomada versionado do workflow de pausa com o handoff efêmero. Os dois convivem:
um é pausa versionada, o outro é bifurcação efêmera.
