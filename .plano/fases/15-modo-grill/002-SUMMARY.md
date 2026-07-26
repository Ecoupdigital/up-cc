---
phase: 15-modo-grill
plan: "002"
subsystem: doutrina
tags: [brainstorm, grill, questionamento, skills, piso-automatico]
dependency-graph:
  requires: ["motor único do modo grill (plano 001, up/skills/up-brainstorm/grill.md)"]
  provides: ["porta do grill na skill de brainstorm (up/skills/up-brainstorm/SKILL.md)"]
  affects: ["plano 004 (prova de que o gate duro e o estado terminal continuam de pé, e de que a skill não duplicou o motor)"]
tech-stack:
  added: []
  patterns: ["padrão wrapper e núcleo: a skill cita o motor pelo nome em vez de redefinir a doutrina dele"]
key-files:
  created: []
  modified:
    - "up/skills/up-brainstorm/SKILL.md"
decisions: []
metrics:
  duration: "1 sessão"
  completed: "2026-07-26"
---

# Fase 15 Plano 002: A porta da skill Summary

A skill de brainstorm troca o piso automático de profundidade: só o tier Trivial continua em zero
pergunta, e Pequena, Média e Grande passam a entrar em modo grill (perguntas ilimitadas, uma por
vez, motor em `grill.md`, entregue pelo plano 001). A skill vira a porta, o motor continua sendo a
única fonte da doutrina do laço, das portas de saída e da destilação.

## O que foi construído

Todas as edições em `up/skills/up-brainstorm/SKILL.md` (nenhum outro arquivo tocado):

1. **Frontmatter, campo `description`**: ganhou a frase final citando os gatilhos manuais do grill
   (`--grill`, "me grelha", "vai fundo", "pergunta mais"), usando aspas simples internas para não
   quebrar o YAML da descrição que já está entre aspas duplas.
2. **Tabela de red flags**: a linha sobre decidir o tier ganhou a lembrança de que o piso automático
   é grill fora de Trivial; a linha "Já sei o que ele quer" trocou a referência ao template de
   pergunta única (agora removido) por "Pequena entra em grill: pergunte, não suponha".
3. **`## Profundidade escalada por tamanho`**: a tabela de quatro linhas virou duas (Trivial;
   Pequena, Média e Grande), com uma linha logo abaixo explicando que o que separa os três tiers
   agora é só o formato da destilação (design em três frases contra design por seção), não a
   contagem de perguntas. A frase preexistente sobre o `classify-task` definir o piso e só o dono
   rebaixar foi preservada.
   - O template `<pergunta id="brainstorm.decisao-chave">` (a pergunta única fixa de Pequena) foi
     **removido**: ele descrevia exatamente o modelo que deixou de existir (uma pergunta fixa em
     vez de grill ilimitado) e, mantido, contradiria o motor. Nenhuma outra parte do arquivo
     referenciava esse id depois da edição da tabela de red flags.
4. **`## Override de profundidade`**: a linha de subir passou a citar a flag `--grill` e as três
   palavras do plano ("me grelha", "vai fundo", "pergunta mais"), com o efeito de entrar em grill
   mesmo em tarefa Trivial porque o pedido do dono vence a classificação automática. A linha de
   descer ganhou a nota do desencontro: quando a tarefa é Média ou Grande e o dono pede para
   descer, o agente anuncia o risco em uma linha e segue, sem perguntar. A linha de "nada
   declarado" passou a dizer que o piso automático é grill fora de Trivial. Uma frase nova fecha a
   seção com a regra de empate: sinal de subir e de descer juntos, sobe, porque subir é reversível
   por uma palavra de parada.
5. **`## Checkpoint de fechamento`**: o título e o primeiro parágrafo foram reescritos para dizer
   que, em modo grill, o checkpoint aparece a cada três perguntas (porta 2 do motor, citado pelo
   nome), e que fora do grill (Trivial) ele não aparece. O controle de duas opções ("Fechar e
   seguir" / "Mais perguntas"), o template de pergunta e a regra de recomendação calculada foram
   mantidos sem alteração.
6. **Brainstorm full, passo 3**: parou de descrever cadência própria ("uma por vez", "feche a rodada
   com o checkpoint") e passou a apontar para o motor, preservando o que é específico do passo
   (foco em propósito/restrições/critério de sucesso, sinalizar decomposição em sub-projetos).
7. **Modo exploração, passo 4**: mesma troca (cadência aponta para o motor), preservando o que é
   específico da exploração ("estreitando do amplo pro específico"); os passos 1 a 3 (não pular pra
   solução, alternativas radicais, provocar com "e se") e o passo 5 (destilação em um parágrafo)
   ficaram intactos.
8. **Trilha não-código**: a frase "A diferença é o que vem depois" virou "O grill vale igual nessa
   trilha; o que muda é o que vem depois da aprovação", deixando explícito que o piso novo também
   vale para artefatos que não são código.

O gate duro (`<HARD-GATE>`) e a seção `## Estado terminal (regra dura)` não foram tocados.

## Verificação

Cada tarefa rodou seu `<verify><automated>` e todas passaram:

- Tarefa 1: `PISO_OK` (tabela de duas linhas com "Pequena, Média e Grande", cita `grill.md`,
  nenhuma combinação "pequena...1 pergunta" restante, cita `--grill` e "grelha", zero
  travessão/meia-risca).
- Tarefa 2: `COERENCIA_OK` (cita "grelha", grill aparece em pelo menos 5 linhas do arquivo, gate
  duro e estado terminal presentes, zero travessão/meia-risca).
- Tarefa 3: `PORTA_FECHADA_OK` (busca de piso antigo vazia dentro de toda a pasta da skill, sem a
  frase proibida "Posso fechar então", `git diff --stat` mostrando 22 inserções e 24 remoções
  líquido de -2 linhas, dentro do teto de 15 linhas de crescimento).

Leitura de fechamento (tarefa 3), item por item:

1. Busca `grep -Eni "pequena...1 pergunta|1 pergunta...pequena"` em toda `up/skills/up-brainstorm/`
   (não só no SKILL.md): vazia.
2. A skill não duplicou nenhuma regra do motor: a lista literal de palavras de parada, a tabela de
   frases proibidas e a tabela de destilação não aparecem em nenhum ponto de `SKILL.md` (grep
   direcionado a esses marcadores voltou vazio). A skill cita "checkpoint a cada três perguntas" e
   "grill.md" pelo nome, mas não reescreve o conteúdo.
3. Tamanho: `git diff --stat` mostra 22 inserções e 24 remoções, ou seja, o arquivo **encolheu** 2
   linhas líquidas (a remoção do template órfão de pergunta única compensou as adições de texto),
   bem dentro do teto de 15 linhas de crescimento.
4. Leitura corrida do arquivo inteiro: nenhuma contradição encontrada com o motor. Onde a doutrina
   antiga descrevia cadência própria (passo de perguntas do full e da exploração), o texto agora
   aponta para `grill.md` em vez de manter uma segunda versão.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 3 - Bloqueante] Template de pergunta única (`brainstorm.decisao-chave`) removido por
contradizer o piso novo**
- **Encontrado durante:** Tarefa 1.
- **Issue:** O plano instruía trocar a tabela de profundidade, mas o bloco
  `<pergunta id="brainstorm.decisao-chave">` logo abaixo dela existia especificamente para o modelo
  antigo de Pequena (uma única pergunta fixa). Deixado no arquivo, ele viraria conteúdo órfão que
  contradiz o motor (que declara perguntas ilimitadas para Pequena/Média/Grande), violando a regra
  de coerência da tarefa 3 ("a skill não contradiz o motor em nenhum ponto").
- **Correção:** Removido o bloco junto da troca da tabela. A única outra referência ao id
  (`decisao-chave`) estava na tabela de red flags e já fazia parte da edição pedida explicitamente
  pela tarefa 2 (linha "Já sei o que ele quer").
- **Arquivos modificados:** `up/skills/up-brainstorm/SKILL.md`.
- **Commit:** `d5992ab`.

Nenhum outro desvio. As demais edições seguiram literalmente o texto do plano.

## DECISOES ESCALADAS

Nenhuma. Nenhuma mudança arquitetural (Regra 4) foi necessária: todas as edições couberam nas
Regras 1 a 3 (correção de conteúdo órfão que contradizia a decisão já tomada pelo dono).

## Self-Check: PASSOU

- `up/skills/up-brainstorm/SKILL.md`: ENCONTRADO
- commit `d5992ab`: ENCONTRADO

## Critérios de sucesso do plano

- [x] A tabela de profundidade tem duas linhas e o piso novo
- [x] A precedência do pedido manual está na skill, com a entrada de tarefa trivial em grill e a
      regra de empate
- [x] O checkpoint aparece a cada três perguntas em modo grill, reusando o controle de duas opções
      que já existia
- [x] A skill aponta para o motor em pelo menos cinco pontos e não duplica nenhuma regra dele
- [x] O gate duro e a regra de estado terminal continuam intactos

## Para o plano 004 (prova)

- O commit `d5992ab` é o ponto de checagem para confirmar que o gate duro e o estado terminal
  continuam de pé depois da troca do piso.
- Verificar que a leitura da skill sozinha (sem abrir `grill.md`) já deixa claro que Pequena entra
  em grill: a tabela e a linha logo abaixo bastam.
- O template `brainstorm.decisao-chave` foi removido nesta wave; se alguma sonda de comportamento
  do plano 004 dependia dele, precisa ser reescrita para o vocabulário novo (grill em vez de
  pergunta única).
