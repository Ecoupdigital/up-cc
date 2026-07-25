---
phase: 13-formato-de-pergunta
plan: 004
type: feature
wave: 2
depends_on: [001]
requirements: [PERG-01, PERG-02, PERG-03, PERG-05, PERG-06]
autonomous: true
prova: smoke
---

# Fase 13, Plano 004: Planejamento, agentes de arquitetura e planejamento, e auditoria

## Objetivo

Fechar as duas superfícies interativas restantes (planejamento e auditoria) e estender a regra aos dois agentes
que hoje decidem arquitetura sozinhos. Ao fim deste plano: o workflow de planejamento carrega o contrato,
apresenta ao dono as decisões que os agentes escalaram e traz seus três pontos de pergunta no formato; os
agentes de arquitetura e de planejamento param de resolver trade-off em silêncio e devolvem bloco de escalação;
a auditoria apresenta suas duas perguntas com recomendação calculada.

Este é o plano que cumpre PERG-05 (decisão de arquitetura nunca é do agente) e PERG-06 (a regra vale também
para os agentes, não só para a skill de brainstorm).

## Onda

**Onda 2.** Depende do plano 001 (contrato, bloco de escalação e inventário). Roda em paralelo com os planos
002 e 003: os arquivos tocados são disjuntos.

## Contrato de comportamento dos artefatos tocados

| Artefato | Contrato de comportamento | Arquivo hoje |
|----------|---------------------------|--------------|
| Workflow de planejamento | Superfície que conduz arquitetura, planejamento das fases e revisão do planejamento. Três pontos de pergunta com texto literal, um deles novo: a apresentação das decisões escaladas pelos agentes | `up/workflows/plan.md` |
| Agente de arquitetura | Subagente que deriva projeto, requisitos, roadmap e desenho do sistema a partir do briefing. Não fala com o dono: escala decisão pelo retorno estruturado | `up/agents/up-arquiteto.md` |
| Agente de planejamento | Subagente que decompõe fase em planos. Não fala com o dono no modo projeto: escala decisão pelo retorno estruturado | `up/agents/up-planejador.md` |
| Workflow de auditoria | Superfície de auditoria de produto. Dois pontos de pergunta com texto literal | `up/workflows/auditar.md` |

## Contrato herdado do plano 001 (literal, não reinterpretar)

Rótulos obrigatórios: `Pergunta:`, `Recomendo:`, `Porque:` e, quando a lista é fechada, `Opções:` com a
recomendada em primeiro lugar. Ponto de pergunta com texto literal é marcado com `<pergunta id="...">` e
fechado com `</pergunta>`. Bloco de escalação de subagente, literal:

```markdown
## DECISOES ESCALADAS

- Decisao: o que precisa ser escolhido, em uma frase
  Recomendo: a opção recomendada
  Porque: motivo em até duas frases, nomeando a evidência
  Alternativas: opção B | opção C
```

Máximo de 3 por retorno. Sem nada a escalar, o bloco sai com a única linha `Nenhuma.`. O subagente segue o
trabalho aplicando a própria recomendação e marca que aquilo é provisório.

## Tarefas

### 1. Contrato, protocolo e dois pontos de pergunta no workflow de planejamento

**Contrato:** o planejamento carrega o contrato antes de perguntar, resolve sozinho o que os artefatos já
respondem, e as duas perguntas que ele já tinha passam ao formato.

**Arquivo hoje:** `up/workflows/plan.md`, `<core_principle>`, Estágio 1 (intake mínimo) e Estágio P
(processamento do veredito).

**O que fazer:**

1. Acrescentar ao `<core_principle>`:

```markdown
**Contrato de pergunta (obrigatório):** antes da primeira pergunta, carregue
`Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`. Nenhuma pergunta
sai crua. **O que este workflow resolve sozinho e nunca pergunta:** modo projeto ou fase (vem do argumento),
modo greenfield ou brownfield (detecção de arquivos), stack e convenções (mapa do codebase ou manifesto),
runtime de planejamento (diretório de configuração), requisitos e fases já registrados (leitura dos
artefatos). Fato descoberto vira anúncio de uma linha.
```

2. No Estágio 1, a frase que manda perguntar o essencial quando não há briefing vira:

```markdown
**Se BRIEFING.md NÃO existe** (plan chamado direto): antes de perguntar qualquer coisa, rode o protocolo de
resolução prévia sobre projeto, requisitos, roadmap, estado, mapa do codebase e manifesto. Só o que sobrar
vira pergunta, uma por vez:

<pergunta id="plan.intake-minimo">
Pergunta: {o único dado que falta para planejar}
Recomendo: {o valor inferido dos artefatos existentes, ou o padrão do perfil do dono}
Porque: {o arquivo, a decisão registrada ou o padrão que sustenta o valor}
Opções: {recomendado} | outro (descreva)
</pergunta>

Se o protocolo resolveu tudo, não pergunte nada: anuncie em uma linha o que foi lido e siga direto para o
Estágio 2.
```

3. No Estágio P, a linha `- `BLOCK`: alertar o dono (AskUserQuestion).` vira:

```markdown
- `BLOCK`: perguntar com este conteúdo:

<pergunta id="plan.revisor-bloqueou">
Pergunta: A revisão do planejamento bloqueou. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão}, e é correção dirigida a um item do planejamento, não replanejamento inteiro.
Opções: Corrigir e re-revisar | Aceitar como dívida e seguir para o plano pronto | Parar o planejamento
</pergunta>
```

**Critério de aceite:** a chamada de leitura da referência está no arquivo; os dois blocos existem com os
identificadores exatos; o Estágio 1 declara que pergunta zero é resultado válido do protocolo.

**Prova:** `grep -n "references/questioning.md\|plan.intake-minimo\|plan.revisor-bloqueou" up/workflows/plan.md`
devolve três linhas.

### 2. Passo novo de decisões escaladas no workflow de planejamento

**Contrato:** as decisões que os subagentes escalaram chegam ao dono como pergunta com recomendação, uma por
vez, antes do plano pronto ser gerado. Confirmar a recomendação não gera retrabalho; divergir gera
re-execução dirigida só do agente afetado. Sem escalação nenhuma, o passo não pergunta nada e apenas declara
isso.

**Arquivo hoje:** `up/workflows/plan.md`, passo novo `## Estagio E: DECISOES ESCALADAS`, entre o Estágio 2.5
(planejamento exaustivo) e o Estágio P (revisão do planejamento).

**O que fazer:** criar o estágio com este conteúdo:

```markdown
## Estagio E: DECISOES ESCALADAS

Os subagentes não falam com o dono. Quando esbarram numa decisão de arquitetura ou num trade-off, eles seguem
aplicando a própria recomendação e devolvem o bloco `## DECISOES ESCALADAS` no retorno. Aqui esse bloco vira
pergunta.

1. Recolher os blocos `## DECISOES ESCALADAS` de todos os retornos desta rodada (arquiteto e planejadores).
2. Descartar as linhas `Nenhuma.`. Se sobrou zero decisão, declarar em uma linha
   ("Nenhuma decisão foi escalada nesta rodada") e seguir para o Estágio P sem perguntar nada.
3. Ordenar as decisões restantes por custo de reverter, da maior para a menor.
4. Perguntar uma por vez, no formato do contrato:

<pergunta id="plan.decisoes-escaladas">
Pergunta: {Decisao do bloco escalado}. Confirma a recomendação ou corrige?
Recomendo: {Recomendo do bloco escalado}
Porque: {Porque do bloco escalado}
Opções: {Recomendo} | {cada item de Alternativas} | outro (descreva)
</pergunta>

5. Registrar cada resposta em `.plano/BRIEFING.md`, na seção `## Decisões confirmadas no planejamento`
   (criar a seção se não existir), com uma linha por decisão: a escolha, quem escolheu (dono) e a data.
6. Resposta que **confirma** a recomendação: nada é refeito, porque o agente já trabalhou sob ela.
   Resposta que **diverge**: re-executar apenas o agente cujo trabalho dependia daquela decisão, passando a
   escolha do dono como decisão travada, e só depois seguir para o Estágio P.

Este estágio roda no MODO PROJETO e no MODO FASE. No MODO FASE, os blocos vêm apenas dos planejadores.
```

**Critério de aceite:** o estágio existe entre 2.5 e P; tem os seis passos; declara o caso de zero escalação
sem pergunta; declara a regra de retrabalho dirigido; a seção de registro no briefing está nomeada.

**Prova:** `grep -n "Estagio E: DECISOES ESCALADAS" up/workflows/plan.md` devolve linha, e leitura dos seis
passos.

### 3. Agente de arquitetura: separar inferência de decisão e escalar o que é decisão

**Contrato:** o agente continua inferindo o que é fato e o que é padrão reversível, e para de resolver sozinho
escolha de arquitetura e trade-off. O que ele decidiria sozinho e é caro de reverter sobe no bloco de
escalação, com recomendação e motivo.

**Arquivo hoje:** `up/agents/up-arquiteto.md`, bloco `<decision_hierarchy>`, Passo 4 do `<execution_flow>` e
bloco `<output_format>`.

**O que fazer:**

1. Em `<decision_hierarchy>`, logo após a lista de prioridades, inserir:

```markdown
### O que você infere e o que você escala

Carregue `Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`.

**Você infere e registra** (não escala): fato descobrível no briefing, no codebase, no histórico ou no
manifesto; padrão de domínio de baixo custo de reverter (nome de campo, formato de listagem, ordem de menu);
qualquer coisa que o perfil do dono ou a seção "Não usar" já resolve.

**Você escala, nunca decide sozinho:** escolha de arquitetura (framework, ORM, formato de autenticação,
fronteira entre módulos, forma de persistência), trade-off com dois lados defensáveis, corte de escopo, e
qualquer decisão cujo custo de reverter depois de implementada seja médio ou alto.

Escalar não trava você: aplique a sua recomendação para seguir o trabalho, marque no PROJECT.md que aquela
decisão está pendente de confirmação, e devolva o bloco de escalação. O workflow leva a pergunta ao dono.
```

2. No Passo 4 (`Tomar Decisoes`), depois do item 5 (`Nenhum? -> inferir + registrar`), acrescentar:

```markdown
6. É escolha de arquitetura, trade-off ou corte de escopo? Então NÃO é inferência: aplique a sua recomendação
   provisoriamente, marque como pendente de confirmação e devolva no bloco `## DECISOES ESCALADAS`.
```

3. Em `<output_format>`, acrescentar ao final do formato de retorno o bloco literal de escalação (o mesmo do
   plano 001), com a regra de máximo 3 e a linha `Nenhuma.` quando não há nada a escalar.

4. Em `<success_criteria>`, acrescentar duas linhas:
   `- [ ] Bloco DECISOES ESCALADAS presente no retorno (com "Nenhuma." quando não há nada a escalar)`
   `- [ ] Nenhuma escolha de arquitetura ou trade-off foi resolvida sem escalação`

**Critério de aceite:** as duas listas (infere e escala) existem com os exemplos acima; o item 6 do Passo 4
existe; o bloco de escalação está no formato de retorno; os dois critérios de sucesso novos existem.

**Prova:** `grep -n "DECISOES ESCALADAS" up/agents/up-arquiteto.md` devolve pelo menos duas linhas.

### 4. Agente de planejamento: protocolo antes de perguntar e escalação no retorno

**Contrato:** o planejador resolve por leitura o que é fato antes de perguntar ou de assumir, escala a escolha
que muda o desenho em vez de decidir, e quando pergunta (modo fase) usa o formato do contrato.

**Arquivo hoje:** `up/agents/up-planejador.md`, bloco `<context_fidelity>`, bloco `<execution_flow>` (Passo 4)
e bloco `<structured_returns>`.

**O que fazer:**

1. No fim de `<context_fidelity>`, acrescentar:

```markdown
## Contrato de pergunta

Carregue `Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`.

**Antes de perguntar ou de assumir qualquer coisa**, resolva pelas seis fontes do protocolo: decisões travadas
(perfil do dono, estado, contexto da fase), artefatos de planejamento, mapa do codebase, leitura e busca no
código, histórico do repositório, configuração e manifesto. Fato descoberto entra na tarefa como fato, com a
fonte citada, e nunca vira pergunta.

**Escolha que muda o desenho** (quebrar a fase de outro jeito, trocar a fronteira entre planos, mudar contrato
público, adiar requisito) não é sua: aplique a sua recomendação para seguir, marque no plano que está pendente
de confirmação, e devolva no bloco `## DECISOES ESCALADAS`.

No MODO FASE, quando você tiver permissão de coletar contexto, toda pergunta sua sai com `Pergunta:`,
`Recomendo:` e `Porque:`, uma por vez.
```

2. No Passo 4 do `<execution_flow>` (`Decompor em Tarefas`), acrescentar a linha:
   `- Toda escolha que muda o desenho vai para o bloco de escalação, com recomendação e motivo, em vez de ser resolvida em silêncio.`

3. Em `<structured_returns>`, acrescentar ao formato de retorno o bloco literal de escalação (o mesmo do plano
   001), com máximo 3 e a linha `Nenhuma.`.

4. Em `<success_criteria>`, acrescentar duas linhas:
   `- [ ] Bloco DECISOES ESCALADAS presente no retorno (com "Nenhuma." quando não há nada a escalar)`
   `- [ ] Nenhum fato descobrível virou pergunta, e nenhuma escolha de desenho foi resolvida sem escalação`

**Critério de aceite:** a seção de contrato existe no agente; o bloco de escalação está no retorno
estruturado; os dois critérios novos existem; nada da mecânica de decomposição em tarefas, ondas ou
must-haves foi alterado.

**Prova:** `grep -n "DECISOES ESCALADAS" up/agents/up-planejador.md` devolve pelo menos duas linhas.

### 5. Superfície de auditoria: contrato e dois pontos de pergunta com recomendação calculada

**Contrato:** as duas perguntas da auditoria chegam com recomendação derivada de dado, não de preferência: a
de sobrescrever o relatório sai da distância em commits desde o relatório anterior, e a de converter achados
em fases sai do sumário opinativo que o relatório já produz.

**Arquivo hoje:** `up/workflows/auditar.md`, Passo 2 e Passo 7.

**O que fazer:**

1. No `<core_principle>`, acrescentar:

```markdown
**Contrato de pergunta (obrigatório):** carregue `Read $HOME/.claude/up/references/questioning.md` e aplique o
bloco `<contrato_de_pergunta>`. **O que este workflow resolve sozinho e nunca pergunta:** stack detectada,
existência e data do relatório anterior, quantos commits houve desde ele, quais achados estão em cada
quadrante e qual é o sumário opinativo. Tudo isso é lido ou calculado, nunca perguntado.
```

2. No Passo 2, a frase sobre relatório já existente vira:

```markdown
Se `.plano/auditar/RELATORIO.md` já existe, calcule primeiro há quantos commits ele ficou para trás:

```bash
COMMITS_DESDE=$(git rev-list --count --since="$(git log -1 --format=%cI -- .plano/auditar/RELATORIO.md)" HEAD 2>/dev/null || echo 0)
```

E então pergunte:

<pergunta id="auditar.relatorio-existente">
Pergunta: Já existe relatório de auditoria de {data do relatório}. Sobrescrevo?
Recomendo: {Sobrescrever quando COMMITS_DESDE for maior que zero; Manter o anterior e cancelar quando for zero}
Porque: {"o repositório teve {COMMITS_DESDE} commits desde aquela auditoria, então o relatório antigo já não descreve o código atual" ou "nenhum commit entrou desde aquela auditoria, então rodar de novo gasta e devolve o mesmo"}
Opções: {recomendada} | {a outra}
</pergunta>
```

3. No Passo 7, a frase que manda perguntar sobre conversão vira:

```markdown
<pergunta id="auditar.converter-em-fases">
Pergunta: Converto os achados aprovados em fases do roadmap?
Recomendo: {Converter os N do quadrante de ganho rápido}
Porque: {o sumário opinativo do relatório aponta esses como maior impacto por menor esforço}.
Opções: Converter os {N} do ganho rápido | Escolher item a item | Não converter agora
</pergunta>

A seleção item a item, quando escolhida, continua como está. O quadrante "evitar" e as anti-features nunca
entram na recomendação.
```

**Critério de aceite:** os dois blocos existem com os identificadores exatos; a recomendação de sobrescrever é
calculada a partir da contagem de commits; a lista do que nunca é perguntado está declarada.

**Prova:** `grep -n "auditar.relatorio-existente\|auditar.converter-em-fases" up/workflows/auditar.md` devolve
duas linhas.

### 6. Conferência determinística e commits

**Contrato:** os cinco pontos declarados no inventário para estes arquivos existem, os dois agentes carregam o
bloco de escalação, e nenhum ponto extra foi inventado.

**O que fazer:** rodar da raiz do repositório:

```bash
node -e "
const fs=require('fs');
const alvos=['up/workflows/plan.md','up/workflows/auditar.md'];
let achados=[];
for(const f of alvos){
  const t=fs.readFileSync(f,'utf-8');
  achados.push(...[...t.matchAll(/<pergunta id=\"([^\"]+)\">/g)].map(m=>m[1]));
  for(const b of t.split('<pergunta id=').slice(1)){
    const corpo=b.split('</pergunta>')[0];
    for(const r of ['Pergunta:','Recomendo:','Porque:'])
      if(!corpo.includes(r)) console.log('FALTA', r, 'em', f);
  }
}
console.log(achados.sort().join(','));
for(const a of ['up/agents/up-arquiteto.md','up/agents/up-planejador.md']){
  const t=fs.readFileSync(a,'utf-8');
  console.log(a, t.includes('DECISOES ESCALADAS') ? 'ok' : 'FALTA ESCALACAO',
              t.includes('references/questioning.md') ? 'ok' : 'FALTA CONTRATO');
}
"
```

Saída esperada, sem nenhuma linha `FALTA`:
`auditar.converter-em-fases,auditar.relatorio-existente,plan.decisoes-escaladas,plan.intake-minimo,plan.revisor-bloqueou`
e as duas linhas de agente com `ok ok`.

Commitar em três commits atômicos:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): planejamento com recomendacao e estagio de decisoes escaladas" --files up/workflows/plan.md
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): arquiteto e planejador escalam decisao em vez de decidir" --files up/agents/up-arquiteto.md up/agents/up-planejador.md
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): auditoria com recomendacao calculada" --files up/workflows/auditar.md
```

**Critério de aceite:** saída idêntica à esperada; três commits atômicos.

**Prova:** saída do comando colada no resumo do plano.

## Critérios de aceite do plano

- [ ] O workflow de planejamento e o de auditoria carregam a referência do contrato.
- [ ] Os cinco pontos de pergunta declarados no inventário existem, com os três rótulos preenchidos.
- [ ] O estágio de decisões escaladas existe, com o caso de zero escalação e a regra de retrabalho dirigido.
- [ ] O agente de arquitetura separa por escrito o que ele infere do que ele escala, e escala arquitetura,
      trade-off e corte de escopo.
- [ ] O agente de planejamento roda o protocolo antes de assumir e escala escolha que muda o desenho.
- [ ] Os dois agentes devolvem o bloco de escalação, inclusive quando não há nada a escalar.
- [ ] As duas perguntas da auditoria têm recomendação calculada a partir de dado, não de preferência.
- [ ] Commits atômicos por superfície.

## Tipo de prova exigida

**Smoke.** Prova em duas partes: (a) o comando determinístico da tarefa 6, sem falta de rótulo e com os dois
agentes marcados `ok ok`; (b) uma passagem narrada mostrando uma escolha de arquitetura subindo como pergunta
com recomendação em vez de ser decidida pelo agente. A parte (b) é consolidada pelo plano 005.

<verification>
```bash
grep -c "<pergunta id=" up/workflows/plan.md                   # esperado: 3
grep -c "<pergunta id=" up/workflows/auditar.md                # esperado: 2
grep -c "Estagio E: DECISOES ESCALADAS" up/workflows/plan.md   # esperado: 1
grep -c "DECISOES ESCALADAS" up/agents/up-arquiteto.md         # esperado: maior que 0
grep -c "DECISOES ESCALADAS" up/agents/up-planejador.md        # esperado: maior que 0
```
</verification>

## Fora de escopo

- **Criar arquivo de registro de decisão, glossário ou base de rejeições.** São artefatos da fase 14. A
  escalação desta fase é em banda, no retorno do subagente, e não cria arquivo nenhum. Nada aqui pode assumir
  que `.plano/decisoes/` existe.
- **Editar o agente de auditoria.** A superfície de auditoria é atendida no workflow, que já dispõe do sumário
  opinativo do sintetizador para montar a recomendação. A fase 19 reescreve a saída do auditor (cards, badge
  de força, teste falsificador, gate duro de handoff), e tocá-lo agora criaria conflito com aquele passe.
- **Gate duro entre diagnosticar e projetar na auditoria.** É da fase 19.
- **Registrar a decisão escalada em arquivo versionado.** Fica só no briefing, como linha de decisão
  confirmada. O registro numerado com alternativas rejeitadas é da fase 14.
- **Tamanho de plano medido em janela de contexto e aresta de dependência declarada.** São da fase 17.
- **Mudar a hierarquia de decisão em modo brownfield.** A ordem que dá precedência ao codebase existente fica
  como está: ela já é aplicação da regra de fato.
- **Mudar o pipeline de agentes do planejamento.** Nenhum agente novo, nenhum agente removido, nenhuma troca
  de ordem de spawn.
