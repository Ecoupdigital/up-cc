---
phase: 15-modo-grill
plan: "003"
type: doutrina
objective: "Propagar o piso novo para bootstrap, workflow, comando, instalador, README e reference"
wave: 2
depends_on: ["001"]
autonomous: true
requirements: [GRILL-02, GRILL-03, REG-01, REG-02]
files_modified:
  - up/skills/usando-up/SKILL.md
  - up/workflows/up.md
  - up/commands/up.md
  - up/bin/install.js
  - up/README.md
  - up/references/questioning.md
must_haves:
  truths:
    - "Nenhuma superfície viva do produto ensina o piso antigo de uma pergunta para tarefa pequena"
    - "O bootstrap injetado nos runtimes sem hook ensina o piso novo, então os quatro runtimes concordam"
    - "A entrada automática do grill tem um mecanismo de classificação que roda de verdade"
  artifacts:
    - path: "up/bin/install.js"
      provides: "Bloco de bootstrap com o piso novo para os três runtimes sem hook"
    - path: "up/workflows/up.md"
      provides: "Profundidade do intake da porta única alinhada ao piso novo"
  key_links:
    - from: "todas as superfícies de profundidade"
      to: "up/skills/up-brainstorm/grill.md"
      via: "citação nominal do motor, sem cópia das regras"
---

# Fase 15 Plano 003: Propagação do piso novo

**Onda**: 2 (depende do plano 001, que cria o motor. Roda em paralelo com o plano 002, que
toca só a skill de brainstorm: não há arquivo em comum entre os dois)
**Domínio**: doutrina distribuída (skill de bootstrap, workflow, comando, instalador, README, reference)
**Tipo de tarefa**: glue de doutrina, prova por inspeção determinística e smoke de instalação
**Objetivo**: o piso antigo está duplicado em seis superfícies vivas. Enquanto elas não forem
alinhadas, três dos quatro runtimes continuam ensinando que tarefa pequena vale uma pergunta, e a
entrada automática do grill vira letra morta fora do Claude. Este plano faz a propagação e mais
nada.

## Contexto obrigatório antes de começar

Leia `.plano/fases/15-modo-grill/CONTEXT.md` e o motor `up/skills/up-brainstorm/grill.md`, entregue
pelo plano 001. Toda regra citada aqui já existe lá: este plano aponta, não reescreve.

**Fronteira com o plano 002**: a skill `up/skills/up-brainstorm/SKILL.md` é território exclusivo do
plano 002, que roda em paralelo com este. Não edite esse arquivo aqui, nem verifique o conteúdo dele
nas checagens deste plano: no momento em que este plano roda, ele pode ainda estar sendo alinhado. A
conferência das seis superfícies juntas acontece no plano 004.

**Regra de não duplicação**: nenhuma superfície tocada aqui pode repetir as regras do laço, das
portas ou da escrita inline. Cada uma recebe no máximo: o piso (quem entra), a precedência (quem
manda) e o ponteiro para o motor. Duplicar regra aqui cria a segunda definição que a fase 14 proíbe.

**Regra de ancoragem**: ancore por título de seção e por trecho de texto, nunca por número de linha.
As fases 13 e 14 rodaram antes e podem ter mexido nestes arquivos.

## Tarefas

<task id="1" type="auto">
<files>
up/skills/usando-up/SKILL.md (editar): bootstrap injetado no início de toda sessão do Claude. Contrato de comportamento: a primeira coisa que o agente lê na sessão já ensina o piso novo e a precedência do pedido manual.
</files>
<action>
Duas edições pontuais, sem reescrever o arquivo.

1. No parágrafo de passo zero, a frase entre parênteses hoje ensina a escala antiga. Troque por uma
   formulação do piso novo, em uma linha, do tipo: profundidade escala por tamanho, trivial fica em
   zero pergunta e pequena, média e grande entram em modo grill (perguntas ilimitadas, uma por vez,
   com saída por palavra de parada a qualquer momento).
2. No parágrafo de profundidade sob controle do usuário, mantenha a ideia de que o tier automático é
   só o piso e acrescente: a flag `--grill` e as palavras "me grelha", "vai fundo", "pergunta mais"
   entram em grill mesmo em tarefa trivial, porque o pedido do dono vence a classificação
   automática; "rápido" ou `--quick` continuam descendo para zero pergunta; e a palavra de parada
   ("chega", "para", "fecha", "basta", "suficiente") encerra as perguntas na hora, sem confirmação,
   sem encerrar a aprovação do design.

Acrescente, no fim do segundo parágrafo, o ponteiro para o motor pelo nome do arquivo companheiro da
skill de brainstorm. Não copie o motor.

Mantenha o tamanho do arquivo no mesmo patamar: é injetado a cada início de sessão e a cada limpeza
de contexto, então cada linha é paga em todo turno inicial. Se o arquivo crescer mais de cinco
linhas com esta tarefa, corte redação, não conteúdo.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/skills/usando-up/SKILL.md && grep -qi "chega" up/skills/usando-up/SKILL.md && ! grep -Eqi "pequena[^\n]{0,60}1 pergunta" up/skills/usando-up/SKILL.md && ! grep -qP '\x{2014}|\x{2013}' up/skills/usando-up/SKILL.md && wc -l up/skills/usando-up/SKILL.md</automated>
</verify>
<done>O bootstrap cita o modo grill, a palavra de parada e a precedência do pedido manual, aponta para o motor pelo nome e não ensina mais uma pergunta para tarefa pequena. O arquivo cresceu no máximo cinco linhas.</done>
</task>

<task id="2" type="auto">
<files>
up/workflows/up.md (editar): workflow da porta única, três pontos: o princípio central, o passo de profundidade do intake e o item de checklist de sucesso. Contrato de comportamento: o roteador escala o intake pelo piso novo e o checklist cobra o comportamento novo.
</files>
<action>
Três edições ancoradas por conteúdo.

1. **Princípio central**: o bloco que lista os três níveis de profundidade em função da classificação
   passa a listar dois: `simple` (trivial) em zero pergunta, anúncio em uma linha; `standard` e
   `complex` em modo grill, com ponteiro para o motor. Mantenha a frase que diz que a profundidade é
   função da classificação e não do humor do dia.
2. **Passo de profundidade do intake**: hoje ele descreve três comportamentos (`simple`, `standard`,
   `complex`). Reescreva assim:
   - `simple` (trivial): inalterado, zero pergunta, anuncia e segue.
   - `standard` e `complex`: entram em modo grill, apontando para o motor. O que sobra específico do
     `complex` é o conteúdo a cobrir (os cinco blocos do intake antigo: briefing, design system,
     credenciais, referências e restrições), que passam a ser assunto das perguntas do grill e não
     uma cadência própria. Preserve integralmente esses cinco blocos e o que cada um faz quando a
     resposta falta (placeholder de tokens, pendência registrada, arquivo de ambiente sem commit).
   - A validação de briefing vago continua como está.
   Não mexa no trecho de bash que grava a descrição em arquivo temporário e chama a classificação:
   ele é o mecanismo de entrada automática e já funciona.
3. **Checklist de sucesso**: o item que cobra "brainstorm escalado (0/1/full)" passa a cobrar
   "brainstorm escalado (0 em trivial, grill nos demais)" e ganha, no mesmo item ou em item novo, a
   cobrança de que o pedido manual tem precedência.

Não introduza travessão nem meia risca nas linhas novas. O arquivo já tem sedimento desses
caracteres em linhas antigas: limpar isso é passe separado e está fora do escopo.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/workflows/up.md && ! grep -Eqi "pequena\)?:? *1 pergunta|standard \(pequena\).{0,40}1 pergunta" up/workflows/up.md && grep -q "classify-task /tmp/up-brief-classify.md" up/workflows/up.md && [ $(grep -cP '\x{2014}|\x{2013}' up/workflows/up.md) -le 8 ] && echo WORKFLOW_OK</automated>
</verify>
<done>Os três pontos citam o piso novo, o motor é apontado pelo nome, o mecanismo de classificação por arquivo temporário continua intacto, os cinco blocos do intake completo continuam presentes e a contagem de travessões não subiu acima do sedimento existente.</done>
</task>

<task id="3" type="auto">
<files>
up/commands/up.md (editar): comando da porta única, duas correções: a tabela de profundidade e a forma de invocar a classificação. Contrato de comportamento: quem lê o comando aprende o piso novo e vê uma invocação de classificação que roda de verdade.
</files>
<action>
Duas edições.

1. **Tabela de profundidade** (as três linhas que hoje dizem Trivial zero perguntas, Pequena uma
   pergunta, Média e Grande brainstorm full): vira duas linhas, Trivial em zero pergunta e as demais
   em modo grill, com ponteiro para o motor pelo nome do arquivo companheiro.
2. **Invocação da classificação**: o bloco de exemplo passa a descrição direto como argumento, e a
   operação de classificação recebe caminho de arquivo, não texto. Do jeito que está documentado, a
   chamada falha. Corrija para a mesma forma que o workflow já usa: gravar a descrição num arquivo
   temporário com frontmatter mínimo e classificar esse arquivo. Copie a forma vigente do workflow
   em vez de inventar outra.

Esta segunda correção entra nesta fase de propósito, e não é desvio: a entrada automática do grill
depende da classificação, e documentar uma invocação que não roda deixaria o piso automático
dependendo de sorte. Registre isso em uma linha no resumo do plano.

Não introduza travessão nas linhas novas.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/commands/up.md && ! grep -Eqi "pequena[^\n]{0,60}1 pergunta" up/commands/up.md && ! grep -Eq 'classify-task "<descricao>"' up/commands/up.md && [ $(grep -cP '\x{2014}|\x{2013}' up/commands/up.md) -le 2 ] && echo COMANDO_OK</automated>
</verify>
<done>A tabela tem duas linhas e cita o motor, a invocação da classificação usa arquivo e casa com a forma do workflow, e a contagem de travessões não subiu.</done>
</task>

<task id="4" type="auto">
<files>
up/bin/install.js (editar): bloco de bootstrap injetado no arquivo de instruções global dos runtimes sem hook (Gemini, OpenCode e Codex). Contrato de comportamento: os três runtimes que não têm hook nem camada de skill nativa recebem o piso novo na doutrina sempre ativa.
</files>
<action>
Localize a função que monta o bloco de bootstrap (ancore pela string de marcador de início do bloco
ou pelo texto "BRAINSTORM-FIRST"). A linha que descreve a escala hoje ensina o piso antigo.

Troque as linhas de escala por uma formulação do piso novo, mantendo o formato de array de strings e
o comprimento de linha do bloco. Conteúdo obrigatório do trecho novo, em no máximo três linhas:

- trivial igual a zero pergunta, anuncia e faz;
- pequena, media e grande entram em modo grill: perguntas ilimitadas, uma por vez, cada uma com
  resposta recomendada;
- saida: palavra de parada ("chega", "para", "fecha", "basta", "suficiente") encerra na hora sem
  confirmacao; checkpoint a cada 3 perguntas; auto-convergencia declarada. O gate de aprovacao do
  design continua.

Mantenha a referência que já existe para o arquivo da skill de brainstorm e acrescente, na mesma
linha ou na seguinte, a referência para o arquivo do motor na mesma pasta, usando a mesma variável
de prefixo de caminho já usada ali (o bloco monta os caminhos a partir dela; não escreva caminho
absoluto na mão).

**Aviso de ambiente**: para conferir o resultado, instale SEMPRE com diretório de configuração
temporário e com a variável de configuração do runtime neutralizada
(`env -u GEMINI_CONFIG_DIR HOME=$TMPH node up/bin/install.js --gemini --global`). Instalar com o
ambiente do dono sobrescreve a instalação real dele.

**Grafia**: o bloco inteiro é escrito hoje sem acentuação. Mantenha o texto novo sem acento, para
não misturar dois estilos dentro do mesmo bloco. Corrigir a acentuação do bloco é passe separado e
está fora do escopo desta fase.

Não altere os marcadores de início e fim do bloco, a função que remove o bloco antigo, nem a ordem
dos itens numerados. A idempotência da injeção depende dos marcadores.
</action>
<verify type="smoke">
<automated>node -e "const s=require('fs').readFileSync('up/bin/install.js','utf8'); if(/pequena = 1 pergunta/i.test(s)) throw new Error('piso antigo ainda no bootstrap'); if(!/grill/i.test(s)) throw new Error('bootstrap nao cita grill'); console.log('BOOTSTRAP_FONTE_OK')" && TMPH=$(mktemp -d) && env -u GEMINI_CONFIG_DIR HOME=$TMPH node up/bin/install.js --gemini --global >/dev/null && grep -qi "grill" $TMPH/.gemini/GEMINI.md && grep -qi "chega" $TMPH/.gemini/GEMINI.md && env -u GEMINI_CONFIG_DIR HOME=$TMPH node up/bin/install.js --gemini --global >/dev/null && [ $(grep -c "UP-BOOTSTRAP:START" $TMPH/.gemini/GEMINI.md) -eq 1 ] && rm -rf $TMPH && echo BOOTSTRAP_IDEMPOTENTE_OK</automated>
</verify>
<done>A fonte não contém mais o piso antigo, uma instalação real em diretório de teste grava o bloco com o piso novo e a palavra de parada no arquivo de instruções do Gemini, e reinstalar não duplica o bloco.</done>
</task>

<task id="5" type="auto">
<files>
up/README.md (editar): documentação pública do pacote, seção de fluxo. Contrato de comportamento: o leitor de fora entende que o UP agora pergunta por padrão e como calar as perguntas em uma palavra.
</files>
<action>
Três edições na seção de fluxo.

1. O caminho rápido continua igual (trivial, zero pergunta), porque nada mudou nele.
2. O caminho médio hoje anuncia uma pergunta-chave. Passa a anunciar modo grill: perguntas
   ilimitadas, uma por vez, com resposta recomendada, até palavra de parada, checkpoint a cada três
   ou auto-convergência declarada.
3. O caminho completo mantém o design por seção e passa a citar que as perguntas também rodam em
   modo grill.

Acrescente, logo abaixo do bloco do caminho médio, duas ou três linhas de prosa explicando a troca,
no tom do resto do README: o UP passou a perguntar por padrão porque perguntar de menos custa mais
caro que perguntar demais, e a saída é barata (uma palavra encerra, sem confirmação).

Zero travessão e zero meia risca: este arquivo está limpo hoje e continua limpo.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/README.md && ! grep -Eqi "pequena[^\n]{0,40}1 pergunta-chave" up/README.md && ! grep -qP '\x{2014}|\x{2013}' up/README.md && echo README_OK</automated>
</verify>
<done>Os três caminhos estão coerentes com o piso novo, a prosa de justificativa existe e o arquivo continua sem travessão.</done>
</task>

<task id="6" type="auto">
<files>
up/references/questioning.md (editar, só acrescentar): reference de questionamento carregada por workflows. Contrato de comportamento: quem chega nesta reference procurando cadência de perguntas encontra o ponteiro para o motor, em vez de inventar cadência própria.
</files>
<action>
Acrescente ao fim do arquivo, dentro da estrutura de tags que ele já usa, um bloco curto (no máximo
oito linhas) com o título de modo grill, contendo apenas:

- o que é o grill em uma frase (o motor de questionamento profundo do UP, modo dentro da skill de
  brainstorm, não skill nova);
- quando entra (piso automático fora de trivial, mais pedido manual com precedência);
- as três portas de saída, nomeadas em uma linha cada, sem detalhar;
- o ponteiro para o arquivo do motor, que é onde as regras moram.

Proibido copiar as regras do laço, a lista de frases proibidas ou a tabela de destilação: isso é
duplicação de definição. Este bloco é índice, não conteúdo.

Se a fase 13 já reescreveu este arquivo e criou uma seção de formato de pergunta, encoste o bloco
novo logo abaixo dela e cite-a, para deixar claro que o grill usa aquele formato.

O arquivo está hoje em inglês. Escreva o bloco novo no idioma que estiver vigente no arquivo no
momento da execução, para não misturar dois idiomas no mesmo documento.
</action>
<verify type="inspecao">
<automated>grep -qi "grill" up/references/questioning.md && [ $(grep -ci "grill" up/references/questioning.md) -le 12 ] && ! grep -qP '\x{2014}|\x{2013}' up/references/questioning.md && echo REFERENCE_OK</automated>
</verify>
<done>O bloco existe, tem no máximo oito linhas, nomeia as três portas sem detalhá-las, aponta para o motor e não duplica nenhuma regra.</done>
</task>

<task id="7" type="auto">
<files>
Todos os arquivos deste plano (verificação, correção pontual se necessário): fechamento de consistência da propagação.
</files>
<action>
Varredura final de propagação, sobre as seis superfícies mais a pasta da skill.

1. Rode a busca de piso antigo nas CINCO superfícies deste plano mais a reference, sem incluir a
   skill de brainstorm (território do plano 002) e sem incluir o changelog (registro histórico):
   `grep -Eni "pequena[^\n]{0,60}1 pergunta|1 pergunta[^\n]{0,60}pequena" up/skills/usando-up/SKILL.md up/workflows/up.md up/commands/up.md up/bin/install.js up/README.md up/references/questioning.md`
   Deve voltar vazio.
2. Confirme que as cinco superfícies deste plano citam o grill e apontam para o motor pelo nome.
3. Confirme que nenhuma delas copiou regra do motor: procure a lista de frases proibidas e a tabela
   de destilação fora do arquivo do motor. Se aparecerem, corte e deixe só o ponteiro.
4. Confirme que a contagem de travessões não subiu em nenhum arquivo tocado, comparando com o
   estado anterior via `git diff`.
5. Commit atômico por arquivo ou por grupo coerente, no padrão do repositório.
</action>
<verify type="inspecao">
<automated>for f in up/skills/usando-up/SKILL.md up/workflows/up.md up/commands/up.md up/bin/install.js up/README.md; do grep -qi grill "$f" || { echo "FALTA_GRILL: $f"; exit 1; }; grep -Eqi "pequena[^\n]{0,60}1 pergunta" "$f" && { echo "PISO_ANTIGO: $f"; exit 1; }; done; git diff --stat && echo PROPAGACAO_OK</automated>
</verify>
<done>A busca de piso antigo volta vazia nas cinco superfícies deste plano, todas citam o grill e apontam para o motor, nenhuma copia regra do motor e os commits estão feitos.</done>
</task>

## Critérios de sucesso do plano

- [ ] As cinco superfícies deste plano ensinam o mesmo piso: trivial em zero pergunta, o resto em grill
- [ ] O bloco de bootstrap dos runtimes sem hook carrega o piso novo e a palavra de parada, e reinstalar não duplica o bloco
- [ ] A invocação de classificação documentada no comando da porta única roda de verdade
- [ ] Nenhuma superfície duplica as regras do motor: todas apontam
- [ ] Nenhum arquivo ganhou travessão novo

## Fora de escopo deste plano

- Escrever ou alterar o motor. É o plano 001, e mexer aqui cria conflito de edição.
- Editar a skill de brainstorm. É o plano 002, que roda em paralelo com este.
- Escrever teste automatizado e sonda de comportamento. É o plano 004.
- Corrigir a acentuação do bloco de bootstrap dentro do instalador e o sedimento de travessão que já existe no workflow, no comando e no instalador. Passe de refatoração com briefing próprio.
- Alterar o changelog do pacote. Entra no plano 004, junto do fechamento.
- Mudar a lógica de instalação, a conversão de formato entre runtimes ou a lista de skills instaladas.
- Mexer no comando e no workflow de tarefa avulsa, nos agentes e nos templates.
