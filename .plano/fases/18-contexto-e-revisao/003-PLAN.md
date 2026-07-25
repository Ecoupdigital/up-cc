---
phase: 18-contexto-e-revisao
plan: "003"
type: logic
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-11, CTX-12]
objective: "Documento de estado carregando fio vivo, ponteiros e proximo comando sugerido"
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
files_modified:
  - up/templates/state.md
  - up/bin/up-tools.cjs
  - up/bin/lib/estado.test.cjs
  - up/references/state-persistence.md
  - .plano/STATE.md
  - .plano/fases/18-contexto-e-revisao/evidencia/003-red.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/003-green.txt
must_haves:
  truths:
    - "O documento de estado carrega o fio vivo e ponteiros, e o detalhe fechado continua morando no artefato da fase"
    - "O documento de estado tem secao de proximo comando sugerido, sempre preenchida"
    - "Conteudo copiado de artefato do projeto para dentro do estado e sinalizado com o apontamento de onde ele ja mora"
  artifacts:
    - path: "up/templates/state.md"
      provides: "Molde do documento de estado com fio vivo, ponteiros e proximo comando sugerido"
    - path: "up/bin/up-tools.cjs"
      provides: "Escrita, derivacao e verificacao do proximo comando sugerido e da regra de referencia"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/contexto.cjs"
      via: "reuso do indice de artefatos e da deteccao de duplicacao entregues no plano 001"
---

# Fase 18 Plano 003: Fio vivo do documento de estado

<objective>
Aplicar ao documento de estado a mesma regra dura que o handoff passou a seguir, referência e nunca cópia, e acrescentar a seção obrigatória de próximo comando sugerido, derivada do roadmap quando não informada, para o roteamento morar no documento e não na memória do dono.
</objective>

**Onda:** 2. **Depende de:** plano 001, que entrega a biblioteca de higiene de contexto.
**Tipo de prova:** lógica, vermelho e verde, para a verificação, a escrita e a derivação. Smoke no próprio repositório para o documento real e para o gancho de início de sessão.

## Uma regra, uma implementação

A regra de referência é a mesma do handoff e usa a mesma implementação. Duas cópias da mesma regra
seriam exatamente o erro que o dono apontou no leitor do log de aprovações. Por isso este plano consome
`indiceDeArtefatos` e `detectarDuplicacao` do plano 001, com a única diferença de configuração que o caso
exige: o próprio documento de estado sai do índice, senão ele acusa a si mesmo.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisão P1, uma implementação e dois consumidores
@up/templates/state.md - molde atual, que mantém os nomes de seção que o gancho e os workflows esperam
@.plano/STATE.md - documento real deste repositório, escrito antes desta regra existir
@up/references/state-persistence.md - onde a regra é enunciada por referência
@up/bin/up-tools.cjs - seção do documento de estado, com carregar, atualizar, avançar plano, atualizar progresso, registrar sessão e salvar sessão
@up/bin/lib/test-helpers.cjs - helper de teste entregue pela fase 16

Regra dura de edição do despachante: nunca reescrever o arquivo inteiro, apenas edição por âncora,
relendo imediatamente antes. Outras fases escrevem nele.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/estado.test.cjs (novo), .plano/fases/18-contexto-e-revisao/evidencia/003-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR.

Usar o helper da fase 16 para montar projeto temporário com diretório de planejamento povoado, e tocar a CLI como subprocesso, que é a fronteira pública.

Casos obrigatórios. Documento de estado sem a seção de próximo comando sugerido é reprovado, com o nome da seção faltante na saída. Documento com a seção presente mas vazia também é reprovado, porque seção obrigatória vazia é pior que ausente: parece cumprida. Documento com a seção preenchida passa. Documento com uma linha longa copiada de um resumo de fase é sinalizado, com a linha e o caminho relativo do artefato onde ela mora. O mesmo documento, com a cópia trocada por ponteiro, passa. Uma linha longa repetida duas vezes dentro do próprio documento de estado não conta como duplicação de artefato, porque o próprio documento sai do índice. A escrita do próximo comando substitui o valor anterior em vez de acrescentar uma segunda seção.

Casos de derivação. Roadmap com a fase seguinte pendente e sem planos gravados produz o comando de planejar aquela fase. Com planos gravados, produz o comando de construir. Com o roadmap inteiro concluído, produz o comando de auditoria. Em todos, a segunda linha oferecida é a porta única sem argumento.

Caso de degradação: a verificação roda sem lançar num projeto sem documento de estado, devolvendo código de saída zero.

Rodar, confirmar que falha e gravar a saída em `evidencia/003-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/lib/estado.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/003-red.txt 2>&1; grep -qiE "FAIL|failed|Unknown state subcommand" .plano/fases/18-contexto-e-revisao/evidencia/003-red.txt && echo "RED confirmado"</automated></verify>
<done>O arquivo de teste existe, cobre os dez casos, falha porque os subcomandos ainda não existem, e a saída vermelha está gravada.</done>
</task>

<task id="2" type="auto">
<files>up/templates/state.md (reescrever)</files>
<action>
Reescrever o molde do documento de estado, mantendo os nomes de seção que o gancho de início de sessão e os workflows já esperam encontrar: referência do projeto, posição atual, contexto acumulado com decisões e bloqueios, e continuidade de sessão. Mudar nome de seção aqui é regressão contra projeto antigo.

O que muda dentro delas. Cada seção ganha a regra escrita no próprio molde: o que entra aqui é fio vivo e ponteiro, e o detalhe fechado mora no artefato da fase, entrando por caminho relativo.

O molde traz um exemplo bom e um exemplo ruim lado a lado para a mesma informação. O ruim reproduz três linhas do resumo da fase dentro do estado; o bom diz o que mudou em uma linha e aponta para o resumo por caminho relativo. Cada linha do exemplo ruim vem anotada com o motivo de ser ruim.

Nasce a seção de próximo comando sugerido, no segundo nível de título, logo depois da posição atual, e não enterrada no fim. Um comando por linha, em código em linha, começando pelo recomendado, com um motivo curto em cada linha. O molde declara que a seção é obrigatória e nunca fica vazia.

O teto de tamanho declarado no molde continua valendo e passa a ser justificado pela regra de referência, e não por um número solto: o documento é curto porque aponta, não porque foi podado.

O molde inteiro passa a ser escrito em português acentuado. Os nomes das seções já estão em português e não mudam de grafia.
</action>
<verify><automated>grep -q "Próximo comando sugerido" up/templates/state.md && grep -qi "exemplo ruim" up/templates/state.md && grep -qi "ponteiro" up/templates/state.md && echo "molde ok"</automated></verify>
<done>O molde mantém os nomes de seção antigos, declara a regra de referência com par de exemplos anotados, e traz a seção de próximo comando sugerido no segundo nível, logo após a posição atual, marcada como obrigatória.</done>
</task>

<task id="3" type="auto">
<files>up/bin/up-tools.cjs (editar: seção do documento de estado, subverbos novos e sinalizador novo em salvar sessão)</files>
<action>
Escrever, derivar e ler o próximo comando sugerido pela CLI.

Acrescentar o subcomando de próximo comando com três modos. Escrita: recebe o comando e um motivo opcional, grava a linha na seção, criando a seção na posição correta quando não existe e substituindo o conteúdo anterior quando existe. Aceita repetição do par comando e motivo, sempre com a primeira linha como recomendada. Derivação: sem comando informado, deriva do roadmap por regra fechada. Existe fase pendente sem plano gravado, o comando é planejar aquela fase; existe fase pendente com plano gravado, o comando é construir aquela fase; não existe fase pendente, o comando é a auditoria. Em qualquer caso a segunda linha oferecida é a porta única sem argumento, que continua de onde parou. Leitura: sem sinalizador de escrita nem de derivação, devolve o conteúdo atual da seção.

Ligar ao fluxo existente: o subcomando de salvar sessão passa a gravar a seção na mesma passada, usando o valor informado quando houver e a derivação quando não houver. Sem informação nenhuma, o comportamento anterior de salvar sessão não muda em mais nada.

Edição por âncora, nunca reescrita do arquivo inteiro.
</action>
<verify><automated>node up/bin/up-tools.cjs state proximo-comando --derivar --raw >/dev/null && node up/bin/up-tools.cjs state proximo-comando --raw | grep -q "up" && echo "proximo comando ok"</automated></verify>
<done>A escrita grava e substitui em vez de duplicar, a derivação devolve o comando coerente com o roadmap, a leitura devolve a seção, e salvar sessão grava a seção sem mudar mais nada.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar: subverbo de verificação na seção do documento de estado)</files>
<action>
Verificação da regra de referência e da seção obrigatória.

Acrescentar o subcomando de verificação do estado, que devolve veredito estruturado com: presença e preenchimento da seção de próximo comando sugerido; lista de linhas do documento de estado que duplicam conteúdo de artefato do projeto, cada uma com o caminho relativo de onde ela já mora; e o tamanho em linhas contra o teto declarado no molde.

A detecção usa `indiceDeArtefatos` e `detectarDuplicacao` de `contexto.cjs`, passando o próprio documento de estado na lista de exclusão.

O veredito sinaliza e não bloqueia. Com saída crua, escrever apenas uma palavra, entre `ok` e `revisar`. Nenhum comando existente passa a falhar por causa deste veredito: ele existe para o workflow poder avisar, e a mesma justificativa da heurística de tautologia vale aqui, isto é, falso positivo bloqueante é pior que o problema que ele pega.
</action>
<verify><automated>node up/bin/up-tools.cjs state verificar --raw | grep -qE "^(ok|revisar)$" && (cd $(mktemp -d) && node "$OLDPWD/up/bin/up-tools.cjs" state verificar --raw >/dev/null) && echo "verificacao ok"</automated></verify>
<done>A verificação reprova documento sem a seção e com a seção vazia, aprova com ela preenchida, aponta linha duplicada com o artefato onde ela mora, não acusa o próprio documento, e roda sem lançar em projeto sem documento de estado.</done>
</task>

<task id="5" type="auto">
<files>up/references/state-persistence.md (editar: duas linhas novas)</files>
<action>
Enunciar a regra na referência de persistência, por ponteiro.

Acrescentar duas linhas: a de que o salvamento de sessão grava também o próximo comando sugerido, e a de que o documento de estado aponta em vez de copiar. Enunciar apontando para o molde, sem reproduzir o texto do molde, o que seria a própria regra sendo violada no ato de escrevê-la.
</action>
<verify><automated>grep -q "proximo-comando\|próximo comando" up/references/state-persistence.md && grep -q "templates/state.md" up/references/state-persistence.md && echo "referencia ok"</automated></verify>
<done>A referência cita as duas regras e aponta para o molde, sem copiar o conteúdo dele.</done>
</task>

<task id="6" type="auto">
<files>.plano/STATE.md (corrigir apenas as linhas apontadas pela verificação), .plano/fases/18-contexto-e-revisao/evidencia/003-green.txt (novo)</files>
<action>
Fechar o verde e rodar o smoke no próprio repositório.

Rodar o arquivo de teste até passar inteiro e gravar a saída em `evidencia/003-green.txt`.

Smoke: rodar a verificação contra o documento de estado deste repositório, que é real e foi escrito antes desta regra existir. Registrar o resultado. Se apontar duplicação, corrigir apenas as linhas apontadas, trocando cópia por ponteiro, e rodar de novo até ficar `ok`. Rodar a escrita do próximo comando e conferir que a seção aparece na posição certa e que rodar de novo substitui em vez de duplicar. Rodar a derivação sem valor informado e conferir que devolve o comando coerente com o roadmap deste repositório.

Conferir que o gancho de início de sessão continua conseguindo ler o trecho do topo do documento: o trecho injetado é um recorte do início do arquivo, então a seção nova, por estar logo depois da posição atual, tem de caber dentro do recorte. Provar rodando o gancho com um payload de teste e procurando a seção na saída. Se não couber, reposicionar a seção, e nunca aumentar o teto do recorte.
</action>
<verify><automated>node up/bin/lib/estado.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/003-green.txt 2>&1; grep -q "0 failed" .plano/fases/18-contexto-e-revisao/evidencia/003-green.txt && node up/bin/up-tools.cjs state verificar --raw | grep -q "^ok$" && echo '{"source":"clear","cwd":"'$(pwd)'"}' | node up/hooks/up-session-start.js | grep -q "Próximo comando sugerido" && npm run test:up</automated></verify>
<done>O teste passa com zero falhas, o documento de estado deste repositório tem veredito `ok`, e o gancho de início de sessão injeta um recorte que contém a seção nova.</done>
</task>

## Critérios de Sucesso

- [ ] O molde tem a seção de próximo comando sugerido no segundo nível, logo após a posição atual, declarada obrigatória e nunca vazia
- [ ] O molde traz o par de exemplos bom e ruim da regra de referência, com motivo anotado em cada linha ruim
- [ ] A verificação reprova documento sem a seção e com a seção vazia, e aprova com ela preenchida
- [ ] A verificação aponta linha duplicada com o caminho relativo do artefato, e não acusa o próprio documento
- [ ] A gravação substitui em vez de duplicar, e a derivação devolve o comando certo nos três estados de roadmap
- [ ] O documento de estado deste repositório termina a fase com veredito `ok`
- [ ] O gancho de início de sessão continua injetando o trecho do topo, com a seção nova dentro do recorte
- [ ] Par vermelho e verde gravado em `evidencia/003-red.txt` e `evidencia/003-green.txt`

## FORA DE ESCOPO

- **Não implementar a biblioteca de higiene de contexto.** Vem pronta do plano 001 e aqui é apenas consumida.
- **Não tocar no documento de handoff.** É outro artefato, com outro ciclo de vida. Só a regra de referência é compartilhada.
- **Não editar o workflow de construção.** A gravação do próximo comando acontece dentro do salvamento de sessão, que o build já chama, exatamente para não precisar tocar num arquivo que nesta onda pertence a outro plano.
- **Não reescrever o documento de estado** deste repositório além das linhas que a verificação apontar. Poda de texto é passe separado.
- **Não editar o gancho de início de sessão.** Ele é exercido como prova, não editado. O incremento de janela dentro dele é do plano 002.
- **Não aumentar o teto de caracteres do trecho injetado.** Se a seção nova não couber, reposicionar a seção.
