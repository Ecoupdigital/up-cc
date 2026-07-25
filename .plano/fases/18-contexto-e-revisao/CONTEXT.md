# Contexto da Fase 18: Contexto e revisão

**Objetivo da fase**: o sistema para de empurrar trabalho com contexto degradado e para de esconder
problema de qualidade atrás de falha de conformidade.

**Origem**: `.plano/BRIEFING-tier-ab-grill.md`, bloco 5, itens 10 e 11.
**Requisitos**: CTX-01 a CTX-12, REV-01 a REV-09, mais os transversais REG-01, REG-02 e REG-03.
**Mapa das superfícies existentes**: `.plano/SYSTEM-DESIGN.md`, seções 4, 5.1, 6 e 7.

Este arquivo guarda o que vale para os sete planos. Cada plano aponta para cá em vez de repetir.

## Grafo de execução da fase

```
Onda 1              Onda 2                        Onda 3            Onda 4
001 ferramentas ──┬──> 002 higiene prescrita ──┬──> 006 orquestração ──┐
                  ├──> 003 fio vivo do estado ─┼──────────────────────>├──> 007 gate e regressão
                  └──> 005 limiar e monitor ───┴──────────────────────>│
004 eixos isolados ───────────────────────────────> 006 ───────────────┘
```

| Plano | Onda | Depende de | Requisitos |
|-------|------|-----------|------------|
| 001 Ferramentas determinísticas de higiene de contexto | 1 | nada | CTX-04 a CTX-08, mais o mecanismo de CTX-01 e CTX-02 |
| 004 Os dois eixos como subagentes isolados | 1 | nada | REV-01, REV-04, REV-05, REV-07, REV-08 |
| 002 Higiene de contexto prescrita | 2 | 001 | CTX-01, CTX-02 |
| 003 Fio vivo do documento de estado | 2 | 001 | CTX-11, CTX-12 |
| 005 Limiar de zona segura e monitor que oferece | 2 | 001 | CTX-03, CTX-09, CTX-10 |
| 006 Orquestração paralela e relatório lado a lado | 3 | 002, 004 | REV-02, REV-03, REV-06 |
| 007 Gate conjuntivo por eixo e regressão zero | 4 | 003, 005, 006 | REV-09, REG-01, REG-02, REG-03 |

Os dois blocos (contexto e revisão) são independentes entre si. O bloco de revisão fecha por último
porque é ele que altera a semântica do gate.

**Posição no grafo do ciclo**: a fase 18 depende da fase 13 e roda em paralelo com as fases 14, 16 e 17.
A dependência de leitor aponta para a fase 16, e ela é dura, conforme a decisão D2.

**A numeração das ondas começa em um, e não em zero, de propósito.** Verificado por execução: o índice de
planos da fase lê a onda do frontmatter com uma conversão numérica seguida de valor alternativo, e zero é
falso nessa conversão, então plano declarado na onda zero é promovido silenciosamente para a onda um.
Numerar a partir de um evita que as duas primeiras ondas desta fase colapsem numa só, o que colocaria
cinco planos em paralelo e quebraria a disjunção de arquivos descrita abaixo. O defeito em si pertence à
fase 17, que é dona da derivação da fronteira, e está registrado aqui apenas para não ser redescoberto.

## Por que estas ondas, e não menos

A onda não foi escolhida por afinidade de assunto, e sim por posse de arquivo. Planos da mesma onda rodam
em paralelo, em executores separados, então dois planos da mesma onda escrevendo no mesmo arquivo é
corrida de escrita. O despachante da CLI e o workflow de construção são tocados por vários planos desta
fase, e por isso cada um deles tem no máximo um dono por onda.

Consequência registrada para quem for reorganizar isto depois: juntar 001 com 002 ou 006 com 007 parece
economia e não é, porque devolveria dois donos do mesmo arquivo à mesma onda.

Regra que vale para todos os planos que editam o despachante da CLI: nunca reescrever o arquivo inteiro,
somente edição por âncora, relendo imediatamente antes de editar.

## Decisões travadas do dono, válidas para toda a fase

**D1. O gate é conjuntivo.** A fase só aprova com os dois eixos aprovados. O eixo que já aprovou fica
registrado e não é reexecutado na rodada de correção: volta apenas o reprovado. Com isso, o estado
"conformidade reprova e qualidade aprova" passa a ser representável no log sem que a fase avance.

**D2. Dependência dura com a fase 16.** A leitura de linha antiga do log de aprovações usa o leitor único
definido na fase 16, sob o requisito PROVA-04. Nenhum plano desta fase implementa um segundo leitor. Se o
leitor não existir no momento da execução, o plano 007 para na primeira tarefa e escala, em vez de
improvisar.

**D3. Limiar de zona segura: setenta por cento da janela ocupada.** A pergunta, a recomendação, o motivo
e as alternativas rejeitadas estão escritos no plano 005, que é o dono do requisito. Não repetir o motivo
nos outros planos: apontar para lá.

## Decisões de design tomadas neste planejamento

**P1. Uma única implementação de "referência, nunca cópia".** A regra vale para o handoff (CTX-07) e para
o documento de estado (CTX-11). Duas implementações da mesma regra seriam o mesmo erro que o dono apontou
no leitor do log. Por isso o plano 001 cria a biblioteca de higiene de contexto e o plano 003 a consome.

**P2. Contagem de agentes vai de doze para treze.** O revisor único é aposentado e substituído por dois
agentes de eixo, com conjuntos de ferramentas assimétricos: o eixo de conformidade não recebe nenhuma
ferramenta capaz de ler código, e o eixo de qualidade não recebe navegação. O eixo de qualidade também
assume os escopos de planejamento e de entrega, que são revisões que leem artefato. Alternativa
rejeitada: manter um agente só com sinalizador de modo, rejeitada porque REV-01 exige subagentes isolados
e REV-04 exige que a cegueira venha do conjunto de ferramentas concedido, que é declarado por arquivo de
agente.

**P3. Eixo não avaliado escala, e não passa em silêncio.** Sem spec disponível (REV-08), o eixo de
conformidade não é disparado e o relatório registra a ausência. No gate, isso não vira aprovação
automática nem bloqueio permanente: vira escalonamento ao dono, no formato de pergunta da fase 13, com a
recomendação de registrar a ausência e fechar com o eixo que rodou, e a alternativa de escrever os
requisitos agora. Em modo automático, segue a recomendação e registra débito técnico, que é o mesmo
desfecho que a aprovação forçada por cap de rework já tem hoje. Aprovar em silêncio seria fabricar prova;
bloquear para sempre seria beco sem saída.

**P4. A limpeza de contexto entre execuções de plano é uma fronteira do orquestrador.** O orquestrador não
consegue limpar a própria janela por conta própria. O que ele faz na fronteira é largar o contexto inline
da onda anterior, re-hidratar do disco e registrar a fronteira. Quando o limiar de zona segura já foi
cruzado nesse ponto, ele oferece handoff em vez de seguir.

**P5. O campo de eixo no log é aditivo.** As seis colunas documentadas continuam iguais e a linha ganha um
campo final de eixo, uma linha por eixo por rodada. Linha sem o campo é herança e vale para os dois eixos.
O campo de evidência aparece nas duas linhas com o mesmo valor, porque a evidência é da fase e não do
eixo, e assim a checagem de evidência que já existe continua valendo qualquer que seja a linha encontrada.

## Convenções desta fase

Nome de arquivo de plano: `NNN-PLAN.md`, começando em `001-PLAN.md`. O índice de planos reconhece esse
nome. Resumo correspondente: `NNN-SUMMARY.md`.

Texto de interface em português com acentuação. Zero travessão longo e zero travessão médio, em código,
comentário, documento ou mensagem. Commit sempre pela CLI de ferramentas.

Nenhuma instalação no diretório de configuração real durante a fase. Toda instalação de teste vai para
diretório temporário, pelas variáveis de ambiente que o instalador já respeita. Instalar por cima da
configuração real trocaria os agentes vivos no meio da própria execução da fase.

## Fora de escopo da fase inteira

Corte de sedimento nos templates e nos workflows, poda de instrução morta e conversão de negações em
positivo. Os planos editam o que precisam e não fazem faxina em volta.

Revisão em dois eixos para o escopo de entrega global e para o escopo de planejamento. Esta fase muda o
gate de fase; os outros dois escopos continuam com um eixo.

Migração retroativa de log de aprovações já gravado. Linha antiga continua sendo lida como veredito
válido dos dois eixos, sem reescrita.

Leitura das duas convenções de nome de plano e de resumo. É requisito da fase 17.

Unificar o arquivo de retomada versionado do workflow de pausa com o handoff efêmero. Os dois convivem.
