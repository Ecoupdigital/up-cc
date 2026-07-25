---
phase: 13-formato-de-pergunta
plan: 003
type: feature
wave: 2
depends_on: [001]
requirements: [PERG-01, PERG-02, PERG-03, PERG-04]
autonomous: true
prova: smoke
---

# Fase 13, Plano 003: Superfícies da execução (confirmação de início, gate visual e fechamento de fase)

## Objetivo

Fazer as três superfícies interativas que vivem no motor de execução pararem de emitir pergunta crua. Ao fim
deste plano, a confirmação de início, o gate visual antes do merge e o menu de fechamento de fase carregam o
contrato canônico, resolvem sozinhos o que é fato (modo de repositório, runtime atual, estratégia de merge,
estado do gate) e apresentam seus nove pontos de pergunta com identificador, recomendação e motivo.

## Onda

**Onda 2.** Depende do plano 001 (contrato e inventário). Roda em paralelo com os planos 002 e 004: toca um
único arquivo, que nenhum outro plano da fase toca.

## Contrato de comportamento dos artefatos tocados

| Artefato | Contrato de comportamento | Arquivo hoje |
|----------|---------------------------|--------------|
| Workflow de execução | Motor único de execução do projeto planejado. Hospeda três das sete superfícies interativas: confirmação de início (o dono autoriza começar ou continuar), gate visual antes do merge (nada sobe sem o dono ver na tela) e fechamento de fase (como aterrissar). Nove pontos de pergunta com texto literal | `up/workflows/build.md` |

O arquivo tem 911 linhas hoje. Todas as edições deste plano são cirúrgicas: nenhum estágio é reescrito,
nenhuma lógica de onda, gate, worktree ou merge muda. Só muda a forma como a pergunta chega ao dono.

## Contrato herdado do plano 001 (literal, não reinterpretar)

Rótulos obrigatórios de toda pergunta, nesta ordem: `Pergunta:`, `Recomendo:`, `Porque:` e, quando a lista é
fechada, `Opções:` com a recomendada em primeiro lugar. Cada ponto de pergunta com texto literal é marcado com
`<pergunta id="...">` e fechado com `</pergunta>`. A tag é o conteúdo da pergunta e **não substitui** a
chamada da ferramenta: a instrução em volta continua dizendo qual ferramenta usar. Texto completo em
`up/references/questioning.md`, bloco `<contrato_de_pergunta>`.

## Tarefas

### 1. Carregar o contrato e declarar a regra de fato no motor de execução

**Contrato:** o workflow lê o contrato antes da primeira pergunta e declara, uma vez, quais dados ele resolve
sozinho e por isso nunca pergunta.

**Arquivo hoje:** `up/workflows/build.md`, dentro do `<core_principle>`, após o bloco que descreve os dois
eixos de GitHub e interação.

**O que fazer:** acrescentar:

```markdown
**Contrato de pergunta (obrigatório):** antes da primeira pergunta, carregue
`Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`. Nenhuma pergunta
sai crua: toda pergunta leva recomendação e motivo, com a opção recomendada em primeiro lugar.

**O que este workflow resolve sozinho e NUNCA pergunta:** runtime atual (detectado pelo diretório de
configuração), modo de repositório e autonomia (resolvidos das flags e da configuração do projeto), estratégia
de merge (configuração), se a fase tem interface (tipo dos planos e scripts do manifesto), contagem de planos,
resumos, ondas e veredito do gate (leitura de arquivo), estado do worktree, da branch, da issue e do PR (mapa
git). Tudo isso é anunciado em uma linha, nunca perguntado. Perguntar qualquer um desses itens é violação do
contrato.
```

**Critério de aceite:** a chamada de leitura da referência está no arquivo; a lista do que nunca é perguntado
inclui runtime, modo de repositório, estratégia de merge, presença de interface e veredito do gate.

**Prova:** `grep -n "references/questioning.md" up/workflows/build.md` devolve linha.

### 2. Marcar os três pontos da validação e confirmação de início

**Contrato:** antes de executar, o dono confirma o início, e as duas situações de anomalia (runtime diferente
do planejado, artefato faltando) chegam com recomendação em vez de alerta cru.

**Arquivo hoje:** `up/workflows/build.md`, estágios V.2, V.5 e C.

**O que fazer:**

1. Em V.2, o comentário `# AskUserQuestion sim/nao (output direto, sem CEO)` e o `echo` de aviso viram:

```markdown
Perguntar (ferramenta de pergunta do runtime) com este conteúdo:

<pergunta id="build.runtime-divergente">
Pergunta: O plano foi feito para {INTENDED_RUNTIME} e você está em {CURRENT_RUNTIME}. Sigo assim?
Recomendo: Seguir neste runtime
Porque: o plano pronto viaja inteiro no diretório de planejamento e não depende de recurso exclusivo do runtime planejado.
Opções: Seguir neste runtime | Abortar e executar no runtime planejado
</pergunta>
```

2. Em V.5, a frase `**Falta algo:** alertar o dono (AskUserQuestion), oferecer re-planejar localmente (/up:plan) ou abortar.` vira:

```markdown
**Falta algo:** perguntar ao dono com este conteúdo:

<pergunta id="build.plano-incompleto">
Pergunta: Falta {lista dos artefatos ausentes} para executar. O que fazer?
Recomendo: Re-planejar localmente
Porque: {o que está faltando} não é recuperável na execução, e o re-planejamento local reaproveita o que já existe em vez de refazer a fase.
Opções: Re-planejar localmente | Abortar
</pergunta>
```

3. Em C, a frase `Confirmar via AskUserQuestion ("Iniciar execucao?"). Se recusar: abortar.` vira:

```markdown
Confirmar com este conteúdo (ferramenta de pergunta do runtime). Se recusar: abortar.

<pergunta id="build.iniciar-execucao">
Pergunta: Inicio a execução agora?
Recomendo: Iniciar
Porque: o plano pronto passou na validação, o modo de repositório resolvido é {GITHUB_MODE} e as pendências conhecidas não bloqueiam a primeira onda.
Opções: Iniciar | Mudar o modo antes de iniciar | Não iniciar agora
</pergunta>

Se houver pendência bloqueante em `.plano/PENDING.md`, a recomendação inverte para "Não iniciar agora" e a
linha Porque nomeia a pendência. A recomendação é calculada, não fixa.
```

**Critério de aceite:** os três blocos existem com os identificadores exatos; o bloco de início declara que a
recomendação inverte diante de pendência bloqueante; a lógica de abortar em caso de recusa continua escrita.

**Prova:** `grep -n "build.runtime-divergente\|build.plano-incompleto\|build.iniciar-execucao" up/workflows/build.md` devolve três linhas.

### 3. Marcar os dois pontos de parada do laço de execução

**Contrato:** quando uma onda inteira falha ou o limite de re-planejamento acaba, o dono decide como seguir, e
a decisão chega com recomendação e com o diagnóstico que a sustenta, não como aviso de erro.

**Arquivo hoje:** `up/workflows/build.md`, item 5 do estágio 3.3 (falha sistêmica da onda) e estágio 3.4
(limite de re-planejamento).

**O que fazer:**

1. Onde hoje se lê `Falha real e sistemica (toda a wave falhou) -> parar e alertar o dono (AskUserQuestion).`,
   colocar:

```markdown
Falha real e sistêmica (toda a onda falhou): parar e perguntar com este conteúdo:

<pergunta id="build.onda-falhou">
Pergunta: A onda {wave} falhou inteira ({WAVE_MISSING} planos sem resumo). Como sigo?
Recomendo: Re-executar a onda uma vez
Porque: {o que o gate encontrou}, e falha de todos os planos ao mesmo tempo aponta para causa de execução (ambiente, limite, interrupção), não para plano errado.
Opções: Re-executar a onda | Re-planejar a fase | Parar aqui
</pergunta>

Se a saída dos executores apontar causa de plano (contrato inexistente, dependência que o plano assumiu e não
existe), a recomendação vira "Re-planejar a fase" e a linha Porque cita o achado. A recomendação é calculada.
```

2. No bloco bash de 3.4, a linha `echo "Max re-plans atingido. Alertar o dono (AskUserQuestion)."` vira
   `echo "Max re-plans atingido. Perguntar ao dono (build.replan-esgotado)."` e, logo após o bloco bash,
   acrescentar:

```markdown
<pergunta id="build.replan-esgotado">
Pergunta: O limite de {REPLAN_COUNT} re-planejamentos locais acabou. O que fazer?
Recomendo: Parar e revisar o plano da fase com você
Porque: dois re-planejamentos automáticos já falharam no mesmo ponto, então o problema está no plano e não na execução.
Opções: Parar e revisar comigo | Forçar mais um re-planejamento | Seguir com o plano atual e registrar dívida
</pergunta>
```

**Critério de aceite:** os dois blocos existem com os identificadores exatos; o texto de onda falhou declara
que a recomendação é calculada; o contador de re-planejamentos continua sendo lido do log como hoje.

**Prova:** `grep -n "build.onda-falhou\|build.replan-esgotado" up/workflows/build.md` devolve duas linhas.

### 4. Marcar os dois pontos do gate visual antes do merge

**Contrato:** com o servidor de desenvolvimento no ar dentro do worktree, o dono decide se testa antes de
aterrissar e, depois de testar, se aprova ou pede ajuste. As duas perguntas chegam com recomendação e motivo,
e o laço de ajuste continua existindo.

**Arquivo hoje:** `up/workflows/build.md`, estágio 3.8.0, passos 2 e 3.

**O que fazer:**

1. O passo 2 (bloco com `header:`, `question:` e `options:`) vira:

```markdown
2. **Perguntar (ferramenta de pergunta do runtime):**

<pergunta id="build.testar-antes-do-merge">
Pergunta: Subi o servidor em http://localhost:{PORT} com o código desta fase. Testa antes ou já aterrisso?
Recomendo: Testar primeiro (deixo o servidor no ar)
Porque: a fase mexeu em interface e este projeto exige aprovação visual antes do merge; a verificação automática não cobre julgamento de tela.
Opções: Testar primeiro (deixo o servidor no ar) | Pode mergear | Deixa a branch | Descarta a fase
</pergunta>
```

2. O passo 3 (segundo bloco com `header:` e `question:`) vira:

```markdown
3. **Se "Testar primeiro":** MANTÉM o servidor no ar, repete a URL e ESPERA o dono testar. Quando ele voltar,
   perguntar:

<pergunta id="build.aprovou-ou-ajusta">
Pergunta: Testou. Posso fechar a fase {phase_number}?
Recomendo: Aprovado, pode mergear
Porque: a verificação automática passou e o gate registrou o veredito; o que a automação não cobre é o julgamento da tela, que é seu.
Opções: Aprovado, pode mergear | Achei problema, quero ajustar
</pergunta>
```

O texto que descreve o laço de ajuste (re-executar o executor no worktree, re-rodar verificação e gate, e
voltar para 3.8.0) permanece exatamente como está.

**Critério de aceite:** os dois blocos existem; as quatro opções do primeiro e as duas do segundo são as
mesmas de hoje, na mesma ordem, com a recomendada em primeiro lugar; o laço de ajuste continua descrito.

**Prova:** `grep -n "build.testar-antes-do-merge\|build.aprovou-ou-ajusta" up/workflows/build.md` devolve duas
linhas, e leitura do laço de ajuste intacto.

### 5. Marcar os dois pontos do fechamento de fase

**Contrato:** fase sem interface, ou fase que pulou o gate visual sem ser autônoma, ainda pergunta ao dono como
aterrissar, e a recomendação sai do estado real do repositório. Quando a revisão bloqueia a fase, o dono decide
o rumo com o motivo do bloqueio na mão.

**Arquivo hoje:** `up/workflows/build.md`, parágrafo final de 3.8.0 (fase sem interface) e processamento do
veredito em 3.7.

**O que fazer:**

1. No parágrafo `**Fase SEM UI** ... GitHub-nativo interativo ainda apresenta o mesmo AskUserQuestion de 4
   opcoes ...`, acrescentar logo depois:

```markdown
<pergunta id="build.fechamento-fase">
Pergunta: Como aterrisso a fase {phase_number}?
Recomendo: {Abrir PR e mergear, quando há remote e transporte disponível; Merge local, quando não há remote}
Porque: {o transporte resolvido: "há remote e a linha de comando do GitHub está autenticada" ou "não há remote, então o merge local é o único desfecho que fecha a fase"}, e a estratégia configurada é {merge_strategy}.
Opções: {recomendada} | {a outra forma de mergear} | Deixa a branch | Descarta a fase
</pergunta>

A recomendação é calculada a partir do mapa git e do transporte disponível, nunca fixa. O mapeamento da
escolha para a operação de fechamento (3.8.1) não muda.
```

2. No processamento do veredito de 3.7, a linha `- `BLOCK`: interromper e alertar o dono (AskUserQuestion).`
   vira:

```markdown
- `BLOCK`: interromper e perguntar com este conteúdo:

<pergunta id="build.revisor-bloqueou">
Pergunta: A revisão bloqueou a fase {phase_number}. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão no log de aprovações}, e é correção dirigida a um item, não retrabalho da fase.
Opções: Corrigir e re-revisar | Aceitar como dívida técnica e seguir | Parar aqui
</pergunta>
```

**Critério de aceite:** os dois blocos existem com os identificadores exatos; o bloco de fechamento declara que
a recomendação vem do mapa git e do transporte; o mapeamento de escolha para operação de fechamento continua
intacto.

**Prova:** `grep -n "build.fechamento-fase\|build.revisor-bloqueou" up/workflows/build.md` devolve duas linhas.

### 6. Conferência determinística e commit

**Contrato:** os nove pontos declarados no inventário para este arquivo existem, com os três rótulos
preenchidos, e nenhum ponto extra foi inventado.

**O que fazer:** rodar da raiz do repositório:

```bash
node -e "
const fs=require('fs');
const f='up/workflows/build.md';
const t=fs.readFileSync(f,'utf-8');
const ids=[...t.matchAll(/<pergunta id=\"([^\"]+)\">/g)].map(m=>m[1]);
const blocos=t.split('<pergunta id=').slice(1);
for(const b of blocos){
  const corpo=b.split('</pergunta>')[0];
  for(const r of ['Pergunta:','Recomendo:','Porque:'])
    if(!corpo.includes(r)) console.log('FALTA', r, 'no bloco', corpo.slice(0,40));
}
console.log(ids.length);
console.log(ids.sort().join('\n'));
"
```

Saída esperada: `9`, seguido dos nove identificadores, sem nenhuma linha `FALTA`:
`build.aprovou-ou-ajusta`, `build.fechamento-fase`, `build.iniciar-execucao`, `build.onda-falhou`,
`build.plano-incompleto`, `build.replan-esgotado`, `build.revisor-bloqueou`, `build.runtime-divergente`,
`build.testar-antes-do-merge`.

Conferir também que nada da mecânica quebrou, comparando o antes e o depois:

```bash
git diff --stat up/workflows/build.md
grep -c "finish-phase\|worktree\|approvals.log" up/workflows/build.md
```

O segundo comando tem que devolver o mesmo número de antes da edição (registrar os dois valores no resumo).

Commitar:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): superficies do build com recomendacao e regra de fato" --files up/workflows/build.md
```

**Critério de aceite:** saída `9` sem linha `FALTA`; contagem de mecânica idêntica antes e depois; commit
atômico de um único arquivo.

**Prova:** as duas saídas coladas no resumo do plano.

## Critérios de aceite do plano

- [ ] O workflow carrega a referência do contrato antes da primeira pergunta.
- [ ] A lista do que é resolvido sozinho e nunca perguntado está declarada e cobre runtime, modo de
      repositório, estratégia de merge, presença de interface e veredito do gate.
- [ ] Os nove pontos de pergunta declarados no inventário existem, com os três rótulos preenchidos.
- [ ] As opções de cada pergunta são as mesmas de hoje, com a recomendada em primeiro lugar.
- [ ] Quatro perguntas declaram recomendação calculada (início, onda falhou, fechamento e gate visual quando
      não há interface).
- [ ] Nenhuma mecânica de onda, gate, worktree, merge ou log de aprovações foi alterada.
- [ ] Commit atômico de um único arquivo.

## Tipo de prova exigida

**Smoke.** Prova em duas partes: (a) o comando determinístico da tarefa 6 devolvendo `9` sem falta de rótulo, e
a contagem de mecânica inalterada; (b) extração do texto literal das três superfícies para o relatório de prova
da fase, mostrando recomendação e motivo em cada pergunta. A parte (b) é consolidada pelo plano 005.

<verification>
```bash
grep -c "<pergunta id=" up/workflows/build.md                          # esperado: 9
grep -c "references/questioning.md" up/workflows/build.md              # esperado: maior que 0
grep -c "finish-phase\|worktree\|approvals.log" up/workflows/build.md  # esperado: igual ao valor medido antes da edicao
```
</verification>

## Fora de escopo

- **Mudar a mecânica de execução.** Motor de ondas, gates, evidência por tipo, worktree, issue, PR, merge,
  espelho de quadro externo e recuperação de queda ficam exatamente como estão.
- **Revisão em dois eixos e veredito por eixo.** É da fase 18. O veredito lido aqui continua único.
- **Fronteiras de teste confirmadas e nova entrada no log de aprovações.** É da fase 16.
- **Derivar a ordem de execução de aresta declarada.** É da fase 17. A onda numerada continua sendo a ordem.
- **Higiene de contexto entre execuções de plano e oferta de handoff.** É da fase 18.
- **Perguntas dos workflows de governança, de tarefa avulsa, de testes e de depuração.** Fora das sete
  superfícies declaradas nesta fase.
- **Traduzir ou podar o workflow.** As edições são cirúrgicas nos nove pontos e nos dois parágrafos novos.
