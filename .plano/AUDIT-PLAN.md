---
audited_at: "2026-07-25T05:16:31Z"
auditor: up-revisor
escopo: planejamento do ciclo 2 (fases 13 a 20, 43 planos)
rodada: 2 (revisão após rework)
planning_confidence: 86
recommendation: READY_FOR_BUILD
stage_1_cobertura: 100
stage_2_qualidade: 86
issues_bloqueantes: 0
issues_importantes: 1
issues_menores: 6
precondicao_declarada: regeneração do PLAN-READY.md do ciclo 2
rodada_anterior: 72, NEEDS_REWORK
---

# Auditoria de Planejamento: ciclo 2 do UP (rodada 2)

Revisão two-stage adaptada a planejamento, segunda passada. Objeto: os mesmos 43 planos em 8 fases,
depois do rework feito por cinco agentes em paralelo (planejadores das fases 13, 17, 18 e 19, mais o
arquiteto). Cada alegação de correção foi tratada como hipótese a falsificar e reverificada contra o
disco, com execução do índice de planos, extração mecânica das tags e recálculo da matriz de colisão.
Uma alegação foi reprovada em parte, e uma avaliação minha da rodada anterior estava errada e está
corrigida abaixo.

**Planning Confidence Score: 86/100** (rodada anterior: 72)

**Recomendação: READY_FOR_BUILD (APPROVE), com uma precondição declarada e sete dívidas registradas.**

| Eixo | Peso | Rodada 1 | Rodada 2 | Contribuição |
|------|------|----------|----------|--------------|
| A. Cobertura de requisitos | 40 | 100 | 100 | 40,0 |
| B. Coerência interna dos planos | 20 | 85 | 92 | 18,4 |
| C. Executabilidade do grafo e das ondas | 25 | 40 | 82 | 20,5 |
| D. Prontidão do artefato de entrada do build | 15 | 30 | 45 | 6,8 |
| **Total** | **100** | **72** | | **85,7, arredondado para 86** |

Nenhum dos 43 planos impede o build. A única coisa que ainda impede é um artefato que não é plano, o
`PLAN-READY.md`, e ele já tem dono e ordem declarada.

---

## Stage 1: cobertura, reverificada do zero

Não reaproveitei o resultado da rodada anterior: a extração foi refeita sobre o disco atual, porque
cinco agentes editaram frontmatter em paralelo e frontmatter editado é exatamente onde requisito some.

| Métrica | Valor | Estado |
|---------|-------|--------|
| Requisitos pendentes do ciclo 2 | 90 | inalterado |
| Requisitos com plano dono | 90 | inalterado |
| Requisitos órfãos | 0 | inalterado |
| Requisitos com dono em mais de uma fase, fora de REG | 0 | inalterado |
| Planos com o campo `requirements` no frontmatter | 43 de 43 | inalterado |
| Planos com seção de fora de escopo | 43 de 43 | inalterado |
| Travessão longo ou curto nos planos, roadmap, requisitos e desenho | 0 | inalterado |
| Marcador de pendência em texto novo | 0 | inalterado |

O rework não custou cobertura. Stage 1 continua passando em sete de sete.

---

## Stage 2: verificação das cinco alegações

### Alegação 1: onda zero renumerada. CONFIRMADA, e melhor do que o pedido

Verificado por varredura do campo `wave` nos 43 planos: nenhum `wave: 0` em disco. Verificado por
execução do índice contra o disco, agora:

| Fase | Índice devolve | Bloqueador roda antes do dependente? |
|------|----------------|--------------------------------------|
| 13 | `{1:[001], 2:[002,003,004], 3:[005]}` | Sim |
| 14 | `{1:[001,002], 2:[003,004,005], 3:[006]}` | Sim |
| 15 | `{1:[001], 2:[002,003], 3:[004]}` | Sim |
| 16 | `{1:[001], 2:[002], 3:[003], 4:[004], 5:[005]}` | Sim |
| 17 | `{1:[001,003], 2:[002,004], 3:[005]}` | Sim |
| 18 | `{1:[001,004], 2:[002,003,005], 3:[006], 4:[007]}` | Sim |
| 19 | `{1:[001], 2:[002,003], 3:[004], 4:[005], 5:[006]}` | Sim |
| 20 | `{1:[001], 2:[002,003], 3:[004], 4:[005]}` | Sim |

Cruzei cada onda contra o `depends_on` declarado de cada plano: em nenhuma das oito fases um plano
aparece na mesma onda de um bloqueador seu. O paradoxo de bootstrap da fase 17 morreu.

O acréscimo que eu não tinha pedido é o que fecha o assunto de verdade. O plano 002 da fase 17, tarefa
6, passa a fixar na doutrina que a menor onda publicada é um enquanto a leitura antiga existir em
projeto instalado, com a Decisão 5 registrada e a alternativa rejeitada nomeada: "plano não pode
depender do conserto que ele mesmo entrega". Isso impede a reincidência em ciclos futuros, e não apenas
neste. É a diferença entre corrigir o sintoma e corrigir a regra.

Bônus verificado: a contagem de tarefas deixou de ser zero em todas as fases (13 agora reporta 6 e 7,
17 reporta 7 e 8, 18 reporta 6 a 8), o que confirma que a correção do contador de tarefa em português
da fase 17 é genérica, e não específica da fase que a escreveu.

### Alegação 2: os 17 planos foram estruturados. CONFIRMADA, e as tags são honestas

A alegação fácil de fazer aqui seria preencher `<files>` por baixo só para passar num check de
presença. Testei exatamente isso, com um falsificador: extraí de cada plano todo caminho de produto
citado no corpo e subtraí o que está declarado em `<files>` e em `files_modified`. Cada resto foi
inspecionado à mão.

Resultado: **nenhum caso de escrita escondida**. Todos os restos caem em três categorias legítimas:

1. Invocação de comando dentro de `<verify>` ou de bloco de execução, isto é, leitura ou execução, não
   escrita. Exemplos conferidos linha a linha: `18:002` cita o despachante só em
   `node up/bin/up-tools.cjs janela estado`; `19:003` só em `up-tools.cjs audit-report render`;
   `20:005` só em invocações de `roadmap` dentro de um projeto temporário.
2. Menção a arquivo que outro plano edita, no texto que descreve o inventário de superfícies. É o caso
   do `13:001`, que nomeia os workflows para o inventário do contrato e edita apenas a reference.
3. Menção negativa declarada, do tipo "não tocar". É o caso do `16:002` com a reference de governança.

As três alegações específicas do coordenador conferem:

- **A fase 13 não escreve no despachante.** Confirmado, e ela prova isso por máquina: o plano 005 tem a
  verificação `test -z "$(git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v
  perguntas.test.cjs)"`. É a fase inteira se auditando contra o próprio diff, e não uma promessa em
  prosa. Minha matriz da rodada 1 contava a fase 13 no despachante e estava errada, porque eu contei
  invocação como escrita. Corrigido.
- **A fase 17 declara caminho real por tarefa.** Confirmado. Ela reverteu a aplicação antecipada da
  regra de durabilidade ao próprio frontmatter, que era autoaplicação prematura de uma regra que ela
  ainda vai entregar. Os cinco planos agora nomeiam biblioteca de planos, módulo de checagem,
  despachante, motor de execução, fluxo de planejamento, doutrina do planejador e template do plano
  pronto. A colisão da fase 17 deixou de ser inferida da prosa e passou a ser auditável.
- **A fase 18 nomeia a região dentro de cada arquivo.** Confirmado, e é o melhor formato dos três.
  Exemplo literal: "editar: requires do topo, bloco de comentário de uso, switch do main, seções novas
  de comando handoff e janela, subverbos novos na seção de fase". Duas fases escrevendo no mesmo arquivo
  com regiões nomeadas é conflito que o git resolve; sem região nomeada é conflito que o humano resolve.

### Alegação 3: duas camadas no grafo. CONFIRMADA na estrutura, REPROVADA numa afirmação

A solução do arquiteto é conceitualmente correta e é melhor do que a que eu recomendei. Eu havia pedido
aresta mais nota de serialização. Ele separou as duas em camadas nomeadas, com a justificativa certa:
dependência lógica vira aresta, posse de arquivo é exclusão mútua e não vira aresta, porque transformar
disputa de escrita em dependência lógica mentiria sobre o motivo e envenenaria a fronteira derivada que
a fase 17 vai entregar.

O que ficou bom, verificado no roadmap:

- Camada 1 com a aresta 16 para 18, refletida também na linha "Depende de" da fase 18 e na linha
  "Bloqueia" da fase 16, com o motivo escrito.
- Camada 2 com as fases 14, 16, 17 e 18 em série, nesta ordem, e a explicação de por que exclusão mútua
  não é aresta.
- Regra de execução da fronteira derivada, que vale para o mecanismo que a fase 17 entrega e não só
  para este ciclo: "fronteira liberada não autoriza paralelismo entre dois trabalhos que escrevem no
  mesmo arquivo. A fronteira responde quem pode começar, nunca quem pode começar junto." Isso corrige
  um defeito de desenho que estava prestes a nascer com a própria fase 17.
- Corolário de edição por âncora para o despachante, o motor de execução e o instalador.

**Isso resolve o achado dos 19 arquivos ou é documentação de um risco vivo?** Resolve a maior parte, e
não é só documentação, porque a serialização muda a mecânica: cada fase corta a própria branch do HEAD
corrente, então rodar em série faz cada fase partir do resultado já mesclado da anterior. Deixa de
existir base defasada, que era a causa real. Os três casos mais caros da rodada 1 (o bloco de gate
disputado, o agente removido enquanto duas fases o editam e o campo duplicado no template) saem do
mapa por ordem garantida.

**O que reprovo é uma frase.** O roadmap afirma: "As fases 15, 19 e 20 seguem paralelizáveis dentro do
que a camada 1 permitir, porque escrevem majoritariamente em superfícies próprias." Recalculei a matriz
de colisão sobre as tags novas, considerando apenas pares que nem a camada 1 nem a camada 2 ordenam.
Sobram 13 arquivos em disputa:

| Arquivo | Fases e planos, entre pares não ordenados |
|---------|--------------------------------------------|
| `up/bin/up-tools.cjs` | 16:001/003/005, 17:001/002/003/004, 18:001/003/006/007, 19:001/002/004/006, 20:001/002/003/004 |
| `up/workflows/build.md` | 16:002/004/005, 17:001/002, 18:002/006/007, 20:004 |
| `up/workflows/plan.md` | 16:002/004, 17:001/003, 18:002/004, 20:003 |
| `.plano/ROADMAP.md` | 16:005, 17:005, 19:006, 20:001/002/005 |
| `.plano/REQUIREMENTS.md` | 16:005, 19:006, 20:005 |
| `.plano/governance/approvals.log` | 16:004, 17:005, 20:005 |
| `.plano/STATE.md` | 17:005, 18:003, 20:005 |
| `up/skills/up-brainstorm/SKILL.md` | 15:002, 18:002, 20:003 |
| `up/skills/usando-up/SKILL.md` | 15:003, 18:005 |
| `up/workflows/up.md` | 15:003, 18:002 |
| `up/bin/install.js` | 15:003, 18:004 |
| `up/README.md` | 15:003, 18:004 |
| `up/commands/plan.md` | 18:004, 20:003 |

A fase 15 disputa quatro arquivos com a fase 18, incluindo o instalador e a skill de bootstrap. As
fases 19 e 20 disputam o despachante, o motor de execução e o fluxo de planejamento com 16, 17 e 18.
"Majoritariamente em superfícies próprias" é otimismo, não fato.

A severidade, porém, caiu muito: são acréscimos aditivos (caso novo no despachante, passo novo no
workflow) e não reescritas concorrentes do mesmo bloco, e a regra de edição por âncora já está escrita.
A correção é uma frase, e está em RV-007 abaixo.

### Alegação 4: proteção dos blocos herdados antes de dividir o revisor. CONFIRMADA, com metade automatizada

O plano 004 da fase 18 ganhou uma tarefa 1 nova que lê o revisor único inteiro e produz um inventário
com um marcador textual por bloco, nomeando explicitamente os dois blocos de fora: o de confirmação de
tautologia, escrito pela fase 16, e os ponteiros de glossário, escritos pela fase 14. A instrução é
"PARAR e escalar, em vez de dividir um arquivo que ainda vai receber escrita de outra fase". A tarefa 8
confere, por busca, que cada marcador do inventário aparece no agente de destino, e declara que
marcador ausente é falha de tarefa e não observação. O critério de aceite inclui, em item próprio, que
o bloco de tautologia da fase 16 está no eixo de qualidade.

**A proteção é real, e depende de ordem que agora está garantida** para a fase 16, por aresta na camada
1. Para a fase 14, a ordem vem da camada 2, que é regra escrita e não aresta.

**Onde ela é só metade:** a verificação automatizada da tarefa 1 é
`grep -qi "tautologia" up/agents/up-revisor.md && test -s .../004-inventario.txt`. Ela detecta a
ausência do bloco da fase 16 e **não** detecta a ausência dos ponteiros de glossário da fase 14. A
parada por causa da fase 14 é prosa. E o plano 004 da fase 14 continua declarando
`up/agents/up-revisor.md` sem guarda própria de existência.

O risco residual é baixo, porque a fase 14 é a primeira da série e é ancestral de 15 e 19, então
inverter a ordem exigiria contrariar duas camadas ao mesmo tempo. Mas a assimetria existe e custa uma
condição a mais no mesmo comando. Ver RV-006.

### Alegação 5: template com `plan_schema` único. CONFIRMADA

Verificado por varredura: `plan_format` tem **zero ocorrências** no repositório inteiro. Os cinco planos
da fase 17 declaram `plan_schema: 2`, o mesmo marcador que a fase 16 cria no plano 003. O plano 003 da
fase 17 escreve a regra explícita: "É a mesma política que a fase 16 aplica ao campo de fronteiras
confirmadas, e o marcador é o mesmo, criado por ela. Não criar um segundo nome de marcador."

A descoberta da fase 17 procede: a fase 16 acrescenta **três** chaves ao template, não duas. A
verificação do plano 003 da fase 16 confirma isso por máquina, com
`grep -q "plan_schema: 2" && grep -q "Fronteiras Confirmadas" && grep -q "fora_de_escopo"`, e ainda
carrega um controle negativo elegante, `grep -q "CEO"`, que prova que o sedimento declarado fora de
escopo continuou onde estava.

**Sobre a guarda de "se já existir" estar nos dois lados:** ela está em um lado, e é o lado certo. O
plano 004 da fase 17 traz a guarda literal: "Antes de escrever, conferir se a chave de fora de escopo
já existe no frontmatter. Se existir, não duplicar", mais a mesma regra para a seção de corpo. Do lado
da fase 16 a guarda não é necessária e seria ruído: conferi o template atual e ele **não tem** nenhuma
das três chaves hoje, e a camada 2 põe a fase 16 antes da 17. Guarda de idempotência pertence a quem
chega depois. Aprovo como está.

---

## Correção da minha avaliação da rodada 1

O coordenador está certo, e a minha descrição do mecanismo estava errada.

Eu escrevi que "sem regenerar esse arquivo, o ciclo 2 inteiro não entra em execução, ou entra parseando
lixo". A primeira metade é falsa. Verifiquei o código:

- O passo 0.2 do motor de execução só falha quando o arquivo **não existe**. Ele existe, ainda que
  velho, então esse gate passa.
- O passo V.1 extrai `runtime`, `intended_execution`, `total_phases` e `planning_confidence` por `grep`,
  e devolve string vazia para cada um, sem falhar.
- O passo V.4 faz `PLANS=$(grep -oE "fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md" .plano/PLAN-READY.md)`
  e itera. Com `$PLANS` vazio, o `for` não executa nenhuma iteração e `FAIL` nunca é setado.

Ou seja: o build **não trava**. O estágio de validação passa sempre, porque nunca valida nada. É pior
que travar, como o coordenador diz, porque a falha fica silenciosa e o dono recebe um "tudo OK" que não
foi verificado. E o padrão `[0-9]+-[0-9]+-PLAN.md` é uma **quarta** convenção de nome, que não casa com
nenhuma das três em uso no repositório.

**Isso deve entrar no PLANO-13 ou virar dívida?** Recomendo **entrar no escopo**, como um item a mais na
tarefa 7 do plano 001 da fase 17, e não como rodada de rework. Três motivos:

1. O plano 001 da fase 17 já é dono dessa superfície e já edita o motor de execução. A tarefa 7 dele já
   diz que "dois consumidores param de reimplementar a convenção de nome", e este é o terceiro, no mesmo
   arquivo.
2. A Decisão 1 daquele plano existe exatamente contra este caso: "corrigir doze cópias garante que a
   décima terceira nasça errada". Deixar a cópia do estágio V é escolher fabricar a décima terceira.
3. O custo é um item de tarefa, não um plano novo, e o plano ainda não começou a executar. Emendar
   plano não iniciado não consome rodada de rework.

Critério de aceite sugerido, em uma linha: o estágio de validação de planos resolve a lista pela
biblioteca de planos em vez de por expressão regular de nome, e lista vazia passa a ser falha explícita
em vez de sucesso silencioso.

Se o dono preferir não tocar, vira dívida registrada, e o risco a aceitar por escrito é: o UP mantém um
estágio de validação que sempre aprova, e a leitura de nome de plano fica corrigida em 3 de 4 lugares.

---

## Inconsistências remanescentes

Nenhuma bloqueante. Uma importante, seis menores.

### RV-007 (IMPORTANTE): a camada 2 não cobre as fases 15, 19 e 20

**Tipo:** afirmação otimista sobre risco real. **Onde:** `.plano/ROADMAP.md`, camada 2, frase sobre as
fases 15, 19 e 20.

Detalhado na alegação 3. Treze arquivos em disputa entre pares que nenhuma das duas camadas ordena, com
o despachante da CLI, o motor de execução e o fluxo de planejamento entre eles.

**Correção, uma frase, sem rodada de rework:** trocar "porque escrevem majoritariamente em superfícies
próprias" pela fronteira real. Sugestão de redação: as fases 15, 19 e 20 têm cada uma superfície própria
dominante, mas ainda escrevem no despachante da CLI, no instalador, no motor de execução e no fluxo de
planejamento. Vale para elas a mesma regra de execução da fronteira: quando duas delas, ou uma delas e
uma das quatro serializadas, estiverem liberadas ao mesmo tempo e escreverem no mesmo arquivo, a
execução as serializa e a segunda relê o arquivo imediatamente antes de editar.

Não recomendo estender a serialização dura a 15, 19 e 20: isso sequenciaria o ciclo inteiro e mataria o
paralelismo que o grafo existe para permitir. A regra de execução já escrita, aplicada também a elas, é
a dose certa.

### RV-013 (MENOR, decisão pedida): estágio de validação de planos que sempre aprova

Detalhado na seção de correção acima. Recomendação: entra no escopo, como item da tarefa 7 do plano 001
da fase 17.

### RV-006 (MENOR): a guarda do bloco herdado da fase 14 é prosa, e a da fase 16 é máquina

Detalhado na alegação 4. **Correção:** acrescentar uma condição ao mesmo comando de verificação da
tarefa 1 do plano 004 da fase 18, buscando também o marcador dos ponteiros de glossário da fase 14. Uma
condição a mais num `grep` que já existe.

### RV-014 (MENOR): segundo escritor no log de aprovações, sem atualizar a matriz de escrita

**Onde:** o plano 004 da fase 16 grava no log real deste repositório a entrada
`| phase-16 | up-planejador | CONFIRMED | ... | evidence=seams:confirmed`. A matriz de escrita por
artefato, na seção 6 do desenho do sistema, continua dizendo que o log é escrito pelo "Orquestrador do
build, a partir do veredito".

O plano é cuidadoso onde importa: declara que `CONFIRMED` não é veredito de fase, que soma evidência e
nunca substitui a evidência do tipo da fase, e o leitor único da fase 16 trata `CONFIRMED` como não
portador de veredito. A semântica está certa. O que falta é o registro: o próprio desenho diz que "a
violação mais cara do UP é dois atores escrevendo o mesmo artefato com semânticas diferentes", e acabou
de nascer um segundo ator legítimo sem entrar na tabela.

**Correção:** uma linha na seção 6, dizendo que o planejador escreve entrada de confirmação de
fronteiras, que não carrega veredito, e que o veredito continua sendo exclusividade do orquestrador.

### RV-011 (MENOR): duas linhas do desenho do sistema ficaram para trás

A camada 3 e a linha do relatório de revisão foram atualizadas e declaram os dois estados, 12 hoje e 13
ao fim do ciclo. Ficaram: o diagrama de fluxo da seção 3, que ainda mostra apenas o revisor único, e a
linha do log de aprovações da seção 6 (a mesma de RV-014).

### RV-010 (MENOR): plano com onda que não corresponde à dependência declarada

O plano 003 da fase 20 continua com `wave: 2` e `depends_on: []`. Inofensivo hoje. Depois da fase 17 a
onda derivada dirá 1 e a declarada dirá 2, e a divergência vira ruído no índice. Uma linha.

### RV-015 (MENOR): caminho inexistente citado no corpo

O plano 005 da fase 18 cita `up/templates/config.js` no corpo. O arquivo real é
`up/templates/config.json` e está corretamente declarado em `<files>`. É erro de digitação em prosa.

### Dívidas aceitas sem correção

- **RV-009:** de onde a posse de arquivo passa a vir depois que a regra de durabilidade proíbe o plano
  de citar caminho. O roadmap já registra isso como decisão do planejamento da fase 17 e como dívida
  declarada. Aceito: a resposta certa (apoiar a disjunção na aresta declarada, e não na sobreposição de
  arquivos) é justamente o que a fase 17 entrega, e antecipá-la aqui seria planejar duas vezes.
- **RV-012:** o template de auditoria de planejamento carrega sedimento da versão anterior (estágios
  E1, E2 e E2.5, papel de supervisor de planejamento, apresentação via CEO). Tem briefing próprio.

---

## Precondição para o build

**O `.plano/PLAN-READY.md` continua sendo o do ciclo anterior.** Não é achado de planejamento e não
entra no score de rework: o coordenador declarou que o regenera depois deste veredito, e essa é a ordem
certa, porque o arquivo precisa carregar a confiança de planejamento que só existe depois da auditoria.

Registro o que ele precisa ter, para que a regeneração não repita o furo:

1. Frontmatter com `runtime`, `intended_execution`, `total_phases` e `planning_confidence`, que é o que
   o estágio V.1 extrai.
2. As oito fases e os 43 planos, com o grafo de duas camadas.
3. Os nomes de plano na convenção real em uso (`NNN-PLAN.md`), e não na quarta convenção que o estágio
   V.4 procura hoje. Se RV-013 for aceito, o estágio passa a resolver pela biblioteca e a convenção
   deixa de importar; se virar dívida, o `PLAN-READY.md` precisa listar os planos numa forma que aquele
   padrão case, ou a validação continua vazia.
4. `plan_schema` só depois de a fase 16 entregar o marcador. Antes disso, o plano pronto é legado por
   definição e a ausência do campo de fronteiras sai como aviso, que é o comportamento que o plano 003
   da fase 16 desenhou de propósito.

---

## O que está certo e não deve ser mexido

- A cobertura, intacta depois de cinco agentes editarem frontmatter em paralelo.
- A separação em duas camadas do grafo, com a justificativa de por que posse de arquivo não vira
  aresta. É melhor do que a correção que eu havia recomendado.
- A regra de execução da fronteira derivada. Ela corrige um defeito de desenho que ia nascer junto com
  a fase 17: a fronteira responde quem pode começar, nunca quem pode começar junto.
- A doutrina que fixa a menor onda publicada em um enquanto a leitura antiga existir em runtime
  instalado. Corrige a regra, e não o sintoma.
- A verificação por diff da fase 13, que prova por máquina que a fase não escreve fora do próprio
  escopo. Deveria virar padrão para fase que declara não tocar uma superfície quente.
- A tarefa de inventário antes de dividir o revisor, com marcador por bloco e conferência de migração.
- O controle negativo `grep -q "CEO"` na verificação do template, que prova que o sedimento declarado
  fora de escopo continuou fora do escopo. É a forma certa de provar uma não mudança.
- A detecção mecânica, no plano 007 da fase 18, de que a fase 16 fechou, conferindo que os blocos de
  gate já chamam o subcomando. Substituiu uma promessa em prosa por um teste.

---

## Veredito

**READY_FOR_BUILD (APPROVE).**

O rework atacou os três bloqueantes e os quatro importantes da rodada anterior, e em quatro pontos
entregou mais do que foi pedido: a doutrina de piso de onda, a regra de execução da fronteira, a
detecção mecânica do fechamento da fase 16 e a auditoria por diff da fase 13. As cinco alegações foram
verificadas contra o disco e quatro passaram inteiras; a quinta passou na estrutura e falhou numa
afirmação sobre as fases 15, 19 e 20, que é correção de uma frase.

**O que ainda impede o build:** nada dentro dos 43 planos. A única precondição é a regeneração do
`PLAN-READY.md`, que já tem dono e ordem declarada, e cujo conteúdo exigido está registrado acima.

**O que segue como dívida técnica declarada, com o custo de cada uma:**

| # | Dívida | Custo de corrigir | Risco de não corrigir |
|---|--------|-------------------|------------------------|
| RV-007 | Frase otimista sobre 15, 19 e 20 | Uma frase no roadmap | Duas fases podem cortar branch simultânea sobre o despachante |
| RV-013 | Estágio de validação que sempre aprova | Um item na tarefa 7 do plano 001 da fase 17 | O UP mantém um gate que nunca reprova, e a leitura de nome de plano fica 3 de 4 |
| RV-006 | Guarda do bloco da fase 14 é prosa | Uma condição num grep existente | Inversão de ordem apaga os ponteiros de glossário sem alarme |
| RV-014 | Segundo escritor do log fora da matriz | Uma linha na seção 6 do desenho | O registro de quem escreve o quê deixa de estar completo |
| RV-011 | Diagrama de fluxo desatualizado | Uma linha | O mapa mente sobre o revisor depois da fase 18 |
| RV-010 | Onda 2 sem dependência na fase 20 | Uma linha de frontmatter | Ruído entre onda declarada e derivada |
| RV-015 | Caminho com erro de digitação | Uma palavra | Nenhum: o `<files>` está correto |

As quatro primeiras cabem numa emenda aos planos que ainda não começaram, sem consumir rodada de
rework, porque emendar plano não iniciado não é retrabalho de execução. As três últimas podem ser
absorvidas pelo executor da fase correspondente.

Recomendo iniciar pela fase 13, que é a fronteira do ciclo e está sozinha nela, e aplicar as emendas de
RV-007 e RV-013 antes de abrir a fase 17.
