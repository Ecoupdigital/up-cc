---
phase: 14-memoria-do-projeto
verified: 2026-07-26T03:33:21Z
status: passed
score: 15/15 requisitos provados (11 plenos, 1 parcial declarado, 3 de regressão), 11/11 critérios do roadmap
evidence:
  - "logic:test_pass"
  - "glue:smoke"
gaps: []
debitos:
  - id: DEB-14-01
    titulo: "A consulta à base de rejeições não tem linha de comando executável na skill"
    severidade: media
    arquivo: "up/skills/up-brainstorm/SKILL.md"
  - id: DEB-14-02
    titulo: "As duas guardas são listas léxicas fechadas: paráfrase passa"
    severidade: media
    arquivo: "up/bin/lib/memoria-rejeicoes.cjs"
  - id: DEB-14-03
    titulo: "O corte de três frases do MEM-06 não é mecanizado"
    severidade: baixa
    arquivo: "up/bin/lib/memoria-decisao.cjs"
  - id: DEB-14-04
    titulo: "Nenhum gate automático roda a régua de redefinição: o zero pode erodir em silêncio"
    severidade: media
    arquivo: "up/workflows/"
  - id: DEB-14-05
    titulo: "Os 104 casos não têm porta de entrada automática (o repo não tem scripts em package.json)"
    severidade: baixa
    arquivo: "package.json"
  - id: DEB-14-06
    titulo: "Cinco arquivos de teste novos viajam para o runtime do usuário final (sete no total)"
    severidade: baixa
    arquivo: "package.json (campo files)"
debitos_pre_existentes:
  - "init up e init auditar não existem no despachante: falham em silêncio (erro em stderr, variável vazia). O bloco case 'init' não foi tocado por esta fase"
  - "Travessões pré-existentes em massa no repositório. Esta fase acrescentou zero em up/"
  - ".plano/governance/ é gitignored, então a worktree não tem log de gate e não há linha fase=14 gravada"
---

# Fase 14: Memória do Projeto, Relatório de Verificação

**Objetivo da Fase:** O projeto passa a lembrar do vocabulário que fixou, das decisões difíceis que tomou e do que já recusou.
**Verificado:** 2026-07-26T03:33:21Z
**Worktree:** `/home/projects/.up-worktrees/up-cc/fase-14-memoria-do-projeto`, branch `up/fase-14-memoria-do-projeto`
**Base:** 41 commits desde `0b034f4`, árvore de trabalho limpa
**Status:** passed

## Como esta verificação foi feita

Nenhuma alegação de SUMMARY foi aceita como prova. Toda linha de veredito abaixo tem execução minha por trás: projeto temporário virgem para a criação preguiçosa, tentativa de furar cada guarda com entrada minha, injeção de redefinição real para provar que a régua acusa, instalação real com `HOME` temporário e `CODEX_HOME`, e cinco mutações no código de produção para provar que a bateria de testes não é tautológica.

## Alcance do Objetivo

### Verdades observáveis (critérios de sucesso do roadmap)

| # | Verdade | Status | Evidência |
|---|---------|--------|-----------|
| 1 | Nenhum arquivo de glossário, decisão ou rejeição existe antes de haver conteúdo real | PROVADO | 8 operações de leitura em projeto virgem, todas com saída 0, `find` idêntico antes e depois. Escrita reprovada (higiene, gate) também não criou nada |
| 2 | Decisão que falha uma condição não gera registro; a que passa gera registro numerado com alternativas rejeitadas | PROVADO | 4 tentativas de escrita, cada uma falhando em UMA condição: saída 1 e zero arquivos nas quatro. Com as três mais alternativa: `0001-banco.md` com as duas alternativas e o motivo de cada |
| 3 | Dois registros em sequência recebem números distintos e crescentes por varredura | PROVADO | `0001` a `0003` em sequência. Apaguei `0002` e o próximo continuou `0004`: buraco não é preenchido, logo o número vem de varredura e não de contador |
| 4 | Propor de novo um conceito recusado traz a rejeição à tona antes de explorar a intenção | PROVADO no mecanismo, com débito no gatilho | 4 pedidos parecidos casaram, 5 diferentes não casaram, incluindo o caso obrigatório. A pergunta devolvida traz semelhança, motivo original, data, gatilho de reabertura e recomendação com o porquê. Débito DEB-14-01: a skill manda consultar mas não dá a linha de comando |
| 5 | Item já implementado e adiamento por falta de tempo não entram na base | PROVADO para o vocabulário declarado | 6 de 6 marcas de implementado e 8 de 8 marcas de adiamento barradas, inclusive com acento e em maiúsculas. Débito DEB-14-02: paráfrase fora da lista fechada passa |
| 6 | Glossário interno com no mínimo nove termos, cada verbete com sinônimos proibidos, e onda como visão derivada | PROVADO | `lerTermos` devolve 9 verbetes, todos com `Formas` e `Evitar` não vazios (4 a 6 sinônimos proibidos cada). Os nove do briefing estão todos presentes. O verbete de onda diz textualmente que é leitura do grafo de dependência e não a ordem primária de execução |
| 7 | O glossário do projeto declara no próprio arquivo a regra de admissão e a de higiene | PROVADO | As duas regras aparecem no `.plano/GLOSSARY.md` recém-nascido, antes da seção de termos. As duas são aplicadas de verdade: definição com caminho de arquivo recusada, termo genérico recusado sem `--forcar` mais `--justificativa` |
| 8 | O registro de decisão exibe status opcional entre proposta, aceita e substituída | PROVADO | Transição `aceita -> proposta -> substituida` gravada no frontmatter com `substituida_por: 0003`. Integridade referencial existe: substituto inexistente recusado, `substituida` sem alvo recusado, nascer `substituida` recusado |
| 9 | A contagem de redefinições nas superfícies é zero, sem tocar em redação fora desses termos | PROVADO | `check` sobre 84 arquivos das seis pastas: 0 achados, modo estrito com saída 0. O zero não é falso negativo: injetei uma redefinição de cada uma das quatro formas numa cópia e a régua acusou as quatro, com arquivo, linha, termo e forma. "Sem tocar em redação" também é verificável: os 24 agentes e workflows têm 2 linhas acrescentadas e 0 removidas cada |
| 10 | O glossário interno chega aos quatro runtimes na instalação | PROVADO | Instalação real com `HOME` temporário e `CODEX_HOME`: `glossario-up.md` presente em `.claude`, `.gemini`, `.codex` e `.config/opencode`. Nos três runtimes sem hook, o item 6 do bootstrap foi injetado com o caminho certo de cada um |
| 11 | Os sete comandos e os quatro runtimes continuam funcionando, e projeto anterior ao ciclo continua sem migração | PROVADO | 7 comandos presentes nos 4 runtimes. Planejamento legado (STATE, ROADMAP e config antigos, sem artefato de memória) roda as operações de memória com saída 0 e `find` idêntico. Guarda da fase 13 continua verde |

**Score dos critérios:** 11/11.

### Requisitos, um a um

| Req | Veredito | Prova que eu produzi |
|-----|----------|----------------------|
| MEM-01 | PROVADO | 9 verbetes com definição, formas e sinônimos proibidos; onda na forma derivada; distribuição confirmada nos 4 runtimes por instalação real, não pela mensagem do instalador |
| MEM-02 | PROVADO com escopo declarado | 0 redefinições em 84 arquivos; régua provada não vazia por injeção das 4 formas; os 3 cortes seguram (prosa curta, bloco de código, linha que já cita). Cobertura de citação 24 de 24 em agentes e workflows. Escopo: a ação `citacao` mede só agentes e workflows, não comandos, templates nem references |
| MEM-03 | PROVADO | Projeto virgem sobreviveu a 8 leituras sem ganhar um arquivo. Escrita reprovada não cria. O artefato nasce exatamente na primeira gravação aprovada. A mutação 3 (mkdir na leitura) foi pega pela bateria |
| MEM-04 | PROVADO | As duas regras estão dentro do arquivo gerado e são executadas, não apenas declaradas |
| MEM-05 | PROVADO | Gate conjuntivo de verdade: falhar em qualquer uma das três barra a escrita inteira. A mutação 1 (gate deixa de ser conjuntivo) derrubou 5 casos da bateria e 6 do teste ponta a ponta |
| MEM-06 | PARCIAL, declarado | A estrutura é obrigatória e foi gravada: título, contexto, decisão, motivo, condições do gate e alternativas rejeitadas com o motivo de cada. O corte de "até três frases" NÃO é mecanizado: gravei um motivo de dez frases e passou. Ver DEB-14-03 |
| MEM-07 | PROVADO | Varredura, maior mais um, buraco não preenchido |
| MEM-08 | PROVADO | Os três status, mais integridade referencial e proibição de nascer substituída |
| MEM-09 | PROVADO no mecanismo, débito no gatilho | 9 de 9 casos meus corretos, incluindo o obrigatório (`painel de controle do usuario` não casa com `painel de metricas em tempo real`). A mutação 5 (uma palavra solta passa a casar) derrubou 3 casos. Débito: a consulta depende do agente seguir prosa, sem linha executável |
| MEM-10 | PROVADO | A pergunta montada traz a semelhança citada, o motivo original, a data, o gatilho de reabertura declarado e a recomendação com o porquê, terminando na pergunta ao dono. Formato da fase 13 respeitado |
| MEM-11 | PROVADO para a lista fechada | 6 de 6 marcas barradas, com acento e caixa alta. Fora da lista, passa. A mutação 2 (guarda desligada) derrubou 4 casos |
| MEM-12 | PROVADO para a lista fechada | 8 de 8 marcas barradas. Buraco concreto encontrado: "deixar pra depois" passa, embora "deixar para depois" e "fica pra depois" sejam barradas |
| REG-01 | PROVADO para esta fase | 7 comandos presentes nos 4 runtimes após instalação real |
| REG-02 | PROVADO para esta fase | Os 4 runtimes instalam; o glossário e o bootstrap chegam em todos |
| REG-03 | PROVADO para esta fase | Planejamento legado roda sem migração e sem ganhar arquivo |

### Verificação de wiring (nível 3)

| De | Para | Via | Status | Detalhe |
|----|------|-----|--------|---------|
| Despachante da CLI | `memoria.cjs` | `case 'memoria'` | LIGADO | Acréscimo por âncora, `init` intocado |
| `memoria.cjs` | os 4 submódulos | mapa `SUBMODULOS` | LIGADO | Os quatro resolvem e executam pelo binário real |
| Instalador | glossário nos 4 runtimes | cópia de `up/references` mais bootstrap | LIGADO | Confirmado em disco, não pela mensagem |
| 12 agentes e 12 workflows | verbete do glossário | linha de citação | LIGADO | 24 de 24, com os nove termos nomeados e o caminho |
| Skill de brainstorm | `memoria fora-de-escopo buscar` | prosa | FRACO | Nomeia o espaço de comando e o submódulo, mas não dá a linha executável que o resto da casa usa |
| Régua de redefinição | gate de fase | nenhum | AUSENTE | Nada roda `memoria glossario check` automaticamente |

## Prova de que a bateria não é tautológica

104 casos verdes não provam nada sozinhos, ainda mais numa fase cujos commits mostram os `feat` vindo antes dos `test`. Ninguém viu o vermelho contra a implementação ausente. Produzi o vermelho eu mesmo, mutando o código de produção numa cópia e restaurando depois.

| Mutação | Alvo | Resultado |
|---------|------|-----------|
| 1 | Gate deixa de ser conjuntivo | decisão 5 falhas, ponta a ponta 6 falhas |
| 2 | Guarda de "já implementado" desligada | rejeições 2 falhas, ponta a ponta 2 falhas |
| 3 | Criação preguiçosa quebrada (mkdir na leitura) | decisão 1 falha |
| 4 | Corte de bloco de código removido da régua | glossário 1 falha |
| 5 | Dedup passa a casar por palavra solta | rejeições 2 falhas, ponta a ponta 1 falha |

Cópia restaurada: 25, 25, 19 e 16, tudo verde de novo. A bateria restringe comportamento de verdade.

Observação menor: a mutação 3 foi pega pela bateria de decisão, mas não pelo teste ponta a ponta, que nunca chama `decisao listar` ou `proximo-numero` no projeto virgem antes de reconferir. A propriedade está coberta, só não na jornada.

## Débitos desta fase

**DEB-14-01, a consulta não tem linha executável.** `up/skills/up-brainstorm/SKILL.md` manda consultar a base "antes de explorar a intenção" e nomeia o espaço de comando e o submódulo, mas nunca escreve a invocação. A convenção da casa, usada em oito workflows, é `node "$HOME/.claude/up/bin/up-tools.cjs" <comando>`. Sem a linha, o agente precisa descobrir a invocação sozinho. O comando é descobrível (aparece na linha de uso do despachante), então isto degrada confiabilidade em vez de impedir, mas é o ponto mais frágil da entrega.

**DEB-14-02, as guardas são léxicas e fechadas.** Barram 14 de 14 marcas declaradas, inclusive com acento e caixa alta, e não produzem falso positivo em prosa legítima. Não barram paráfrase: "isso ja esta codado no backend", "esse recurso ja foi entregue", "nao temos tempo neste trimestre" e "postergado" entraram na base. A lista fechada é decisão declarada no próprio código, o que é defensável. O que não é defensável é a assimetria: "deixar para depois" e "fica pra depois" barram, "deixar pra depois" não. Correção de uma linha.

**DEB-14-03, o corte de três frases do MEM-06 não é mecanizado.** A estrutura é obrigatória, a brevidade é honra. Motivo de dez frases foi aceito.

**DEB-14-04, a régua não tem gate.** O zero de redefinições é real hoje e foi conferido por mim, mas nada o defende amanhã. Qualquer fase seguinte pode redefinir um termo e nada acusa, porque `memoria glossario check` não é invocado por nenhum workflow.

**DEB-14-05, os 104 casos não têm porta de entrada.** O `package.json` deste repositório não tem seção `scripts`. As baterias só rodam se alguém as chamar uma a uma.

**DEB-14-06, teste viaja para o usuário.** O campo `files` publica `up/bin` inteiro, então os 5 arquivos de teste novos chegam ao runtime instalado (7 no total, contando os 2 anteriores). Padrão pré-existente, ampliado aqui.

## Débitos pré-existentes (não reprovam esta fase)

Conferi por conta própria que não são desta fase:

1. **`init up` e `init auditar` não existem no despachante.** Saem com código 1 e mensagem em stderr. O `up/workflows/auditar.md` faz `INIT=$(node ... init auditar)`, que captura só stdout, então a variável volta vazia e o erro passa despercebido. O diff desta fase não toca o bloco `case 'init'`.
2. **Travessões pré-existentes em massa.** Esta fase acrescentou **zero** travessões em `up/`. As duas ocorrências novas estão em SUMMARY, e as duas são a citação do próprio caractere enquanto o resumo documenta a remoção dele do código. Não é violação de estilo.
3. **`.plano/governance/` é gitignored.** A worktree não tem log de gate, e a árvore principal não tem nenhuma linha `fase=14`. O gate desta fase ainda precisa ser gravado.

## Achado bônus fora do escopo pedido

O plano 006 corrigiu `requirements mark-complete`, que era no-op silencioso: o regex exigia `- [ ] **ID**` em negrito, formato que não existe em nenhum `REQUIREMENTS.md` deste v2. Verifiquei a correção contra sobre-marcação, porque um regex frouxo aqui marcaria requisito errado sem ninguém ver. Com `MEM-01`, `MEM-010` e `MEM-01-B` no mesmo arquivo, só `MEM-01` foi marcado: o corte negativo funciona. Os dois formatos, com e sem negrito, são aceitos, então a correção é retrocompatível. O diff no arquivo real é exatamente 12 linhas trocadas de `[ ]` para `[x]`, nada mais, como o resumo alega.

## Verificação humana necessária

Nada de visual nesta fase (não há UI). O único ponto que só o dono fecha:

- Aceitar ou recusar o DEB-14-01. Se a intenção é que a consulta à base de rejeições aconteça sempre, ela precisa da linha executável na skill, ou melhor, de um ponto determinístico no fluxo. Isso é escolha de design, não defeito de implementação.

## Resumo

A fase entregou o que prometeu. Os três artefatos de memória existem, nascem preguiçosos de verdade, o gate das três condições barra em E lógico de verdade, as duas guardas fecham a porta para o vocabulário que declararam fechar, a dedup casa por conceito e recusa palavra solta, o glossário interno tem os nove verbetes e chega aos quatro runtimes, e a régua de redefinição acusa quando há o que acusar. Nada disso saiu de SUMMARY: saiu de execução minha, com vermelho produzido por mutação.

O que fica em aberto não é entrega faltando, é durabilidade: a consulta depende de o agente seguir prosa sem linha de comando, o zero de redefinições não tem gate que o defenda, e as baterias não têm porta de entrada automática. Nenhum desses três impede o objetivo da fase, e os três viram trabalho barato para quem pegar a fase 15, que é justamente quem vai escrever nesses artefatos.
