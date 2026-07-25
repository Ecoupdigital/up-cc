---
phase: 13-formato-de-pergunta
plan: 002
type: feature
wave: 2
depends_on: [001]
requirements: [PERG-01, PERG-02, PERG-03, PERG-04]
autonomous: true
prova: smoke
files_modified:
  - up/workflows/up.md
  - up/skills/up-brainstorm/SKILL.md
  - up/skills/usando-up/SKILL.md
  - up/commands/up.md
must_haves:
  truths:
    - "O roteamento da porta única e o brainstorm carregam o contrato antes da primeira pergunta"
    - "Os seis pontos de pergunta dessas duas superfícies chegam com recomendação e motivo"
    - "Em repositório com planejamento populado, o intake não pergunta o que os artefatos já respondem"
    - "A recomendação do checkpoint de fechamento é calculada, e não fixa"
  artifacts:
    - path: "up/workflows/up.md"
      provides: "Quatro pontos de pergunta marcados e o passo de resolução prévia"
    - path: "up/skills/up-brainstorm/SKILL.md"
      provides: "Dois pontos de pergunta marcados e a declaração das duas regras do contrato"
    - path: "up/skills/usando-up/SKILL.md"
      provides: "Anúncio da regra em uma linha no bootstrap de sessão"
  key_links:
    - from: "up/workflows/up.md"
      to: "up/references/questioning.md"
      via: "chamada de leitura da referência antes da primeira pergunta"
    - from: "up/skills/up-brainstorm/SKILL.md"
      to: "up/references/questioning.md"
      via: "chamada de leitura no início da rodada de perguntas"
---

# Fase 13, Plano 002: Superfícies de entrada (roteamento da porta única e brainstorm)

<objective>
Fazer as duas superfícies por onde o dono entra no UP pararem de emitir pergunta crua. Ao fim deste plano, o
roteamento da porta única e a skill de brainstorm carregam o contrato canônico antes de perguntar, rodam o
protocolo de resolução prévia (fato descobrível não vira pergunta) e trazem seus seis pontos de pergunta
marcados com identificador, recomendação e motivo.
</objective>


## Onda

**Onda 2.** Depende do plano 001 (o contrato e o inventário precisam existir). Roda em paralelo com os planos
003 e 004: os arquivos tocados são disjuntos.

## Contrato de comportamento dos artefatos tocados

| Artefato | Contrato de comportamento | Arquivo hoje |
|----------|---------------------------|--------------|
| Workflow do roteamento da porta única | Superfície que decide para onde o dono vai quando chega sem argumento ou com uma ideia crua. Toda pergunta que ela emite passa pelo contrato. Quatro pontos de pergunta com texto literal | `up/workflows/up.md` |
| Skill de brainstorm | Superfície de exploração de intenção, requisitos e design, com profundidade escalada por tamanho. Dois pontos de pergunta com texto literal | `up/skills/up-brainstorm/SKILL.md` |
| Skill de bootstrap de sessão | Bloco injetado no início de toda sessão. Precisa anunciar a regra em uma linha, senão a doutrina só chega quando alguma outra skill carrega | `up/skills/usando-up/SKILL.md` |
| Comando da porta única | Documento que descreve a profundidade do brainstorm ao usuário. Precisa parar de descrever pergunta sem recomendação | `up/commands/up.md` |

## Contrato herdado do plano 001 (literal, não reinterpretar)

Rótulos obrigatórios de toda pergunta, nesta ordem: `Pergunta:`, `Recomendo:`, `Porque:` e, quando a lista é
fechada, `Opções:` com a recomendada em primeiro lugar. Cada ponto de pergunta com texto literal é marcado
com `<pergunta id="...">` e fechado com `</pergunta>`. O texto completo do contrato está em
`up/references/questioning.md`, bloco `<contrato_de_pergunta>`.

## Tarefas

<task id="1" type="auto">
<files>up/workflows/up.md</files>
<contrato>
Antes da primeira pergunta de qualquer rota, o workflow lê o contrato e varre as fontes onde a
resposta pode já estar. O que for descoberto vira anúncio de uma linha, não pergunta.

Arquivo hoje: `up/workflows/up.md`, no `<core_principle>` (após a linha que fala da profundidade do
brainstorm) e no Passo 2.3.
</contrato>
<action>
**Carregar o contrato e rodar o protocolo antes de perguntar no roteamento da porta única**

1. Acrescentar ao `<core_principle>` o parágrafo:

```markdown
**Contrato de pergunta (obrigatório):** antes da primeira pergunta de qualquer rota, carregue
`Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`. Nenhuma
pergunta sai crua: toda pergunta leva recomendação e motivo. Fato descobrível não vira pergunta.
```

2. Criar o passo `### 2.3.0 Protocolo de resolução prévia`, imediatamente antes de `### 2.3 Classificar a
   tarefa`, com o conteúdo:

```markdown
Antes de qualquer pergunta do intake, resolva o que der para resolver sozinho, nesta ordem, parando na
primeira fonte que responde: perfil do dono; estado, requisitos, roadmap, projeto e briefing do planejamento;
mapa do codebase quando houver; leitura e busca direta no código; histórico do repositório; configuração e
manifesto de dependências.

O que for resolvido vira anúncio de uma linha ("vi em X que Y, sigo com Y"), nunca pergunta. Só sobe como
pergunta o que sobrou: escolha com mais de uma resposta defensável, e segredo que só o dono tem. Segredo é
pedido depois de esbarrar na parede que o exige, nunca por precaução.

Em repositório com planejamento populado, isso normalmente zera o bloco de perguntas sobre stack, convenção,
estrutura de pastas e histórico. Perguntar isso ali é violação do contrato.
```
</action>
<verify><automated>grep -q "references/questioning.md" up/workflows/up.md && grep -q "2.3.0" up/workflows/up.md</automated></verify>
<done>
O workflow contém a chamada de leitura da referência; o passo 2.3.0 existe com as seis
fontes; o texto proíbe explicitamente perguntar o que o planejamento já responde.

Prova registrada no resumo: `grep -n "references/questioning.md" up/workflows/up.md` devolve linha, e leitura do passo 2.3.0.
</done>
</task>

<task id="2" type="auto">
<files>up/workflows/up.md</files>
<contrato>
Cada um dos quatro pontos onde o roteamento tem texto literal de pergunta passa a sair no
formato do contrato, com identificador estável.

Arquivo hoje: `up/workflows/up.md`, Passo 1 (apresentação da próxima ação), Passo 2.3 (tier pequena),
Passo 4.1 (intake do clone) e Passo 6 (configurar).
</contrato>
<action>
**Marcar os quatro pontos de pergunta do roteamento da porta única**

Substituir cada trecho pelos blocos abaixo, mantendo o restante do passo intacto.

1. No Passo 1, o bloco que hoje começa com `## Proximo` e lista os comandos vira:

```markdown
<pergunta id="up.proxima-acao">
Pergunta: Qual o próximo passo agora?
Recomendo: {acao_primaria}
Porque: {a contagem que produziu a rota, por exemplo "faltam 2 planos sem resumo na fase 5" ou "a fase 5 não tem plano nenhum"}
Opções: {acao_primaria} | {acao_alternativa} | Parar por aqui
</pergunta>
```

A tabela de roteamento que já existe continua sendo quem calcula `{acao_primaria}`. A linha Porque **cita a
contagem**, não o nome da regra. O atalho de retomada rápida (quando o dono disse literalmente "continuar" ou
"vai") continua pulando a apresentação: não perguntar é permitido, perguntar cru não é.

2. No Passo 2.3, no item `standard (pequena)`, o texto vira:

```markdown
- **standard (pequena):** UMA pergunta, a decisão-chave, no formato do contrato:

<pergunta id="up.decisao-chave">
Pergunta: {a decisão de design que muda o resultado desta tarefa}
Recomendo: {a opção que o agente escolheria}
Porque: {a evidência: convenção encontrada no codebase, decisão já registrada no estado, ou o trade-off que decide}
Opções: {recomendada} | {alternativa} | {alternativa}
</pergunta>

  Depois, descrever a abordagem em 3 frases. Para UI, oferecer o companion visual.
```

3. No Passo 4.1, a frase que hoje manda perguntar credenciais, stack e mudanças vira:

```markdown
Extrair do $ARGUMENTS: URL (obrigatório) e modo (`--exact` default | `--improve` | `--inspiration`).

A stack é decisão e sobe como pergunta:

<pergunta id="up.clone-intake">
Pergunta: Com que stack eu recrio este app?
Recomendo: {stack declarada no perfil do dono}
Porque: é a stack que o perfil do dono declara, e nada no app original obriga outra.
Opções: {stack do perfil} | a mesma stack detectada no app original | outra (descreva)
</pergunta>

Credenciais NÃO são perguntadas de saída: tente o crawl primeiro. Só peça login se o crawl esbarrar numa
parede de autenticação, e então peça só o que a parede exige. Credencial de banco do clone só é pedida quando
a stack escolhida exige banco.
```

4. No Passo 6, a linha `configurar` da tabela ganha o bloco abaixo logo após a tabela:

```markdown
<pergunta id="up.config-editar">
Pergunta: Qual configuração você quer mudar?
Recomendo: manter como está
Porque: os valores atuais vieram do perfil do dono e nenhuma execução falhou por causa deles.
Opções: manter como está | modo | granularidade | paralelização
</pergunta>
```
</action>
<verify><automated>test "$(grep -c '<pergunta id=' up/workflows/up.md)" = "4"</automated></verify>
<done>
O arquivo contém exatamente quatro tags `<pergunta id=` com os identificadores
`up.proxima-acao`, `up.decisao-chave`, `up.clone-intake` e `up.config-editar`; cada bloco tem as linhas
`Pergunta:`, `Recomendo:` e `Porque:` preenchidas; nenhuma delas contém `TBD`, `TODO` ou reticências soltas.

Prova registrada no resumo: `grep -c "<pergunta id=" up/workflows/up.md` devolve 4.
</done>
</task>

<task id="3" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<contrato>
A skill que mais pergunta no sistema carrega o contrato uma vez, no início da rodada, e declara
em texto curto que fato descobrível não vira pergunta. Ela não reescreve o protocolo: aponta para ele.

Arquivo hoje: `up/skills/up-brainstorm/SKILL.md`, nova seção logo após o bloco `<HARD-GATE>` e o parágrafo
de anti-padrão.
</contrato>
<action>
**Carregar o contrato e declarar a regra na skill de brainstorm**

Inserir a seção:

```markdown
## Antes de perguntar (contrato de pergunta)

Carregue `Read $HOME/.claude/up/references/questioning.md` antes da primeira pergunta da rodada e aplique o
bloco `<contrato_de_pergunta>`. Duas regras valem em toda pergunta desta skill, inclusive nas rodadas do
brainstorm full e do modo exploração, que não têm texto literal aqui:

1. **Nenhuma pergunta crua.** Toda pergunta sai com `Pergunta:`, `Recomendo:` e `Porque:`, uma por vez, com a
   opção recomendada em primeiro lugar quando a lista é fechada.
2. **Fato contra decisão.** Antes de perguntar, resolva sozinho pelas seis fontes do protocolo (perfil do
   dono, artefatos de planejamento, mapa do codebase, leitura e busca no código, histórico do repositório,
   configuração e manifesto). O que for descoberto vira anúncio de uma linha. Só sobe escolha com mais de uma
   resposta defensável, ou segredo que só o dono tem.

A pergunta de trilha ("isso é para virar código ou é um documento?") é fato na maioria das vezes: o pedido, a
extensão dos arquivos citados e o estado do projeto já respondem. Só pergunte se as três fontes forem mudas.
```
</action>
<verify><automated>grep -q "references/questioning.md" up/skills/up-brainstorm/SKILL.md && test "$(wc -l < up/skills/up-brainstorm/SKILL.md)" -lt 160</automated></verify>
<done>
A seção existe; contém a chamada de leitura da referência; as duas regras estão
numeradas; a skill continua com menos de 160 linhas (hoje tem 110).

Prova registrada no resumo: `grep -n "references/questioning.md" up/skills/up-brainstorm/SKILL.md` e `wc -l` menor que 160.
</done>
</task>

<task id="4" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<contrato>
Os dois lugares da skill com texto literal de pergunta passam ao formato do contrato. No
checkpoint de fechamento, a recomendação é **computada**, não fixa: ela depende de existir ou não pergunta
capaz de mudar o design.

Arquivo hoje: `up/skills/up-brainstorm/SKILL.md`, tabela de profundidade (linha do tier Pequena) e seção
`## Checkpoint de fechamento`.
</contrato>
<action>
**Marcar os dois pontos de pergunta do brainstorm**

1. Na tabela de profundidade, a célula do tier Pequena passa a dizer `1 pergunta no formato do contrato (ver
   brainstorm.decisao-chave abaixo) + checkpoint de fechamento + design em 3 frases. Aprova e segue.` e logo
   após a tabela entra o bloco:

```markdown
<pergunta id="brainstorm.decisao-chave">
Pergunta: {a única decisão de design que muda o resultado desta tarefa}
Recomendo: {a opção que você escolheria}
Porque: {a evidência: convenção do codebase, decisão já registrada, ou o trade-off que decide}
Opções: {recomendada} | {alternativa} | {alternativa}
</pergunta>
```

2. Na seção do checkpoint de fechamento, substituir a descrição das duas opções pelo bloco:

```markdown
<pergunta id="brainstorm.checkpoint">
Pergunta: Fecho a rodada e sigo, ou faço mais perguntas?
Recomendo: {Fechar e seguir | Mais perguntas}
Porque: {quando fecha: "as decisões que mudam o design já foram respondidas, o que resta é detalhe que o plano resolve". Quando abre: nomear a pergunta em aberto que ainda pode mudar o design}
Opções: {recomendada primeiro} | {a outra}
</pergunta>

A recomendação deste checkpoint é **calculada**, nunca fixa: se ainda existe pergunta capaz de mudar o
design, a recomendação é "Mais perguntas" e a linha Porque nomeia qual é a pergunta. Se não existe,
a recomendação é "Fechar e seguir". Não adicione opção de resposta livre: a saída livre nativa já cobre.
```
</action>
<verify><automated>test "$(grep -c '<pergunta id=' up/skills/up-brainstorm/SKILL.md)" = "2"</automated></verify>
<done>
O arquivo contém exatamente duas tags `<pergunta id=`, com `brainstorm.decisao-chave`
e `brainstorm.checkpoint`; o texto declara que a recomendação do checkpoint é calculada; as duas opções
originais (fechar e seguir, mais perguntas) continuam existindo.

Prova registrada no resumo: `grep -c "<pergunta id=" up/skills/up-brainstorm/SKILL.md` devolve 2.
</done>
</task>

<task id="5" type="auto">
<files>up/skills/usando-up/SKILL.md, up/commands/up.md</files>
<contrato>
O bloco injetado no início de toda sessão anuncia a regra em uma linha, e a documentação do
comando para de descrever pergunta sem recomendação. Sem isso, o produto se contradiz na primeira tela.

**Arquivos hoje:** `up/skills/usando-up/SKILL.md` e `up/commands/up.md`.
</contrato>
<action>
**Coerência no bootstrap de sessão e no texto do comando da porta única**

1. Em `up/skills/usando-up/SKILL.md`, acrescentar **uma única linha**, logo após o parágrafo que começa com
   `**Passo ZERO de todo trabalho:**`:

```markdown
**Toda pergunta com recomendação:** nenhuma pergunta sua ao dono sai crua. Ela leva a resposta recomendada e o motivo, para ele confirmar ou corrigir. Fato que você consegue descobrir (lendo arquivo, buscando no código, olhando o histórico, o estado ou os requisitos) você descobre, não pergunta. Escolha de arquitetura ou trade-off nunca é sua: sobe ao dono com recomendação.
```

2. Em `up/commands/up.md`, na lista que descreve a profundidade do brainstorm, trocar a linha do tier Pequena
   por: `- Pequena (1 subsistema, 1 escolha de design): **1 pergunta** com recomendação e motivo + design em 3 frases.` e a linha do tier Média/Grande por: `- Media/Grande (multi-subsistema, schema/API/auth): **brainstorm full** com aprovacao por secao, toda pergunta com recomendacao e motivo.`
</action>
<verify><automated>grep -qi "recomenda" up/skills/usando-up/SKILL.md && grep -qi "recomenda" up/commands/up.md</automated></verify>
<done>
A linha do bootstrap existe e é uma só; as duas linhas do comando mencionam
recomendação; nenhum outro trecho desses dois arquivos foi alterado.

Prova registrada no resumo: `git diff --stat` mostrando poucas linhas nesses dois arquivos, e `grep -n "recomendação" up/skills/usando-up/SKILL.md`.
</done>
</task>

<task id="6" type="auto">
<files>up/workflows/up.md, up/commands/up.md, up/skills/up-brainstorm/SKILL.md, up/skills/usando-up/SKILL.md</files>
<contrato>
Os seis pontos declarados no inventário para estas superfícies existem, e nenhum ponto extra foi
inventado.
</contrato>
<action>
**Conferência determinística e commit**

Rodar da raiz do repositório:

```bash
node -e "
const fs=require('fs');
const alvos=['up/workflows/up.md','up/skills/up-brainstorm/SKILL.md'];
let achados=[];
for(const f of alvos){
  const t=fs.readFileSync(f,'utf-8');
  const ids=[...t.matchAll(/<pergunta id=\"([^\"]+)\">/g)].map(m=>m[1]);
  achados.push(...ids);
  const blocos=t.split('<pergunta id=').slice(1);
  for(const b of blocos){
    const corpo=b.split('</pergunta>')[0];
    for(const r of ['Pergunta:','Recomendo:','Porque:']){
      if(!corpo.includes(r)) console.log('FALTA', r, 'em', f);
    }
  }
}
console.log(achados.sort().join(','));
"
```

Saída esperada, sem nenhuma linha `FALTA`:
`brainstorm.checkpoint,brainstorm.decisao-chave,up.clone-intake,up.config-editar,up.decisao-chave,up.proxima-acao`

Depois commitar em dois commits atômicos:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): roteamento da porta unica com recomendacao e regra de fato" --files up/workflows/up.md up/commands/up.md
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(pergunta): brainstorm com recomendacao e regra de fato" --files up/skills/up-brainstorm/SKILL.md up/skills/usando-up/SKILL.md
```
</action>
<verify><automated>node -e "const fs=require('fs');let f=0;for(const a of ['up/workflows/up.md','up/skills/up-brainstorm/SKILL.md']){const t=fs.readFileSync(a,'utf-8');for(const b of t.split('<pergunta id=').slice(1)){const c=b.split('</pergunta>')[0];for(const r of ['Pergunta:','Recomendo:','Porque:'])if(!c.includes(r)){console.log('FALTA',r,a);f++}}}process.exit(f?1:0)"</automated></verify>
<done>
A saída bate exatamente com a lista acima; nenhuma linha `FALTA`; dois commits.

Prova registrada no resumo: saída do comando colada no resumo do plano.
</done>
</task>

## Critérios de aceite do plano

- [ ] As duas superfícies carregam a referência do contrato antes de perguntar.
- [ ] O passo de resolução prévia existe no roteamento, com as seis fontes e a proibição de perguntar fato.
- [ ] A skill de brainstorm declara as duas regras e aponta para o contrato sem reescrever o protocolo.
- [ ] Os seis pontos de pergunta declarados no inventário existem com os três rótulos preenchidos.
- [ ] A recomendação do checkpoint de fechamento está escrita como calculada, não fixa.
- [ ] O bootstrap de sessão anuncia a regra em uma linha.
- [ ] Commits atômicos por superfície.

## Tipo de prova exigida

**Smoke.** Prova em duas partes: (a) o comando determinístico da tarefa 6 devolvendo os seis identificadores
sem falta de rótulo; (b) uma rodada narrada de brainstorm sobre uma tarefa pequena neste repositório, mostrando
que cada pergunta emitida traz recomendação e motivo, e que nada perguntado já estava no estado, nos requisitos
ou no mapa do codebase. A parte (b) é coletada pelo plano 005, que consolida a prova da fase.

<verification>
```bash
grep -c "<pergunta id=" up/workflows/up.md                            # esperado: 4
grep -c "<pergunta id=" up/skills/up-brainstorm/SKILL.md              # esperado: 2
grep -c "references/questioning.md" up/workflows/up.md                # esperado: maior que 0
grep -c "references/questioning.md" up/skills/up-brainstorm/SKILL.md  # esperado: maior que 0
grep -c "recomenda" up/skills/usando-up/SKILL.md                      # esperado: maior que 0
```
</verification>

## Fora de escopo

- **Modo grill, perguntas ilimitadas, palavra de parada e auto-convergência.** São da fase 15. Este plano não
  muda a tabela de profundidade por tier nem o número de perguntas de cada tier.
- **Gravar glossário ou registro de decisão durante a conversa.** São artefatos da fase 14 e não existem.
- **Traduzir, podar ou reorganizar a skill de brainstorm.** Só as duas seções descritas mudam.
- **Superfícies fora do inventário:** tarefa avulsa, testes, depuração, reset e onboarding continuam como
  estão. O contrato as alcança em passe separado, porque a fronteira desta fase são as sete superfícies
  declaradas.
- **Mudar o instalador ou os quatro runtimes.** A referência já viaja junto com o pacote; nada a fazer.
- **Criar aresta de dependência entre planos em formato novo.** É da fase 17.
