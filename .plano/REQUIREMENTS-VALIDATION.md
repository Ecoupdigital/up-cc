---
validated: 2026-07-25
rodada: 2 (revalidação após correção do arquiteto)
escopo: ciclo 2 (fases 11 a 20), categorias DIST, CICLO, PERG, MEM, GRILL, PROVA, PLANO, CTX, REV, AUD, WAY, REG
fora_da_validacao: ciclo 1 (INFRA, MELH, IDEIA, INTEG), preservado como histórico
requisitos_avaliados: 95
score: 85
grade: GOOD
checks_passed: 11/13
blocking: não para o ciclo, sim para as fases 16 e 18
veredito: READY com trava declarada nas fases 16 e 18
rodada_anterior: 46 por cento, 6 de 13, NEEDS_WORK
---

# Validação de Requisitos: ciclo 2 do UP (rodada 2)

Releitura integral do disco: `.plano/REQUIREMENTS.md`, `.plano/ROADMAP.md`, `.plano/SYSTEM-DESIGN.md`,
`.plano/PROJECT.md` e `.plano/BRIEFING-tier-ab-grill.md`, mais inspeção do código do gate, do índice de
planos e do histórico do repositório. Nenhuma alegação de correção foi aceita sem verificação.

## Veredito

**READY, com trava declarada nas fases 16 e 18.**

Onze dos treze checks passam. A fronteira inicial do ciclo (fase 13) está liberada, e com ela as fases
14, 15, 17, 19 e 20. Sobra um defeito de severidade alta, confinado a dois requisitos que descrevem o
mesmo leitor do log de aprovações por caminhos que não se encontram. A correção é de duas frases e não
toca a fronteira, então travar o ciclo inteiro por ela seria desproporcional. A trava fica onde o defeito
mora:

**As fases 16 e 18 não entram em planejamento antes da correção R1.** As demais podem seguir.

Salto em relação à rodada anterior: de 46 para 85 por cento. As duas famílias de falha da rodada 1
(aceite não coletável e contrato incompatível) foram atacadas de verdade, não maquiadas. Os treze
requisitos órfãos agora têm critério observável, os cinco do tipo "se comporta melhor" foram reescritos
com contagem ou artefato visível, e o requisito que faltava para o contrato de nome de plano existe.

## Placar por check

| # | Check | Rodada 1 | Rodada 2 | Nota |
|---|-------|----------|----------|------|
| 1 | Cobertura dos 13 itens em 7 blocos | PASSOU | PASSOU | Mantida |
| 2 | Cobertura dos 12 critérios de sucesso do briefing | PASSOU | PASSOU | Mantida |
| 3 | Cobertura das superfícies interativas | FALHOU | PASSOU | PERG-02 com sete, e o design passou a listar as mesmas sete |
| 4 | Nenhum escopo inventado | PASSOU | PASSOU | Os 95 requisitos traçam para o briefing |
| 5 | Não-escopo (YAGNI) respeitado | PASSOU | PASSOU | As duas ressalvas de fronteira viraram texto declarado |
| 6 | Todo requisito com âncora de aceite | FALHOU | PASSOU | 95 de 95 ancorados. Ressalva R2 |
| 7 | Todo requisito falsificável | FALHOU | PASSOU | Os cinco casos reescritos com sinal coletável |
| 8 | Número onde o briefing exige número | FALHOU | PASSOU | Ressalva R4 sobre dois valores que caem no plano |
| 9 | Rastreabilidade e aritmética | PASSOU | PASSOU | 95 confirmados, somas por fase conferidas uma a uma |
| 10 | Identificadores únicos e sequenciais | PASSOU | PASSOU | PLANO-13 continua a sequência, sem duplicata |
| 11 | Sem contradição interna | FALHOU | FALHOU | Resta R1, mais a janela do verbete de onda (R3) |
| 12 | Sem contradição com o contrato do log de aprovações | FALHOU | FALHOU | R1: o furo mudou de lugar, não fechou |
| 13 | Sem contradição com o contrato de nome de plano | FALHOU | PASSOU | PLANO-13 bate com as convenções reais em disco |

**Score: 11 de 13, igual a 85 por cento. Grade GOOD.**

## Verificação das alegações do arquiteto

Cada uma tratada como hipótese a falsificar. Nenhuma foi reprovada, uma foi confirmada apenas em parte.

| Alegação | Resultado | Evidência |
|----------|-----------|-----------|
| PLANO-13 criado, cobrindo plano e resumo, amarrado à fase 17 | CONFIRMADA | Requisito presente, âncora no critério 3 da fase 17 com prova vermelho e verde, e a redação cobre as três formas reais em disco |
| PROVA-04 reescrito dizendo como a compatibilidade é obtida | CONFIRMADA EM PARTE | Cobre o vocabulário de evidência e o fragmento de topo. Não cobre o seletor nem a leitura posicional. Ver R1 |
| PROVA-03 com cláusula de validade e desfecho para plano antigo | CONFIRMADA | "Gerado a partir deste ciclo" mais "plano anterior passa e registra a ausência como aviso". Ganhou também a nomeação da fronteira como contrato público, que era o gap G6 |
| REV-09 com a decisão do dono, registrada como D7 | CONFIRMADA | Gate conjuntivo e eixo aprovado não reexecutado no requisito, e D7 na tabela de decisões do dono, com as alternativas rejeitadas |
| Os 13 requisitos órfãos agora com critério observável | CONFIRMADA | Conferido um a um contra os critérios de sucesso das fases. Mapa completo na seção seguinte |
| Os cinco do tipo "se comporta melhor" reescritos | CONFIRMADA | MEM-02 por contagem com aceite zero, GRILL-05 pela declaração de dependência na transcrição, PROVA-02 pela declaração por fronteira, PLANO-08 pela verificação estática contra lista fechada, CTX-01 e CTX-02 por ação observável |
| Adjetivo trocado por número em PLANO-07, REV-05 e PLANO-08 | CONFIRMADA | "Cem mil tokens" e "quatrocentas palavras", ambos sem o "da ordem de" |
| PERG-02 com sete superfícies | CONFIRMADA | E o design foi atualizado junto: a seção 7 passou de seis para sete linhas, com o roteamento da porta única incluído |
| G5 a G19 corrigidos, mais fora de escopo nas fases 16 e 17 | CONFIRMADA | As linhas de fora de escopo aparecem nos dois documentos, e a exceção do glossário está declarada no não-escopo do ciclo |
| Bloco do ciclo 1 idêntico byte a byte | CONFIRMADA | O diff contra o commit anterior tem uma única linha removida em cada arquivo, e é o título. Nenhuma linha de requisito, de fase histórica ou de rastreabilidade do ciclo 1 foi tocada. A troca de título está declarada como decisão A10 |

Conferências extras que ninguém pediu e que passaram: zero travessão longo e zero travessão curto nos
cinco arquivos; nenhum marcador de pendência em texto novo (o único "TBD" está no bloco histórico da
fase 10, preservado de propósito e declarado em A9).

## Os três pontos de risco apontados pelo coordenador

### 1. Compatibilidade sem furo: o furo mudou de lugar, não fechou

Verificado no código do gate, que aparece igual no workflow de governança e no de build:

- O seletor da entrada é `grep "phase-${PHASE_NUMBER}.*up-revisor"`.
- O veredito é lido por posição fixa: `awk -F'|' '{print $4}'`.
- A evidência é filtrada por vocabulário fechado: `evidence=(logic|ui|glue):(test_pass|visual|smoke)`.

As duas linhas reais em disco são `fase=11 plano=001 | APPROVED | evidence=smoke:pass` e a equivalente da
fase 12. Elas quebram os três, e em ordem:

1. **Seletor.** Não contêm `up-revisor` nem `phase-11`, e sim `fase=11`. O `grep` devolve vazio, e o gate
   para em "up-revisor não logou veredito" antes de chegar em qualquer outra regra.
2. **Posição.** Se fossem encontradas, elas têm cinco colunas e não seis, porque falta a coluna do
   agente. A quarta coluna delas é a evidência, não o veredito. O `awk` leria `evidence=smoke:pass` no
   lugar de `APPROVED`.
3. **Vocabulário.** Já coberto por PROVA-04.

PROVA-04 fechou o item 3 e o fragmento de topo, e deixou 1 e 2 abertos. Pior: a remediação que ela
prescreve ("ignorando o que não reconhece") entra em rota de colisão com REV-09, que manda ler a mesma
linha ("linha antiga com veredito único continua sendo lida como veredito válido dos dois eixos"). Para
as duas linhas concretas as instruções não são disjuntas, são opostas, e as duas saídas dão errado: se
ignorar, o veredito histórico some e o gate reclama de ausência; se ler pela regra posicional, o veredito
sai trocado pela evidência. O SYSTEM-DESIGN seção 5.1 herdou a mesma lacuna, porque descreve a
compatibilidade nas mesmas três exigências.

Correção sugerida R1, uma frase em cada requisito.
PROVA-04, trocar o fecho por: "O leitor do gate localiza os campos por conteúdo e não por posição fixa:
o escopo pelo número da fase em qualquer das notações em uso, o veredito pela palavra de veredito, e a
evidência pelo prefixo do campo, com ou sem a coluna do agente. Só é ignorada a linha que não carrega
veredito nenhum, como o fragmento não estruturado do topo."
REV-09, acrescentar ao fim: "A leitura da linha antiga é a mesma descrita em PROVA-04, e não uma segunda
implementação."
Refletir as duas na seção 5.1 do design, que hoje repete a lista incompleta.

Nota de precisão, para o plano não corrigir o alvo errado: as duas linhas divergentes foram escritas à
mão, fora do workflow. O escritor oficial emite o formato documentado de seis colunas com `phase-N` e
`up-revisor`, e as fases 11 e 12 rodaram fora do roadmap. Ou seja, não há hoje descompasso entre escritor
e leitor no caminho normal. O problema é de leitura do histórico, que REV-09 promete por escrito.

### 2. A correção de G7 não empurrou o problema, mas abriu uma janela

Conferido: nenhum requisito da fase 17 redefine o termo onda. PLANO-03 descreve a mudança de
comportamento (a onda deixa de ser a verdade da ordem de execução), que é comportamento e não verbete, e
por isso não colide com MEM-02.

E a fase 14 não passou a depender de conhecimento que só existe na 17: a forma final do verbete já está
escrita no briefing e nos requisitos, então quem executa a 14 consegue escrever o verbete hoje.

O que sobrou é menor e é de janela, não de dependência. O grafo põe 14 e 17 como irmãs independentes da
13, então a 14 pode fechar e mergear muito antes da 17. Nesse intervalo o glossário publicado descreve a
onda como visão derivada enquanto o produto ainda a trata como ordem primária. O glossário é artefato do
produto, distribuído nos quatro runtimes por exigência do próprio MEM-01, então um release cortado no
meio do ciclo levaria a divergência ao usuário.

Correção sugerida R3, uma linha, sem inverter o grafo: acrescentar aos critérios de sucesso da fase 17
"o verbete de onda do glossário interno confere com o comportamento entregue nesta fase". Assim a 14
escreve e a 17 confirma, e a janela vira item verificado em vez de dívida silenciosa.

### 3. Aritmética: confere, e a assimetria aparente está correta

- **Total.** 3 DIST, 2 CICLO, 6 PERG, 12 MEM, 10 GRILL, 8 PROVA, 13 PLANO, 12 CTX, 9 REV, 11 AUD, 6 WAY
  e 3 REG. Soma 95. Confere com o declarado.
- **Somas por fase.** 13 igual a 9 (6 mais 3), 14 igual a 15 (12 mais 3), 15 igual a 13 (10 mais 3), 16
  igual a 11 (8 mais 3), 17 igual a 16 (13 mais 3, já com PLANO-13), 18 igual a 24 (12 mais 9 mais 3),
  19 igual a 14 (11 mais 3), 20 igual a 9 (6 mais 3). Todas conferem com a tabela de detalhamento.
- **Fase dona única.** Todo requisito novo tem exatamente uma fase dona. PLANO-13 aparece só na 17. As
  únicas exceções são REG-01, REG-02 e REG-03, transversais por decisão declarada (A3), e as categorias
  DIST e CICLO, presas às fases 11 e 12 já concluídas.
- **Assimetria explicada.** A soma dos totais por fase dá 111, e não 90, porque os três requisitos de
  regressão contam nas oito fases. Está certo: a tabela por fase é "o que esta fase verifica", não uma
  partição dos requisitos. Registrado aqui para que ninguém "conserte" a conta numa rodada futura.

## Mapa das âncoras que estavam faltando

Os treze órfãos da rodada 1, agora com critério observável. Conferido um a um.

| Requisito | Âncora nova | Coletável por |
|-----------|-------------|---------------|
| MEM-02 | Fase 14, critério 9 | Contagem de redefinições, aceite zero |
| MEM-04 | Fase 14, critério 7 | Inspeção do arquivo |
| MEM-08 | Fase 14, critério 8 | Inspeção de um registro |
| GRILL-05 | Fase 15, critério 9 | Transcrição da rodada |
| PROVA-02 | Fase 16, critério 2 | Campo do plano, por fronteira |
| PLANO-08 | Fase 17, critério 5 | Verificação estática contra lista fechada |
| CTX-01 | Fase 18, critério 10 | Comportamento ao retomar sem plano pronto |
| CTX-02 | Fase 18, critério 11 | Declaração no registro da fase |
| CTX-09 | Fase 18, critério 12 | Inspeção da doutrina |
| REV-04 | Fase 18, critério 8 | Conjunto de ferramentas do subagente |
| REV-05 | Fase 18, critério 9 | Contagem de palavras da saída |
| DIST-02 | Fase 11, critério 5 | Registrado com a ressalva honesta de que foi conferido por leitura de código, não por execução |
| REG-03 | Último critério de cada fase, 13 a 20 | Projeto com planejamento antigo |

Também ganharam âncora, sem terem sido pedidas: PLANO-13 (fase 17, critério 3), AUD-09 (fase 19,
critério 6, agora com o campo no card), e as cláusulas novas de MEM-01 (fase 14, critérios 6 e 10).

## Pendências

### R1, severidade alta, trava as fases 16 e 18

Detalhada acima. PROVA-04 e REV-09 descrevem o mesmo leitor do log por caminhos que não se encontram, e
nenhum dos dois cobre o seletor por nome de agente e a leitura do veredito por posição fixa. Sem isso, a
fase 16 e a fase 18 produzem dois leitores diferentes do mesmo arquivo, ou um leitor com instrução
contraditória. Correção de duas frases, mais o reflexo na seção 5.1 do design.

### R2, severidade baixa

PERG-02 lista sete superfícies, e o formato da pergunta é verificado em cinco: brainstorm (fase 13,
critério 1) e roteamento, confirmação de início, fechamento de fase e gate visual (fase 13, critério 3).
Ficam sem verificação a superfície de planejamento e o handoff da auditoria.
Correção sugerida: incluir o planejamento no critério 3 da fase 13, e acrescentar ao critério 4 da fase
19 que a pergunta única de handoff também chega com recomendação e motivo.

### R3, severidade baixa

Janela entre a fase 14 e a fase 17 em que o verbete de onda descreve comportamento ainda não entregue.
Correção sugerida na seção 2 acima: um critério de saída na fase 17.

### R4, severidade baixa

AUD-01 e CTX-03 exigem que o número exista, seja declarado e seja ajustável, sem fixar o valor. É
legítimo, porque o valor é do artefato e não do requisito, e o briefing também não o fixa. Mas o valor
precisa cair no plano da fase, senão vira decisão adiada indefinidamente. Registrar como pergunta com
recomendação no planejamento das fases 19 e 18.

### Observação de histórico, fora do escopo desta validação

A fase 10 aparece desmarcada na lista de fases e concluída na tabela de progresso, e a fase 7 aparece com
um de dois planos. É inconsistência do ciclo 1, declarada como dívida conhecida na decisão A17 e
preservada de propósito para manter o bloco histórico intacto. Não é gap do ciclo 2.

## O que está certo e não deve ser mexido

- Cobertura integral dos treze itens, dos sete blocos e dos doze critérios de sucesso do briefing.
- Rastreabilidade fechada: 95 de 95 com fase, somas conferidas, PLANO-13 nas duas tabelas.
- Bloco do ciclo 1 intacto, com a única mudança de título declarada como decisão.
- A disciplina de não citar caminho de arquivo em requisito e roadmap, com os endereços isolados no
  documento de design, que é o único autorizado a tê-los (decisão A7).
- PROVA-03, que era a contradição mais cara da rodada 1 e virou o requisito mais bem redigido do bloco:
  cláusula de validade, desfecho declarado para o plano antigo e a fronteira nomeada como contrato
  público, resolvendo dois gaps numa frase.
- D7 registrada como decisão do dono, com alternativa rejeitada e motivo, em vez de escolha silenciosa do
  agente.
- REG como critério de saída de cada fase, e não como fase de regressão no fim.
