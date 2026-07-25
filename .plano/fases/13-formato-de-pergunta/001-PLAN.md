---
phase: 13-formato-de-pergunta
plan: 001
type: feature
wave: 0
depends_on: []
requirements: [PERG-01, PERG-02, PERG-03, PERG-04, PERG-05]
autonomous: true
prova: smoke
---

# Fase 13, Plano 001: Contrato canônico da pergunta

## Objetivo

Criar a fonte única do formato de pergunta do UP. Ao fim deste plano existe um documento de doutrina que
define, em texto literal e sem margem de interpretação: (a) o formato obrigatório de toda pergunta feita ao
dono (pergunta, recomendação, motivo), (b) a regra de fato contra decisão com o protocolo de resolução
prévia, (c) como um subagente que não fala com o dono escala uma decisão, e (d) o inventário fechado dos
vinte pontos de pergunta com texto literal no produto, cada um com identificador estável.

Nenhuma superfície é editada aqui. Este plano só escreve o contrato que os planos 002, 003 e 004 aplicam e
que o plano 005 verifica. É a onda 0 da fase e a fase inteira depende dele.

## Onda

**Onda 0.** Não depende de nada. Bloqueia os planos 002, 003, 004 e 005 desta fase.

## Contrato de comportamento dos artefatos tocados

| Artefato | Contrato de comportamento | Arquivo hoje |
|----------|---------------------------|--------------|
| Referência de questionamento | Documento de doutrina carregado sob demanda pelas superfícies que perguntam. É a única definição do formato de pergunta, da regra de fato contra decisão e do inventário de pontos de pergunta. Se ele mudar de lugar, quem o carrega passa a carregar o novo lugar, e o conteúdo continua sendo o mesmo contrato | `up/references/questioning.md` |

Fato verificado em 2026-07-25: esse arquivo existe, tem 156 linhas em inglês sobre extração de intenção em
projeto novo, e **não é carregado por nenhuma superfície** (busca por `questioning` nos agentes, workflows,
skills e comandos devolve zero referências de carregamento). Consequência para este plano: escrever o
contrato ali é necessário mas não suficiente. Quem faz o arquivo ser lido são os planos 002, 003 e 004.

## Tarefas

### 1. Escrever o bloco de formato obrigatório de pergunta

**Contrato:** existe uma definição única do formato de pergunta, com rótulos fixos, regra de renderização
para runtime com e sem ferramenta de opções, e regra de honestidade da recomendação.

**Arquivo hoje:** `up/references/questioning.md`, inserir **antes** da linha 1 atual (`<questioning_guide>`).

**O que fazer:** inserir no topo do arquivo, exatamente este conteúdo:

```markdown
<contrato_de_pergunta>

# Contrato de pergunta do UP

Fonte única. Toda superfície que fala com o dono carrega este arquivo antes da primeira pergunta e aplica o
contrato abaixo sem reescrevê-lo.

## 1. Nenhuma pergunta crua

Toda pergunta feita ao dono chega com resposta recomendada e com o motivo dela. O dono confirma ou corrige.
Ele não redige a resposta do zero. Isso converte entrevista em revisão.

Formato obrigatório, nesta ordem e com estes rótulos:

Pergunta: a pergunta, uma só, em uma frase
Recomendo: a resposta que o agente daria se tivesse que decidir agora
Porque: o motivo, em no máximo duas frases, nomeando a evidência que sustenta a recomendação
Opções: opção recomendada | alternativa | alternativa

A linha Opções só existe quando a lista de respostas é fechada. As três primeiras são obrigatórias sempre.

Regras de renderização:

- Quando o runtime tem ferramenta de pergunta com opções, a opção recomendada é a **primeira** da lista, e o
  texto da pergunta carrega as linhas Recomendo e Porque. O rótulo curto da opção não precisa da palavra
  recomendada: a recomendação mora no texto da pergunta, que existe em todo runtime.
- Quando não há ferramenta de opções, a pergunta sai como texto puro com os mesmos rótulos.
- Resposta livre do dono sempre vence a recomendação. Não existe pergunta cuja única saída seja aceitar a
  recomendação.
- Uma pergunta por vez.

Regra de honestidade da recomendação: a linha Porque nomeia a evidência (o arquivo lido, a decisão já
registrada, o trade-off que decide). Se o agente não consegue nomear evidência, ele não tem recomendação, e
só há duas saídas: ou é fato que ele deixou de pesquisar, e então ele pesquisa (seção 2), ou é escolha sem
critério disponível, e então a linha Porque declara qual critério de desempate o dono precisa aplicar.

Recomendar não é enviesar. Opção enviesada é a que presume a resposta sem dizer por quê. A recomendação
deste contrato vem sempre com o motivo e com a correção livre, e por isso é o oposto de enviesar.
```

**Critério de aceite:** o arquivo começa com `<contrato_de_pergunta>`; contém as três linhas de rótulo
obrigatório (`Pergunta:`, `Recomendo:`, `Porque:`) descritas como obrigatórias; contém a regra de opção
recomendada em primeiro lugar; contém a regra de honestidade nomeando evidência.

**Prova:** `grep -c "Recomendo:" up/references/questioning.md` maior que zero e leitura da seção.

### 2. Escrever a regra de fato contra decisão com o protocolo de resolução prévia

**Contrato:** antes de qualquer pergunta o agente varre, em ordem fixa, as fontes onde a resposta pode já
estar escrita. Fato descoberto não vira pergunta, vira anúncio de uma linha. Decisão nunca é resolvida pelo
agente sozinho.

**Arquivo hoje:** `up/references/questioning.md`, dentro do bloco `<contrato_de_pergunta>`, após a seção 1.

**O que fazer:** acrescentar exatamente:

```markdown
## 2. Fato contra decisão

FATO: já tem uma resposta certa escrita em algum lugar que o agente alcança. Fato nunca vira pergunta.
DECISÃO: tem mais de uma resposta defensável, e escolher muda o que vai ser construído ou custa para
reverter. Decisão nunca é resolvida pelo agente sozinho.

### Protocolo de resolução prévia

Roda antes de QUALQUER pergunta, nesta ordem, e para na primeira fonte que responde:

1. Decisões já travadas pelo dono: perfil do dono, tabela de decisões do estado do projeto, contexto da fase.
2. Artefatos de planejamento: estado, requisitos, roadmap, projeto, briefing.
3. Mapa do código existente, quando houver.
4. Leitura e busca direta no código: ler arquivo, buscar padrão, listar diretório.
5. Histórico do repositório: log, diff e autoria, quando a pergunta é sobre o que mudou ou por quê.
6. Configuração e ambiente executável: configuração do projeto, manifesto de dependências, scripts
   disponíveis, saída de comando determinístico.

Resolveu: não pergunte. Declare em uma linha o que descobriu e de onde veio, e siga. Exemplo de anúncio:
"O projeto já usa o gerenciador declarado no manifesto, sigo com ele."

Não resolveu, e é fato: continue procurando na fonte seguinte. Esgotadas as seis, declare que a fonte não
existe e trate o assunto como decisão.

Duas fontes discordam: isso é decisão (qual delas vence) e sobe como pergunta com recomendação.

### Teste de classificação

Aplicar a cada pergunta candidata, antes de emiti-la:

- Existe uma resposta que qualquer leitor do repositório encontraria? Então é FATO: não pergunte, descubra.
- Há duas respostas defensáveis, e a escolha muda o produto, a arquitetura, o escopo ou o custo de reverter?
  Então é DECISÃO: pergunte, com recomendação.
- É segredo que só o dono tem (credencial, acesso, preferência nunca registrada)? Então pergunte, e a
  recomendação vira o valor padrão sugerido quando existir um. Segredo não é adivinhável, mas a **necessidade**
  do segredo é: só peça a credencial depois de esbarrar na parede que a exige, nunca antes por precaução.

### Proibições

- Proibido perguntar o que o protocolo acima resolve.
- Proibido o agente resolver sozinho uma escolha de arquitetura ou um trade-off.
- Proibido perguntar duas coisas na mesma pergunta para economizar rodada.
```

**Critério de aceite:** o protocolo tem as seis fontes numeradas na ordem acima; o teste de classificação
tem os três casos; o bloco de proibições tem as três linhas.

**Prova:** leitura da seção e `grep -c "^[1-6]\." ` sobre o trecho do protocolo devolvendo 6.

### 3. Escrever a regra de escalação de subagente

**Contrato:** subagente não fala com o dono. Ao esbarrar numa decisão, ele devolve um bloco de formato fixo
no retorno estruturado, segue provisoriamente pela própria recomendação, e o workflow que o despachou
apresenta a pergunta ao dono. Resposta que confirma a recomendação não gera retrabalho; resposta que diverge
gera re-execução dirigida só do que dependia daquela decisão.

**Arquivo hoje:** `up/references/questioning.md`, dentro do bloco `<contrato_de_pergunta>`, após a seção 2.

**O que fazer:** acrescentar exatamente:

```markdown
## 3. Escalação de subagente

Subagente não fala com o dono. Ao esbarrar numa DECISÃO ele não decide em silêncio e não inventa: devolve o
bloco abaixo no retorno estruturado, e o workflow que o despachou apresenta a pergunta ao dono no formato da
seção 1.

## DECISOES ESCALADAS

- Decisao: o que precisa ser escolhido, em uma frase
  Recomendo: a opção recomendada
  Porque: motivo em até duas frases, nomeando a evidência
  Alternativas: opção B | opção C

Regras:

- Máximo de 3 decisões escaladas por retorno. Aparecendo mais de 3, agrupe as relacionadas numa decisão só.
  Nunca resolva em silêncio para caber no limite.
- Sem nenhuma decisão a escalar, o bloco sai mesmo assim, com a única linha: Nenhuma. O bloco ausente é
  indistinguível de esquecimento, e por isso é proibido.
- O subagente segue o trabalho aplicando a própria recomendação, e marca no resultado que aquilo é
  provisório. Isso não é resolver sozinho: é adiantar trabalho sob hipótese declarada, com a decisão indo ao
  dono antes do fechamento.
- Confirmada a recomendação, nada é refeito. Divergindo, refaz-se apenas o que dependia daquela decisão.
```

**Critério de aceite:** o bloco literal `## DECISOES ESCALADAS` está no arquivo com os quatro rótulos
(`Decisao`, `Recomendo`, `Porque`, `Alternativas`); o limite de 3 está escrito como número; a linha
`Nenhuma.` está prevista.

**Prova:** `grep -n "DECISOES ESCALADAS" up/references/questioning.md` devolve linha.

### 4. Escrever o inventário fechado dos pontos de pergunta

**Contrato:** ponto de pergunta é todo lugar do produto onde existe texto literal de pergunta ao dono. Cada
um é marcado no arquivo da superfície com uma tag de identificador estável, e a lista dos identificadores é
fechada e mora no contrato. Ponto novo só existe depois de entrar nessa lista. Isso torna possível uma
verificação de mão dupla: nenhum identificador declarado sem tag, nenhuma tag sem identificador declarado.

**Arquivo hoje:** `up/references/questioning.md`, dentro do bloco `<contrato_de_pergunta>`, após a seção 3, e
fechando com `</contrato_de_pergunta>`.

**O que fazer:** acrescentar exatamente (a tabela é literal, não resumir nem reordenar):

```markdown
## 4. Inventário dos pontos de pergunta

Ponto de pergunta é todo lugar do produto onde existe texto literal de pergunta ao dono. Cada um é marcado no
arquivo da superfície assim:

<pergunta id="identificador">
Pergunta: ...
Recomendo: ...
Porque: ...
Opções: ...
</pergunta>

A tag é conteúdo da pergunta, não substitui a chamada da ferramenta: a instrução em volta continua dizendo
qual ferramenta usar quando o runtime tem uma.

A superfície de confirmação de início cobre todo ponto em que o dono autoriza a execução a **começar ou a
continuar**, e por isso inclui as paradas do laço de execução.

Esta é a lista fechada:

| id | Superfície | Arquivo hoje | O que pergunta |
|----|-----------|--------------|----------------|
| up.proxima-acao | Roteamento da porta única | up/workflows/up.md | Qual a próxima ação depois de restaurar o estado |
| up.decisao-chave | Roteamento da porta única | up/workflows/up.md | A decisão-chave da tarefa classificada como pequena |
| up.clone-intake | Roteamento da porta única | up/workflows/up.md | Com que stack o app clonado é recriado |
| up.config-editar | Roteamento da porta única | up/workflows/up.md | Qual opção de configuração mudar |
| brainstorm.decisao-chave | Brainstorm | up/skills/up-brainstorm/SKILL.md | A decisão-chave do tier pequena |
| brainstorm.checkpoint | Brainstorm | up/skills/up-brainstorm/SKILL.md | Fechar a rodada ou continuar perguntando |
| plan.intake-minimo | Planejamento | up/workflows/plan.md | O que falta para planejar quando não há briefing |
| plan.decisoes-escaladas | Planejamento | up/workflows/plan.md | As decisões que os agentes escalaram |
| plan.revisor-bloqueou | Planejamento | up/workflows/plan.md | O que fazer quando a revisão do planejamento bloqueia |
| build.runtime-divergente | Confirmação de início | up/workflows/build.md | Seguir com runtime diferente do planejado |
| build.plano-incompleto | Confirmação de início | up/workflows/build.md | O que fazer quando falta artefato do plano |
| build.iniciar-execucao | Confirmação de início | up/workflows/build.md | Iniciar a execução |
| build.onda-falhou | Confirmação de início | up/workflows/build.md | Como seguir quando uma onda inteira falha |
| build.replan-esgotado | Confirmação de início | up/workflows/build.md | Como seguir quando o limite de re-planejamento acaba |
| build.testar-antes-do-merge | Gate visual pré-merge | up/workflows/build.md | Testar na tela antes de aterrissar a fase |
| build.aprovou-ou-ajusta | Gate visual pré-merge | up/workflows/build.md | Aprovar ou pedir ajuste depois de testar |
| build.fechamento-fase | Fechamento de fase | up/workflows/build.md | Como aterrissar a fase |
| build.revisor-bloqueou | Fechamento de fase | up/workflows/build.md | O que fazer quando a revisão da fase bloqueia |
| auditar.relatorio-existente | Auditoria | up/workflows/auditar.md | Sobrescrever ou manter o relatório anterior |
| auditar.converter-em-fases | Auditoria | up/workflows/auditar.md | Converter achados aprovados em fases |

</contrato_de_pergunta>
```

**Critério de aceite:** a tabela tem exatamente 20 linhas de dado; as sete superfícies do inventário são
roteamento da porta única, brainstorm, planejamento, confirmação de início, gate visual pré-merge,
fechamento de fase e auditoria; nenhuma linha aponta para a própria referência de questionamento; o bloco
fecha com `</contrato_de_pergunta>`.

**Prova:** comando determinístico que conta as linhas da tabela e devolve 20 (ver tarefa 6).

### 5. Resolver o conflito com o guia em inglês que já existe no arquivo

**Contrato:** o mesmo arquivo não pode dizer que recomendar é ruim e obrigar a recomendar. O texto anterior
continua valendo no que não conflita, e a linha conflitante passa a ser explícita sobre o que é proibido.

**Arquivo hoje:** `up/references/questioning.md`, seção `<using_askuserquestion>`, item da lista `Bad options`,
hoje escrito como `- Leading options that presume an answer`.

**O que fazer:**

1. Trocar aquela linha por: `- Leading options that presume an answer **without stating why** (a recommendation with a stated reason is required, see contrato_de_pergunta section 1)`.
2. Acrescentar, na primeira linha do bloco `<questioning_guide>`, a frase: `Este guia é subordinado ao contrato_de_pergunta acima: onde houver conflito, o contrato vence.`

Não traduzir, não reescrever e não podar o resto do guia em inglês. Corte de sedimento é passe separado com
briefing próprio, declarado fora do escopo do ciclo.

**Critério de aceite:** o arquivo não contém mais a proibição genérica de opção enviesada sem a ressalva; a
frase de subordinação está presente.

**Prova:** `grep -n "without stating why" up/references/questioning.md` devolve linha.

### 6. Verificar a parseabilidade do inventário e commitar

**Contrato:** o inventário precisa ser legível por máquina, porque o plano 005 vai compará-lo com as tags
encontradas nas superfícies. Se o comando abaixo não devolver 20 identificadores, a tabela está malformada.

**Arquivo hoje:** `up/references/questioning.md`.

**O que fazer:** rodar, a partir da raiz do repositório:

```bash
node -e "
const fs=require('fs');
const t=fs.readFileSync('up/references/questioning.md','utf-8');
const ids=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|/gm)].map(m=>m[1]);
console.log(ids.length, new Set(ids).size);
console.log(ids.join('\n'));
"
```

Saída esperada: primeira linha `20 20` (vinte identificadores, todos distintos). Se der diferente, a tabela
está malformada e a tarefa 4 precisa ser corrigida antes de commitar.

Depois commitar apenas este arquivo:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(pergunta): contrato canonico de pergunta e inventario dos pontos" --files up/references/questioning.md
```

**Critério de aceite:** comando devolve `20 20`; commit atômico com um único arquivo.

**Prova:** saída do comando colada no resumo do plano, mais o hash do commit.

## Critérios de aceite do plano

- [ ] A referência de questionamento contém o bloco `<contrato_de_pergunta>` fechado, com as quatro seções.
- [ ] O formato obrigatório está escrito com os rótulos `Pergunta:`, `Recomendo:`, `Porque:` e `Opções:`.
- [ ] O protocolo de resolução prévia tem seis fontes em ordem fixa e o teste de classificação tem três casos.
- [ ] O bloco de escalação de subagente está literal, com limite numérico de 3 e com a linha `Nenhuma.`.
- [ ] O inventário tem 20 identificadores distintos, cobrindo as sete superfícies interativas.
- [ ] O conflito com o guia em inglês está resolvido por edição cirúrgica, sem tradução nem poda.
- [ ] Commit atômico feito com um único arquivo.

## Tipo de prova exigida

**Smoke.** A prova é a leitura estruturada do artefato mais o comando determinístico da tarefa 6 devolvendo
`20 20`. Não há comportamento executável neste plano: ele é doutrina pura, e a doutrina só vira comportamento
nos planos 002, 003 e 004.

<verification>
```bash
node -e "const fs=require('fs');const t=fs.readFileSync('up/references/questioning.md','utf-8');const ids=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|/gm)].map(m=>m[1]);console.log(ids.length, new Set(ids).size);"
# esperado: 20 20
grep -c "contrato_de_pergunta" up/references/questioning.md   # esperado: 2 (abertura e fechamento)
grep -c "DECISOES ESCALADAS" up/references/questioning.md     # esperado: maior que 0
grep -c "without stating why" up/references/questioning.md    # esperado: 1
```
</verification>

## Fora de escopo

- **Editar qualquer superfície.** Este plano não toca workflow, skill, agente, comando ou instalador. Quem
  aplica o contrato são os planos 002, 003 e 004.
- **Traduzir a referência de questionamento para português.** O guia em inglês fica como está, com uma única
  edição cirúrgica na linha conflitante. Corte de sedimento é passe separado, com briefing próprio.
- **Criar reference nova ou versão comprimida do contrato.** Fonte única significa um arquivo. Se o custo de
  contexto virar problema, a compressão é passe separado.
- **Criar arquivo de glossário, de decisão ou de rejeição.** São artefatos da fase 14 e não existem ainda.
  Este plano não pode assumi-los nem prepará-los.
- **Declarar aresta de dependência entre planos em formato novo.** O grafo de bloqueio é da fase 17. Aqui a
  onda numerada é a única forma usada.
- **Modo grill, perguntas ilimitadas e escrita inline de termo.** São da fase 15.
- **Mudar o número, o nome ou a semântica das sete superfícies.** O inventário se ajusta ao mapa que já existe
  no desenho do sistema; ele não redefine o mapa.
