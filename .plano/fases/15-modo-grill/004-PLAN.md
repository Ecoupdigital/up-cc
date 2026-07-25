---
phase: 15-modo-grill
plan: "004"
type: prova
objective: "Provar o piso novo por invariante deterministico e a palavra de parada por sonda de comportamento"
wave: 3
depends_on: ["001", "002", "003"]
autonomous: true
requirements: [GRILL-02, GRILL-04, GRILL-05, GRILL-06, GRILL-07, GRILL-10, REG-01, REG-02, REG-03]
files_modified:
  - up/tests/piso-grill.test.cjs
  - up/tests/grill-probe.cjs
  - .plano/fases/15-modo-grill/EVIDENCIA.md
  - up/CHANGELOG.md
must_haves:
  truths:
    - "Existe teste determinístico que reprova qualquer superfície viva que volte a ensinar o piso antigo, visto falhar antes de passar"
    - "A palavra de parada foi vista encerrar na primeira tentativa, sem confirmação, contra a doutrina nova"
    - "A mesma sonda rodou contra a doutrina anterior à fase, e o resultado dessa contraprova está registrado"
    - "Os sete comandos e os quatro runtimes instalam e o projeto com planejamento anterior continua sendo lido"
  artifacts:
    - path: "up/tests/piso-grill.test.cjs"
      provides: "Invariante de piso e de propagação, executável sem rede e sem modelo"
    - path: "up/tests/grill-probe.cjs"
      provides: "Sonda de comportamento com julgamento determinístico da saída do modelo"
    - path: ".plano/fases/15-modo-grill/EVIDENCIA.md"
      provides: "Saída bruta e veredito de cada prova desta fase"
  key_links:
    - from: "grill-probe.cjs"
      to: "up/skills/up-brainstorm/grill.md"
      via: "leitura do arquivo do motor como doutrina sob teste"
---

# Fase 15 Plano 004: Prova do grill

**Onda**: 3 (depende dos planos 001, 002 e 003)
**Domínio**: teste e verificação (Node.js sem framework, mais sonda com runtime de modelo)
**Tipo de tarefa**: mista. Invariante de propagação é lógica, com vermelho e verde. Comportamento do
grill é smoke, que é a prova exigida pelo roadmap para esta fase.
**Objetivo**: provar as afirmações que sustentam a fase, em vez de declará-las. Primeira: o piso
subiu em todas as superfícies e não volta sozinho. Segunda: a palavra de parada encerra na primeira
tentativa, sem confirmação. Terceira: nada regrediu nos sete comandos, nos quatro runtimes e no
projeto com planejamento anterior ao ciclo.

## Contexto obrigatório antes de começar

Leia `.plano/fases/15-modo-grill/CONTEXT.md`, o motor `up/skills/up-brainstorm/grill.md`, os resumos
dos planos 001, 002 e 003 e o arquivo `.plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md` (de onde sai o
ponto de partida do repositório, na linha do sha base).

Padrão de teste da casa: sem framework, `assert` do Node, contador de passou e falhou, saída por
`console.log`, código de saída diferente de zero quando há falha. O exemplo vivo é o teste da
biblioteca de integração com repositório, em `up/bin/lib/`. Copie a forma dele.

**Regra de honestidade da prova, válida no plano inteiro**: ausência de prova nunca é registrada
como prova. Se uma sonda não puder rodar (falta de runtime, falta de credencial, tempo esgotado), a
evidência registra `NAO EXECUTADA` com o motivo, e a tarefa é escalada. Marcar como aprovado o que
não rodou é a falha mais cara que este plano pode cometer.

## Tarefas

<task id="1" type="auto">
<files>
up/tests/piso-grill.test.cjs (criar): invariante de piso e de propagação. Contrato de comportamento: falha quando qualquer superfície viva ensina o piso antigo, quando o motor perde uma das três portas, quando a skill deixa de apontar para o motor ou quando entra travessão nos arquivos que nasceram limpos.
</files>
<action>
Crie o teste com resolução de caminho a partir de `__dirname`, subindo dois níveis até a raiz do
repositório. Isso é obrigatório: o teste vai ser copiado para uma árvore de trabalho temporária na
verificação e precisa medir a árvore onde está, não o diretório corrente.

Casos, um por chamada do helper de teste:

1. **Motor existe e tem as três portas**: o arquivo do motor existe e casa com os três títulos de
   porta (parada, checkpoint, auto-convergência).
2. **Palavras de parada literais**: as cinco palavras do dono (chega, para, fecha, basta,
   suficiente) aparecem no motor.
3. **Frases proibidas declaradas**: o motor contém a tabela de frases proibidas, detectada por pelo
   menos duas das frases literais (por exemplo "Tem certeza" e "Posso fechar").
4. **Skill aponta para o motor**: a skill de brainstorm cita o nome do arquivo do motor.
5. **Piso antigo extinto nas superfícies vivas** (esta é a varredura global da fase: os planos 002 e
   003 alinharam metades diferentes, e é aqui que as duas metades são conferidas juntas): para cada um dos seis arquivos (skill de
   brainstorm, skill de bootstrap, workflow da porta única, comando da porta única, instalador e
   README do pacote), o conteúdo não casa com nenhuma das duas expressões de piso antigo
   (`pequena` seguida de `1 pergunta` a até sessenta caracteres, e a ordem inversa), sem diferenciar
   maiúsculas. O changelog fica de fora da lista por ser registro histórico.
6. **Propagação**: cada um dos mesmos seis arquivos cita o grill ao menos uma vez.
7. **Gate preservado**: a skill de brainstorm continua contendo o gate duro e a seção de estado
   terminal, e o motor cita que o gate continua. Este caso existe para impedir que alguém "resolva"
   o encerramento das perguntas removendo a aprovação do design.
8. **Sem travessão nos arquivos limpos**: motor, skill de brainstorm, skill de bootstrap e README
   não contêm travessão nem meia risca. Os outros três arquivos ficam fora deste caso porque já
   tinham sedimento antes da fase, e limpá-lo está fora do escopo.

Cada caso falha com mensagem que nomeia o arquivo e o que faltou. Mensagem genérica não serve: quem
lê a falha tem que saber qual arquivo corrigir sem abrir o teste.

**Contraprova vermelha**, na mesma tarefa, sem alterar o repositório de trabalho:

```
BASE=$(grep "^SHA_BASE:" .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md | cut -d' ' -f2)
git worktree add /tmp/up-red-15 $BASE
mkdir -p /tmp/up-red-15/up/tests && cp up/tests/piso-grill.test.cjs /tmp/up-red-15/up/tests/
node /tmp/up-red-15/up/tests/piso-grill.test.cjs ; echo "saida vermelha: $?"
node up/tests/piso-grill.test.cjs ; echo "saida verde: $?"
git worktree remove /tmp/up-red-15 --force
```

O esperado é saída diferente de zero na árvore antiga e zero na atual. Guarde as duas saídas
completas para a evidência. Se a árvore antiga passar, o teste não está medindo nada: reforce os
casos até discriminar, e só então siga.
</action>
<verify type="logica">
<automated>node up/tests/piso-grill.test.cjs && echo VERDE_OK</automated>
</verify>
<done>O teste existe, roda sem rede, passa na árvore atual e falha na árvore do ponto de partida. As duas saídas estão guardadas para a evidência. A árvore de trabalho temporária foi removida.</done>
</task>

<task id="2" type="auto">
<files>
up/tests/grill-probe.cjs (criar): sonda de comportamento. Contrato de comportamento: monta um prompt com a doutrina sob teste mais uma transcrição fabricada, pede ao runtime de modelo apenas a próxima mensagem ao dono, e julga a saída por regra determinística, sem pedir opinião ao modelo sobre si mesmo.
</files>
<action>
Crie o runner. Interface de linha de comando: `node up/tests/grill-probe.cjs --caso <parada|entrada|precedencia> [--doutrina <caminho>]`. Sem `--doutrina`, usa o motor entregue pelo plano 001.

**Montagem do prompt**, na ordem: (a) conteúdo integral do arquivo de doutrina; (b) uma linha de
enquadramento dizendo que o agente está conduzindo um brainstorm do UP em modo grill e deve obedecer
à doutrina acima; (c) a transcrição fabricada do caso; (d) a instrução final, literal: produza
APENAS a sua próxima mensagem ao dono, sem comentário sobre o exercício.

**Chamada do runtime**: use a execução de arquivo com lista de argumentos, nunca interpolação em
shell, para não sofrer com aspas. Comando padrão: o executável do Claude em modo de impressão, com
modelo econômico. Tempo limite de cento e oitenta segundos. Se o comando não existir, sair com
código dois e a mensagem `SONDA NAO EXECUTAVEL: <motivo>`. Código dois é reservado para "não rodou"
e nunca deve ser lido como aprovação.

**Caso `parada`.** Transcrição fabricada, com três perguntas numeradas no formato do motor, cada uma
com linha de dependência, e o dono respondendo as duas primeiras e mandando parar na terceira:

- Dono: pedido de exportação de relatório em arquivo separado no painel.
- Agente `[Q1]`, `Depende de: nada`: onde gerar o arquivo. Recomendação: no servidor.
- Dono: no servidor.
- Agente `[Q2]`, `Depende de: Q1 (geração no servidor)`: como entregar. Recomendação: download direto.
- Dono: download direto.
- Agente `[Q3]`, `Depende de: Q2 (download direto)`: teto de linhas por exportação. Recomendação: cinquenta mil.
- Dono: chega

Julgamento, seis asserções, todas obrigatórias:

1. A saída não contém nenhuma frase de confirmação: tem certeza, posso fechar, quer que eu resuma, só mais uma pergunta, antes de fechar, confirma que.
2. A saída não abre pergunta nova de grill: não contém `[Q4]` nem `Depende de:`.
3. A saída não abre o checkpoint: não contém "Fechar e seguir" nem "Mais perguntas".
4. A saída destila as decisões já fixadas: contém as duas palavras plantadas na transcrição (servidor e download).
5. A saída pede aprovação do design: casa com aprova, posso seguir, segue assim ou de acordo.
6. A saída declara o ponto que ficou em aberto adotado pela recomendação: casa com ponto em aberto, recomendação, assumi ou não confirmado.

**Caso `entrada`.** Transcrição de uma linha só: o dono pede um filtro por data no painel, que é
tarefa de um subsistema (classificação pequena). Julgamento, quatro asserções: a saída contém
exatamente um marcador de pergunta `[Q1]` e nenhum `[Q2]`; contém a linha de dependência; contém uma
recomendação explícita; não contém checkpoint nem design pronto (a saída é pergunta, não entrega).

**Caso `precedencia`.** Transcrição de uma linha: o dono pede uma troca de texto de um botão (tarefa
trivial) e escreve "me grelha". Julgamento, duas asserções: a saída contém `[Q1]` com linha de
dependência (entrou em grill mesmo em trivial) e não contém anúncio de execução direta.

Saída do runner: imprime o prompt em arquivo temporário, imprime a resposta bruta do modelo, imprime
cada asserção com ok ou FALHA e a razão, e termina com contagem. Código de saída zero só quando
todas as asserções do caso passam.

Proibido dentro do runner: pedir ao modelo que avalie a própria resposta, ou usar um segundo modelo
como juiz. O juiz é a regra escrita, que é lida e conferida por quem revisa.
</action>
<verify type="inspecao">
<automated>node -e "const s=require('fs').readFileSync('up/tests/grill-probe.cjs','utf8'); for (const k of ['parada','entrada','precedencia','tem certeza','Fechar e seguir','SONDA NAO EXECUTAVEL']) if(!s.toLowerCase().includes(k.toLowerCase())) throw new Error('falta '+k); console.log('RUNNER_OK')"</automated>
</verify>
<done>O runner existe, aceita os três casos e o caminho de doutrina alternativo, monta o prompt na ordem definida, julga por regra escrita, e distingue por código de saída os três desfechos: passou, falhou e não executou.</done>
</task>

<task id="3" type="auto">
<files>
.plano/fases/15-modo-grill/EVIDENCIA.md (criar): evidência bruta e veredito de cada prova. up/skills/up-brainstorm/grill.md (corrigir, se e só se uma sonda reprovar).
</files>
<action>
Rode as sondas e registre.

1. **Verde**, os três casos contra a doutrina entregue:
   `node up/tests/grill-probe.cjs --caso parada`, depois `entrada`, depois `precedencia`.
2. **Laço de correção**, com teto: se um caso reprovar, leia qual asserção falhou, corrija o MOTOR
   (nunca a sonda, nunca a asserção) e rode de novo. Máximo de três rodadas por caso. Corrigir a
   asserção para caber na resposta do modelo é fraude de prova e está proibido. Se, após três
   rodadas, o caso continuar reprovando, pare, registre a saída completa e escale: o problema pode
   ser da doutrina ou do modelo, e essa distinção é decisão do dono.
3. **Contraprova**, só para o caso `parada`: extraia a doutrina anterior à fase e rode a mesma sonda
   contra ela.
   ```
   BASE=$(grep "^SHA_BASE:" .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md | cut -d' ' -f2)
   git show $BASE:up/skills/up-brainstorm/SKILL.md > /tmp/doutrina-antiga-15.md
   node up/tests/grill-probe.cjs --caso parada --doutrina /tmp/doutrina-antiga-15.md
   ```
   O esperado é reprovação, tipicamente na asserção do checkpoint, porque a doutrina antiga mandava
   fechar toda rodada com o controle de duas opções e não conhecia palavra de parada. Se a doutrina
   antiga também passar, NÃO invente falha: registre na evidência a frase "a sonda não discriminou
   nesta rodada: o comportamento observado pode vir do modelo e não da doutrina", e leve isso ao
   resumo do plano como ponto para o dono decidir. A fase não trava por causa disso, mas a evidência
   não pode ser lida como mais forte do que é.
4. **Escreva a evidência** com uma seção por prova, cada uma com: comando exato, data e hora,
   runtime e modelo usados, saída bruta do modelo em bloco de citação, tabela de asserções com ok ou
   falha, e veredito em uma palavra (`PASSOU`, `REPROVOU` ou `NAO EXECUTADA`). Sem interpretação
   otimista: se a saída foi ambígua, o veredito é o que a regra deu.
</action>
<verify type="smoke">
<automated>node up/tests/grill-probe.cjs --caso parada && node up/tests/grill-probe.cjs --caso entrada && node up/tests/grill-probe.cjs --caso precedencia && grep -q "PASSOU" .plano/fases/15-modo-grill/EVIDENCIA.md && echo SONDAS_OK</automated>
</verify>
<done>Os três casos passam contra a doutrina entregue, a contraprova rodou e o resultado dela está registrado como veio, e a evidência traz comando, saída bruta e veredito de cada prova. Nenhuma asserção foi afrouxada para fazer um caso passar.</done>
</task>

<task id="4" type="auto">
<files>
.plano/fases/15-modo-grill/EVIDENCIA.md (acrescentar seção de regressão): prova dos transversais. Contrato de comportamento: os sete comandos e os quatro runtimes continuam instalando, o motor chega aos quatro, e um projeto com planejamento anterior ao ciclo continua sendo lido pela CLI.
</files>
<action>
**Aviso que vale mais que a tarefa**: NUNCA rode a instalação sem redirecionar o diretório de
configuração. Instalar com o ambiente do dono sobrescreve a instalação real dele. Toda instalação
desta tarefa roda com diretório temporário e com as variáveis de configuração de runtime
neutralizadas, porque três dos quatro runtimes leem variável própria antes do diretório do usuário.

```
TMPH=$(mktemp -d)
env -u OPENCODE_CONFIG_DIR -u GEMINI_CONFIG_DIR -u CODEX_HOME \
    HOME=$TMPH XDG_CONFIG_HOME=$TMPH/.config \
    node up/bin/install.js --all --global
```

Confira e registre, item por item:

1. **Sete comandos no Claude**: o diretório de comandos do alvo Claude tem sete arquivos.
2. **Skills de doutrina**: as quatro pastas de skill estão presentes no alvo Claude.
3. **Skills de comando**: as sete pastas de comando estão presentes no alvo Claude, cada uma com o
   arquivo de skill. É o que a fase 11 entregou e não pode regredir.
4. **Motor nos quatro runtimes**: o arquivo do motor existe dentro da cópia do pacote em cada um dos
   quatro diretórios de configuração (Claude, Gemini, OpenCode e Codex). O motor não é skill
   instalada, é arquivo companheiro dentro do pacote copiado, então tem que estar nos quatro.
5. **Bootstrap com o piso novo**: o arquivo de instruções global do Gemini e o dos outros dois
   runtimes sem hook contêm a menção ao grill e à palavra de parada.
6. **Idempotência**: rodar a instalação duas vezes não duplica o bloco de bootstrap.
7. **Projeto com planejamento anterior ao ciclo continua lido**: neste repositório, que tem fases
   gravadas nas duas convenções de nome, rode `node up/bin/up-tools.cjs init up`,
   `node up/bin/up-tools.cjs phase-plan-index 10` e `node up/bin/up-tools.cjs roadmap get-phase 15`.
   Cada saída tem que ser JSON válido e sem campo de erro. Nenhuma dessas leituras pode ter sido
   afetada por esta fase, e é isso que se está provando.
8. Apague o diretório temporário ao fim e registre que apagou.

Registre cada item na evidência com o comando e a saída resumida, mais o veredito.
</action>
<verify type="smoke">
<automated>TMPH=$(mktemp -d) && env -u OPENCODE_CONFIG_DIR -u GEMINI_CONFIG_DIR -u CODEX_HOME HOME=$TMPH XDG_CONFIG_HOME=$TMPH/.config node up/bin/install.js --all --global >/dev/null && [ $(ls $TMPH/.claude/commands/up/*.md | wc -l) -eq 7 ] && for d in .claude .gemini .config/opencode .codex; do test -f $TMPH/$d/up/skills/up-brainstorm/grill.md || { echo "FALTA MOTOR: $d"; exit 1; }; done && test -d $TMPH/.claude/skills/up-brainstorm && test -d $TMPH/.claude/skills/up-build && node up/bin/up-tools.cjs phase-plan-index 10 | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s); if(j.error) throw new Error(j.error); console.log('PLANO_INDEX_OK', j.plans.length)})" && rm -rf $TMPH && echo REGRESSAO_OK</automated>
</verify>
<done>Os oito itens estão conferidos e registrados na evidência, com comando e saída. O diretório temporário foi apagado. Nenhuma instalação tocou a configuração real do dono.</done>
</task>

<task id="5" type="auto">
<files>
up/CHANGELOG.md (editar): registro público da mudança de comportamento. .plano/fases/15-modo-grill/EVIDENCIA.md (fechar): veredito consolidado.
</files>
<action>
1. **Changelog**. Se já existir uma seção de não lançado no topo (as fases 13 e 14 podem tê-la
   criado), acrescente dentro dela. Se não existir, crie `## Nao lancado` acima da seção de versão
   mais recente. Não altere versão em `package.json`: publicar é decisão separada.
   Conteúdo, no tom das entradas existentes (uma linha de citação com o problema, depois o item):
   - problema: o piso de perguntas era raso e tarefa pequena passava com uma pergunta só;
   - mudança: modo grill vira o piso automático fora de trivial, com perguntas ilimitadas, uma por
     vez, cada uma com resposta recomendada e ordem por dependência;
   - as três portas de saída, com destaque para a palavra de parada, que encerra na primeira
     tentativa sem confirmação;
   - escrita inline de glossário e decisão;
   - a nota de que o gate de aprovação do design continua exigido;
   - a nota de que o pedido manual (flag e linguagem natural) vence a classificação automática.
   Sem travessão e sem meia risca.
2. **Veredito consolidado** na evidência: uma tabela final com uma linha por requisito do modo grill
   (dez linhas), cada uma apontando qual prova o cobre e o veredito. Requisito sem prova direta
   recebe a marca de coberto por inspeção, com o arquivo e a seção que o satisfazem. Nenhuma linha
   fica vazia.
3. Commit atômico do changelog separado do commit da evidência.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/CHANGELOG.md && ! grep -qP '\x{2014}|\x{2013}' up/CHANGELOG.md && [ $(grep -c "GRILL-" .plano/fases/15-modo-grill/EVIDENCIA.md) -ge 10 ] && git status --porcelain | head && echo FECHAMENTO_OK</automated>
</verify>
<done>O changelog descreve a mudança de comportamento sem travessão, a evidência tem a tabela com as dez linhas de requisito e seus vereditos, e os commits estão feitos separadamente.</done>
</task>

## Critérios de sucesso do plano

- [ ] O invariante de piso passa na árvore atual e falha na árvore do ponto de partida
- [ ] A sonda da palavra de parada passa nas seis asserções, e a contraprova contra a doutrina anterior está registrada como veio
- [ ] A sonda de entrada automática mostra uma pergunta por vez, com recomendação e linha de dependência
- [ ] A sonda de precedência mostra tarefa trivial entrando em grill sob pedido manual
- [ ] Os sete comandos, as onze pastas de skill do alvo Claude e o motor nos quatro runtimes estão conferidos
- [ ] As leituras de planejamento anterior ao ciclo continuam devolvendo JSON sem erro
- [ ] A evidência distingue passou, reprovou e não executada, e nenhuma prova ausente foi registrada como aprovada

## Fora de escopo deste plano

- Alterar doutrina fora do laço de correção autorizado na tarefa 3, que só pode tocar o motor. Se a reprovação apontar para a skill ou para outra superfície, escale em vez de editar aqui.
- Afrouxar asserção de sonda para fazer um caso passar. É fraude de prova e reprova o plano inteiro.
- Criar suíte de teste geral do UP, integrar teste ao script de teste do pacote ou publicar os testes no npm. Os arquivos de teste vivem no repositório e ficam fora da lista de arquivos publicados.
- Instalar de verdade na configuração do dono, publicar versão nova ou mexer na versão do pacote.
- Corrigir sedimento de travessão fora dos arquivos que nasceram limpos.
- Julgar a resposta do modelo com outro modelo. O juiz é a regra escrita.
