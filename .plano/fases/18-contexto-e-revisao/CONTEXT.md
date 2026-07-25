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

**Posição no grafo do ciclo**: a fase 18 depende da fase 13 e da fase 16. A dependência com a 16 foi
resolvida como **aresta explícita**, e não como tolerância: o roadmap declara `16 para 18` na camada de
dependência lógica, a linha de dependência da fase 18 nomeia o leitor único, e a linha de bloqueio da
fase 16 nomeia a fase 18. Era o único acoplamento do ciclo declarado como duro e desenhado como irmão.

Além da aresta, vale a **serialização por posse de arquivo** declarada no roadmap: as fases 14, 16, 17 e
18 executam em série, nesta ordem, mesmo quando a fronteira as liberar juntas. Não é dependência lógica,
é exclusão mútua: as quatro escrevem no despachante da CLI, no motor de execução e no instalador. A fase
18 é a última das quatro, o que é o que torna seguro dividir o agente revisor aqui.

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

**D2. Dependência com a fase 16, resolvida como aresta.** A leitura de linha antiga do log de aprovações
usa o leitor único definido na fase 16, sob o requisito PROVA-04. Nenhum plano desta fase implementa um
segundo leitor.

A resolução é a aresta `16 para 18` no grafo do roadmap, e não uma tolerância escrita em prosa. Dois
efeitos práticos. Primeiro, o plano 007 parte do bloco de gate que a fase 16 já religou ao leitor, e não
do bloco de hoje: partir do bloco antigo reverteria a entrega dela sem que a verificação percebesse.
Segundo, a autorização que o plano 007 tem de estender o leitor, caso ele não exponha o dado de eixo,
deixa de ser escrita em arquivo de fase concorrente e passa a ser escrita em arquivo de fase já fechada.

A parada do plano 007 na primeira tarefa continua existindo, como cinto de segurança contra execução fora
de ordem. Cinto de segurança não substitui aresta: agora há os dois.

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

**P2.1. Como o agente removido é dividido sem perder o que outras fases escreveram nele.** O arquivo do
revisor único também é editado pela fase 14, que aponta os termos dele para o glossário, e pela fase 16,
que acrescenta a instrução de confirmar ou descartar achado de tautologia. Com as duas rodando antes
desta, dividir o arquivo sem cuidado apagaria o trabalho delas em silêncio, e o caso mais caro é o da
fase 16: a instrução sumiria do produto e PROVA-08 ficaria meio entregue sem que gate nenhum percebesse.

A resolução tem três partes, todas dentro do plano 004. A ordem é declarada, pela serialização acima.
A divisão é precedida de inventário: a primeira tarefa lê o arquivo inteiro e grava, em evidência, um
bloco por linha com origem, eixo de destino e marcador textual de conferência, nomeando explicitamente os
dois blocos vindos das fases 14 e 16. E a migração é conferida por busca: cada marcador tem de aparecer
no agente de destino, e marcador que não aparece em lugar nenhum é falha de tarefa, não observação. Se um
dos dois blocos não estiver no arquivo na hora do inventário, é sinal de execução fora de ordem, e o
plano para em vez de dividir um arquivo que ainda vai receber escrita de outra fase.

O mapa do sistema entra na lista de arquivos editados do plano 004: as seções de camadas, de matriz de
escrita e de onde cada item do briefing encosta passam a dizer treze agentes junto com o resto do
produto.

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
