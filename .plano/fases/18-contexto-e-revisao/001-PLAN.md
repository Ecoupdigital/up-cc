---
phase: 18-contexto-e-revisao
plan: "001"
type: logic
autonomous: true
wave: 1
depends_on: []
requirements: [CTX-01, CTX-02, CTX-04, CTX-05, CTX-06, CTX-07, CTX-08]
objective: "Primitiva de handoff, contador de janela e registro de higiene, todos deterministicos na CLI"
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
files_modified:
  - up/bin/lib/contexto.cjs
  - up/bin/lib/contexto.test.cjs
  - up/bin/lib/janela.cjs
  - up/bin/lib/janela.test.cjs
  - up/bin/up-tools.cjs
  - .plano/fases/18-contexto-e-revisao/evidencia/001-red.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/001-green.txt
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

<objective>
Entregar em código as três ferramentas que a higiene de contexto precisa ter para deixar de ser conselho: a primitiva de handoff com as quatro regras duras aplicadas por máquina, o contador de janela que detecta corte entre o brainstorm e o planejamento, e o registro de fronteira de limpeza da fase.
</objective>

**Onda:** 1. **Depende de:** nada dentro da fase. A fase inteira depende das fases 13 e 16 (ver CONTEXT.md).
**Tipo de prova:** lógica, vermelho e verde. As saídas vermelha e verde ficam gravadas em `evidencia/`.

## Por que em código, e não em prosa

O julgamento do que resumir é do agente. A aplicação das regras não pode ser: regra que só vive em texto
não é provável, e as quatro deste assunto (fora do repositório, comandos sugeridos obrigatórios,
referência em vez de cópia, segredo redigido) falham em silêncio quando dependem de boa vontade.

A biblioteca de contexto tem dois consumidores desde o desenho: o handoff, aqui, e o documento de estado,
no plano 003. Uma implementação, dois consumidores, porque duas cópias da mesma regra é o defeito que o
dono já apontou no leitor do log de aprovações.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisões P1 e P4, e a regra de edição por âncora
@.plano/codebase/CONVENTIONS.md - padrão de CLI, tratamento de erro e exportação por objeto literal
@up/bin/lib/github.test.cjs - padrão de teste sem framework do repositório
@up/bin/lib/test-helpers.cjs - helper de teste entregue pela fase 16 (projeto temporário, CLI como subprocesso, corredor)
@up/bin/up-tools.cjs - despachante, funções de saída e de erro, flag de diretório

O helper de teste e o corredor `test:up` são entregues pela fase 16, que fecha antes desta por aresta
declarada. Se não existirem, parar e escalar: duplicar infraestrutura de teste é o mesmo erro que
duplicar leitor de log.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/contexto.test.cjs (novo), up/bin/lib/janela.test.cjs (novo), .plano/fases/18-contexto-e-revisao/evidencia/001-red.txt (novo)</files>
<action>
Escrever os dois arquivos de teste ANTES da implementação e VER FALHAR. O passo vermelho não pode ser pulado.

Usar `up/bin/lib/test-helpers.cjs` da fase 16 para projeto temporário e corredor. Cabeçalho no topo de cada arquivo declarando escopo e requisitos cobertos.

Casos de `contexto.test.cjs`, redação. Cada texto abaixo, passado por `redigirSegredos`, não pode sobreviver em claro, e o rótulo tem de aparecer na lista de redações: chave começando em `sk-` com vinte ou mais caracteres; token começando em `ghp_`, `gho_`, `ghu_`, `ghs_` ou `ghr_`; chave começando em `AKIA` com dezesseis maiúsculas ou dígitos; token começando em `xoxb-`; token de três segmentos começando em `eyJ`; bloco entre linhas de início e fim de chave privada; atribuição nos formatos `senha: v`, `password=v`, `token: v`, `api_key=v`, `secret: v` e `authorization: Bearer v`; credencial embutida em endereço no formato `esquema://usuario:senha@host`; documento de pessoa física com pontos e traço; endereço de e-mail. Caso negativo obrigatório: `o executor terminou a tarefa 3 e o teste passou` atravessa com zero redações.

Casos de duplicação. Projeto temporário com `.plano/fases/03-x/03-001-SUMMARY.md` contendo uma linha de sessenta caracteres. Copiar essa linha para um campo do handoff faz `escreverHandoff` recusar, devolvendo a linha ofensora e o caminho relativo do artefato onde ela mora. Paráfrase da mesma ideia atravessa. Linha idêntica de menos de quarenta caracteres atravessa, porque abaixo do limiar não há cópia, há coincidência.

Casos de escrita. Sem nenhum comando sugerido, recusa nomeando o campo faltante. Com um comando, escreve. O caminho devolvido começa pelo diretório temporário do sistema e não está contido no diretório do projeto. Com a variável de ambiente de diretório temporário apontando para dentro do projeto, recusa em vez de gravar no repositório. Ponteiro absoluto recusa. Ponteiro relativo inexistente recusa. Ponteiro relativo existente aparece na seção de ponteiros. O documento gravado contém as seis seções obrigatórias, conferidas por título.

Casos de `janela.test.cjs`. Projeto sem marcador devolve contador zero e marcador ausente, sem lançar. Três registros de reinício levam o contador a três. Dois projetos diferentes têm contadores independentes. Marcar um briefing grava a chave de janela no frontmatter, e marcar de novo substitui em vez de duplicar. Comparar briefing marcado com a janela vigente igual devolve `intacta`; com a vigente maior devolve `cortou` e a diferença; briefing sem marca devolve `indeterminada`, nunca `intacta`, porque ausência de marca não é prova de continuidade. Arquivo de marcador corrompido equivale a ausente.

Rodar os dois arquivos, confirmar que falham (módulos inexistentes) e gravar as duas saídas concatenadas em `evidencia/001-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && { node up/bin/lib/contexto.test.cjs; node up/bin/lib/janela.test.cjs; } > .plano/fases/18-contexto-e-revisao/evidencia/001-red.txt 2>&1; grep -qiE "FAIL|failed|Cannot find module" .plano/fases/18-contexto-e-revisao/evidencia/001-red.txt && echo "RED confirmado"</automated></verify>
<done>Os dois arquivos de teste existem, cobrem todos os casos listados, falham por ausência das bibliotecas, e a saída vermelha está gravada em `evidencia/001-red.txt`.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/contexto.cjs (novo)</files>
<action>
Implementar a biblioteca de higiene de contexto. CommonJS, zero dependência externa, exportação por objeto literal no fim do arquivo.

`redigirSegredos(texto)` devolve `{ texto, redacoes }`, com `redacoes` como lista de `{ rotulo, ocorrencias }`. Substituição sempre no formato `[REDIGIDO:rotulo]`. Rótulos: `chave-api`, `token-repositorio`, `chave-nuvem`, `token-mensageria`, `token-tres-segmentos`, `chave-privada`, `senha`, `credencial-em-endereco`, `documento-pessoal`, `email`. Ordem de aplicação: primeiro os formatos com prefixo fixo, depois a atribuição genérica, por último e-mail, para que endereço dentro de atribuição já tenha sido coberto pela regra mais específica.

`indiceDeArtefatos(cwd, excluir)` devolve mapa de linha normalizada para caminho relativo do artefato. Artefatos indexados, todos opcionais: `.plano/PLAN-READY.md`, `.plano/STATE.md`, `.plano/ROADMAP.md`, `.plano/git-map.json`, `.plano/governance/approvals.log` e todo arquivo de resumo sob `.plano/fases/`. O parâmetro `excluir` é lista de caminhos relativos que não entram no índice, e existe porque o plano 003 precisa tirar o próprio documento de estado. Normalização: remover marcador de lista, marcador de título e espaço de borda, colapsar espaço interno, minúsculas. Entram apenas linhas com quarenta ou mais caracteres após normalizadas.

`detectarDuplicacao(texto, indice)` devolve lista de `{ linha, artefato }`.

`caminhoDeHandoff(cwd, agora)` devolve caminho absoluto no diretório temporário do sistema, no formato `up-handoff-<nome do diretório do projeto>-<carimbo compacto>.md`. Se o caminho resolvido estiver contido no diretório do projeto, lança: gravar dentro do repositório viola CTX-05.

`montarHandoff(campos)` devolve a string do documento, nesta ordem: frontmatter com data de geração, projeto, fase quando informada, origem igual a handoff e a marca de não versionado; título; uma linha de aviso dizendo que o documento é efêmero, vive fora do repositório e não deve ser versionado nem copiado para dentro do projeto; seção do que está em voo; seção do porquê; seção do próximo passo; seção de comandos sugeridos, um item por comando em código em linha; seção de ponteiros, um item por caminho relativo; seção de redações aplicadas, um item por rótulo, ou a frase de que nada foi redigido.

`escreverHandoff(cwd, campos)` orquestra nesta ordem: validar obrigatórios, validar ponteiros, redigir, detectar duplicação, resolver caminho, gravar. Devolve `{ caminho, bytes, secoes, comandos, ponteiros, redacoes, duplicacoes }`. Havendo duplicação, não grava nada e devolve a lista preenchida.

Títulos do documento gerado em português acentuado. Chaves do resultado em JSON sem acento, conforme a convenção. Zero travessão.
</action>
<verify><automated>node -e "const c=require('./up/bin/lib/contexto.cjs'); const r=c.redigirSegredos('token: ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'); if(r.texto.includes('ghp_a')) throw new Error('segredo vazou'); if(!r.redacoes.length) throw new Error('sem rotulo'); console.log('contexto ok');"</automated></verify>
<done>A biblioteca existe, redige segredo, indexa artefatos com exclusão configurável, detecta duplicação, resolve caminho fora do repositório e escreve o documento com as seis seções. O comando de verificação imprime `contexto ok`.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/janela.cjs (novo)</files>
<action>
Implementar o contador de janela. CommonJS, zero dependência externa, exportação por objeto literal.

O marcador vive no diretório temporário do sistema, um por projeto, com nome derivado de um resumo curto e estável do caminho absoluto do projeto (por exemplo, os doze primeiros caracteres de um hash do caminho). Conteúdo: contador inteiro, data da última atualização, origem do último reinício e o caminho do projeto.

Funções exportadas: `registrarReinicio(cwd, origem)` incrementa e grava; `estadoAtual(cwd)` devolve contador, origem, data e a marca de marcador existente, tolerando ausência; `marcarArquivo(cwd, caminho)` escreve ou substitui a chave de janela no frontmatter do arquivo, criando o bloco de frontmatter quando o arquivo não tem; `compararArquivo(cwd, caminho)` devolve resultado, janela gravada, janela atual e diferença, com resultado em `cortou`, `intacta` ou `indeterminada`.

Toda leitura é tolerante a falha: arquivo corrompido equivale a ausente. Higiene de contexto nunca pode derrubar um comando, porque ela roda em caminho crítico de gancho.
</action>
<verify><automated>node -e "const j=require('./up/bin/lib/janela.cjs'); const os=require('os'),fs=require('fs'),path=require('path'); const d=fs.mkdtempSync(path.join(os.tmpdir(),'up-j-')); const a=j.estadoAtual(d).contador; j.registrarReinicio(d,'clear'); if(j.estadoAtual(d).contador!==a+1) throw new Error('contador nao incrementou'); console.log('janela ok');"</automated></verify>
<done>O contador incrementa por reinício, distingue projetos, marca e compara briefing devolvendo os três resultados, e degrada para ausente em arquivo corrompido. O comando de verificação imprime `janela ok`.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar: requires do topo, bloco de comentário de uso, switch do main, seções novas de comando handoff e janela, subverbos novos na seção de fase)</files>
<action>
Ligar os três casos no despachante. Regra dura: nunca reescrever o arquivo inteiro, apenas edição por âncora, relendo imediatamente antes. Outras fases escrevem neste mesmo arquivo.

Requires no topo, junto dos outros de lib. Assinaturas no bloco de comentário de uso. No switch do comando, antes do padrão, os casos de handoff e de janela. Dentro do caso de fase já existente, os subverbos de registro de limpeza e de consulta de higiene. Seções novas com banner no padrão do arquivo.

Escrita de handoff: recebe os três campos de texto, todos obrigatórios, e exige pelo menos um comando sugerido. Os sinalizadores de comando e de ponteiro acumulam em lista. Aceita número de fase opcional. Sucesso devolve o objeto da biblioteca pela função de saída padrão; com saída crua, escreve apenas o caminho absoluto, para o workflow capturar em variável. Falha pela função de erro padrão, com três mensagens distintas: campo obrigatório ausente, ponteiro inválido, duplicação. A mensagem de duplicação lista cada linha ofensora com o artefato onde ela já mora e termina instruindo a trocar a cópia por um ponteiro.

Listagem de handoff: lista os handoffs do projeto atual existentes no diretório temporário, do mais recente para o mais antigo, com caminho e data. Serve para a sessão nova achar o documento sem depender de o dono ter guardado o caminho.

Janela: estado, marcação de arquivo e comparação de arquivo. Com saída crua, a comparação escreve apenas uma palavra, entre `cortou`, `intacta` e `indeterminada`, para o workflow ramificar em shell sem parsear JSON.

Registro de limpeza da fase: anexa uma linha ao arquivo de higiene dentro do diretório da fase, com campos separados por barra vertical, começando pelo carimbo de tempo e trazendo o rótulo de limpeza, a onda e o plano seguinte. Cria o arquivo com um cabeçalho de uma linha quando não existe. A consulta de higiene devolve a contagem de fronteiras e a lista de linhas.

Fail-open obrigatório em janela e em consulta de higiene: ausência de marcador ou de arquivo devolve estado vazio com código de saída zero. A função de erro fica reservada a uso incorreto da CLI.
</action>
<verify><automated>node up/bin/up-tools.cjs handoff escrever --em-voo "teste" --porque "prova do subcomando" --proximo-passo "seguir" --comando "/up:build fase 18" --raw | grep -q "$(node -e "console.log(require('os').tmpdir())")" && node up/bin/up-tools.cjs janela estado --raw >/dev/null && node up/bin/up-tools.cjs phase higiene --fase 18 --raw >/dev/null && echo "despachante ok"</automated></verify>
<done>Os três casos respondem pela CLI. O handoff grava no diretório temporário e devolve o caminho na saída crua. Chamada sem comando sugerido sai com código diferente de zero. Janela e consulta de higiene degradam para estado vazio com código zero. Nenhum subcomando existente mudou de comportamento.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/001-green.txt (novo)</files>
<action>
Fechar o verde. Rodar os dois arquivos de teste até passarem inteiros e gravar a saída concatenada em `evidencia/001-green.txt`.

Rodar em seguida o corredor do UP e a suíte legada, para confirmar que nada regrediu com a edição do despachante.

As duas saídas, a vermelha da tarefa 1 e a verde daqui, são a prova deste plano e entram no resumo.
</action>
<verify><automated>{ node up/bin/lib/contexto.test.cjs; node up/bin/lib/janela.test.cjs; } > .plano/fases/18-contexto-e-revisao/evidencia/001-green.txt 2>&1; grep -q "0 failed" .plano/fases/18-contexto-e-revisao/evidencia/001-green.txt && npm run test:up && npm test</automated></verify>
<done>Os dois arquivos de teste passam com zero falhas, a saída verde está gravada, o corredor do UP sai com código zero e a suíte legada continua verde.</done>
</task>

<task id="6" type="auto">
<files>nenhum arquivo do produto (smoke de ponta a ponta em projeto temporário, mais conferência da árvore de trabalho deste repositório)</files>
<action>
Smoke de ponta a ponta, em diretório temporário fora deste repositório.

Criar projeto de teste com um resumo de fase contendo uma linha longa. Rodar o handoff com um texto que contenha uma chave falsa e essa linha copiada. Conferir: a primeira chamada recusa por duplicação e nomeia o artefato; após trocar a cópia por ponteiro, a chamada grava; o arquivo está no diretório temporário do sistema; a seção de comandos sugeridos existe; a chave aparece como rótulo redigido e não em claro.

Rodar o registro de fronteira de limpeza duas vezes numa fase de teste e conferir que a consulta devolve duas linhas com onda e plano seguinte preenchidos.

Conferir por último, neste repositório, que a árvore de trabalho continua limpa a menos dos arquivos declarados neste plano: é a prova, do lado do repositório, de que o handoff não é versionado.
</action>
<verify><automated>git status --porcelain | grep -vE "up/bin/lib/(contexto|janela)(\.test)?\.cjs|up/bin/up-tools\.cjs|\.plano/fases/18-contexto-e-revisao/" | grep . && echo "SUJO: arquivo inesperado na arvore" && exit 1 || echo "arvore limpa"</automated></verify>
<done>O handoff recusa a cópia, aceita o ponteiro, grava fora do repositório com segredo redigido e com a seção de comandos sugeridos. O registro de limpeza acumula linhas. A árvore de trabalho deste repositório não tem arquivo fora dos declarados.</done>
</task>

## Critérios de Sucesso

- [ ] Handoff gravado no diretório temporário do sistema, com caminho fora do diretório do projeto
- [ ] Chamada sem comando sugerido recusada, com o campo nomeado
- [ ] Segredo redigido antes da escrita, com contagem de redações no resultado
- [ ] Linha copiada de artefato recusada com o apontamento de onde ela já mora, e aceita como ponteiro
- [ ] Ponteiro absoluto e ponteiro inexistente recusados
- [ ] Contador de janela distingue os três resultados e não mistura projetos
- [ ] Registro de fronteira de limpeza acumula linha e a consulta devolve a contagem
- [ ] Par vermelho e verde gravado em `evidencia/001-red.txt` e `evidencia/001-green.txt`
- [ ] O corredor do UP e a suíte legada passam

## FORA DE ESCOPO

- **Não escrever doutrina.** Quem manda usar estas ferramentas é o plano 002. Nenhum arquivo de skill, reference ou workflow é tocado aqui.
- **Não decidir quando fazer handoff.** O limiar e a oferta são do plano 005.
- **Não aplicar a regra de referência ao documento de estado.** É o plano 003, que consome esta biblioteca.
- **Não comprimir conversa automaticamente.** O agente redige os três campos de fio vivo; a biblioteca não lê transcrição.
- **Não versionar handoff**, nem por cópia de conveniência dentro do projeto.
- **Não duplicar o helper de teste da fase 16.** Sem ele, parar e escalar.
- **Não unificar com o arquivo de retomada versionado** do workflow de pausa. Os dois convivem: um é pausa versionada, o outro é bifurcação efêmera.
