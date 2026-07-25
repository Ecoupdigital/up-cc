---
phase: 13-formato-de-pergunta
plano: 006-REWORK
tipo: rework
origem: 13-VERIFICATION.md (gaps_found, 7/9 requisitos provados)
commits:
  - 43f0d29 fix(13-formato-de-pergunta): fecha o ponto cego do verificador de perguntas
  - b4dcf06 fix(13-formato-de-pergunta): estende o contrato de pergunta a execucao
---

# Fase 13, Rework 006: fecha os dois gaps atribuíveis à fase

Rodada de correção sobre `13-VERIFICATION.md`. O laudo achou dois gaps que pertencem à fase (a escalação de
decisão arquitetural não cobria o caminho de execução, e o verificador do contrato tinha um ponto cego
reproduzível) e um terceiro que não pertence à fase (REG-01, bug pré-existente em `up/workflows/up.md` e
`up/workflows/auditar.md`, fora deste rework por instrução explícita).

## Gap 1: PERG-05 não estava inteiro (execução ficava de fora)

### O que o laudo provou

Escolha de arquitetura subia ao dono como pergunta com recomendação quando nascia no planejamento (arquiteto
e planejador carregavam o contrato e devolviam `## DECISOES ESCALADAS`), mas não quando nascia na execução:
`up/agents/up-executor.md` não carregava `questioning.md`, não tinha bloco de escalação, e `up/workflows/build.md`
não tinha estágio que recolhesse decisão escalada. Pior, a linha 316 do executor mandava, em modo builder,
"Decidir autonomamente ... NAO parar, NAO perguntar" para mudança arquitetural — o inverso literal do
requisito, ainda que hoje inalcançável (nada injeta `<builder_mode>` no prompt do executor).

### O que foi feito

**`up/agents/up-executor.md`**
- Carrega `Read $HOME/.claude/up/references/questioning.md` e aplica o bloco `<contrato_de_pergunta>` (seção
  3, Escalação de subagente) antes de agir na Regra 4.
- A Regra 4 deixa de ter dois comportamentos (modo normal para e retorna checkpoint livre; modo builder
  decide sozinho e silencia). Passa a ter um só, nos dois modos: aplica a própria recomendação como hipótese
  provisória, continua a tarefa sem parar o build, e devolve o bloco `## DECISOES ESCALADAS` (Decisão,
  Recomendo, Porque, Alternativas) no retorno estruturado e no `SUMMARY.md` do plano, marcando o resultado
  como provisório. A linha que contradizia PERG-05 por escrito não existe mais.
- `PRIORIDADE DE REGRAS` atualizada: "Regra 4 aplica → PARE" virou "Regra 4 aplica → ESCALAR", porque parar
  o build inteiro sem produzir `SUMMARY.md` quebraria o GATE A sem nenhum mecanismo de retomada — a forma que
  o contrato já prescreve para subagentes (seção 3: aplicar a recomendação como hipótese, seguir trabalhando,
  levar a decisão ao dono antes do fechamento) é a que resolve isso sem inventar uma segunda máquina de pausa.
- `<summary_creation>` ganhou o "Bloco de escalação (sempre presente no SUMMARY, mesmo vazio)", espelhando o
  que `up-planejador.md` já faz: `Nenhuma.` quando não há nada a escalar, bloco ausente é proibido.
- `<success_criteria>` ganhou o item de que toda decisão da Regra 4 foi escalada, nunca decidida ou silenciada.

**`up/workflows/build.md`** (edição por âncora, sem reescrever o arquivo)
- Novo **Estágio 3.3.5 (DECISOES ESCALADAS - execução)**, inserido entre o fim consolidado do loop de waves
  (GATE A) e o Estágio 3.4 (re-plan local). Espelha o Estágio E de `plan.md`: recolhe a seção
  `## DECISOES ESCALADAS` de todos os `*-SUMMARY.md` da fase, descarta as linhas `Nenhuma.`, ordena o que
  sobrou por custo de reverter, pergunta uma por vez no formato do contrato
  (`<pergunta id="build.decisoes-escaladas">`), registra a resposta via `state add-decision`, e re-executa
  apenas o plano cujo trabalho dependia da decisão em caso de divergência.
- `<success_criteria>` ganhou o item correspondente.

**`up/references/questioning.md`**
- Novo ponto no inventário fechado: `build.decisoes-escaladas`, superfície "Confirmação de início" (mesma
  superfície de `build.iniciar-execucao` e afins — a definição da superfície já cobre "as paradas do laço de
  execução"). Inventário sobe de 20 para 21 pontos.

### Prova (rodada por mim, depois da mudança)

```
$ grep -c "questioning.md\|DECISOES ESCALADAS\|contrato_de_pergunta" up/agents/up-executor.md
5
$ grep -c "DECISOES ESCALADAS\|escalad" up/workflows/build.md
9
$ for f in up/agents/*.md; do grep -q questioning.md "$f" && echo "$f"; done
up/agents/up-arquiteto.md
up/agents/up-executor.md
up/agents/up-planejador.md
(3 de 12 agentes, era 2)
$ grep -n "NAO parar, NAO perguntar" up/agents/up-executor.md
(vazio — a linha nao existe mais)
```

Wiring adversarial (o mesmo teste que `13-VERIFICATION.md` já tinha usado para o caminho de planejamento,
repetido aqui para o caminho de execução):

```
=== controle: fixture intacta deve passar ===
ok=true pontos=21 erros=0

=== defeito: trocar a linha que carrega o contrato em build.md ===
ok=false erros=[{"tipo":"contrato_nao_carregado","id":null,"arquivo":"up/workflows/build.md"}]
```

Instalação real (glue:smoke), redirecionando `CLAUDE_CONFIG_DIR` para diretório temporário:

```
INSTALL_EXIT=0
✓ Instalado up/ (100 files), 7 commands, 12 agents, 4 skills, 7 command-skills
$ verificar('<config_dir>/claude')
instalado: ok=true pontos=21 erros=[]
$ grep -c "questioning.md\|DECISOES ESCALADAS" <config_dir>/claude/agents/up-executor.md
5
```

O contrato estendido sobrevive à instalação verificável nos quatro runtimes (a mesma mudança de arquivo vale
para os quatro, já que a conversão do instalador não filtra conteúdo de prosa dos agentes).

### O que ficou fora

A infraestrutura de pausa/retomada mid-wave para checkpoints explícitos (`type="checkpoint:*"` dentro de um
`PLAN.md`, ou o `checkpoint:decision` genérico de 9% do protocolo de checkpoint) **não foi tocada**. Isso é
um mecanismo diferente da Regra 4 (é uma tarefa marcada de propósito como parada no próprio plano, não uma
decisão descoberta ad hoc durante a execução) e já tinha o próprio design antes deste rework; redesenhar como
`build.md` retoma um plano pausado no meio de uma wave é fora do escopo dos dois gaps pedidos e teria exigido
reescrever, não editar por âncora, o arquivo mais disputado do ciclo. Registrado aqui para não voltar como
"esquecido": é decisão consciente de escopo, não lacuna descoberta agora.

### Honestidade de registro (REQUIREMENTS.md)

`PERG-05` já estava marcado `[x]` em `.plano/REQUIREMENTS.md` antes deste rework (marcação que
`13-VERIFICATION.md` considerou otimista, porque só o caminho de planejamento estava provado). Com o gap 1
fechado e provado acima — contrato carregado no executor, bloco de escalação no SUMMARY, estágio no build.md
que recolhe e pergunta, contradição da linha 316 removida — a marcação `[x]` passa a ser verdadeira. Como o
arquivo já estava marcado corretamente no estado final, nenhuma edição em `.plano/REQUIREMENTS.md` foi
necessária; a tabela de rastreabilidade (`PERG-01 a PERG-06 | Fase 13 | Completo`) também já refletia isso.
Não haveria honestidade em desmarcar e remarcar sem motivo: o critério do briefing ("se você fechar, marque")
foi seguido pelo estado final, não por um passe cosmético no arquivo.

## Gap 2: ponto cego no verificador (`up/bin/lib/perguntas.test.cjs`)

### O que o laudo provou

`arquivosDistintos` (a lista de arquivos de superfície a varrer) era derivada do próprio inventário. Apagar
do inventário todas as linhas de uma superfície fazia aquela superfície nunca ser lida — as tags dela ficavam
invisíveis para as duas direções de comparação. `pontos` era reportado, nunca comparado com o total esperado.

### O que foi feito

- **Lista fechada e explícita** (`ARQUIVOS_SUPERFICIE`), não mais derivada do inventário: os cinco arquivos
  de superfície (`up.md`, `plan.md`, `build.md`, `auditar.md`, `SKILL.md` do brainstorm) são sempre lidos e
  sempre entram nas duas direções de comparação, mesmo que o inventário perca a última linha que apontava
  para um deles. Linha de inventário apontando para arquivo fora dessa lista vira erro novo
  (`arquivo_fora_da_lista_fechada`), forçando atualização deliberada da lista em vez de silêncio.
- **Piso comparado, não só reportado**: `PONTOS_MINIMOS` (21, acompanhando o inventário real depois do gap 1)
  e `SUPERFICIES_MINIMAS` (7, a contagem de nomes de superfície distintos na coluna do inventário) agora
  geram erro (`pontos_abaixo_do_piso`, `superficies_abaixo_do_piso`) quando o total cai abaixo do esperado.
- **Quarto defeito no autoteste vermelho embutido**: apaga do inventário, na fixture, as linhas inteiras da
  superfície Auditoria (mantendo as tags intactas no arquivo copiado) — reproduz exatamente o cenário do
  laudo. A asserção não se contenta com o tipo de erro bater por coincidência com outro defeito: confirma que
  os IDs específicos da superfície removida (`auditar.relatorio-existente`, `auditar.converter-em-fases`)
  aparecem como `tag_sem_declaracao`.
- `construirFixtureComDefeitos` passou a copiar a partir da lista fechada também (não mais do inventário),
  para a fixture continuar existindo mesmo quando o defeito injetado é justamente "sumir do inventário".

### Prova: vermelho antes da correção (reproduzido por mim, fixture isolada, código sem a correção)

```
=== controle: fixture intacta ===
{"ok":true,"pontos":20}
=== apagando do inventario as 2 linhas da superficie Auditoria (superficie inteira) ===
{"ok":true,"erros":[],"pontos":18}
tags <pergunta id="auditar...> ainda presentes no arquivo da fixture: 2
```

Ponto cego confirmado de novo, com evidência fresca minha (mesmo resultado que `13-VERIFICATION.md` já tinha
achado): `ok=true` com tags órfãs invisíveis.

### Prova: mesmo cenário, depois da correção

```
{"ok":false,"pontos":18,"erros":[
  {"tipo":"tag_sem_declaracao","id":"auditar.relatorio-existente","arquivo":"up/workflows/auditar.md"},
  {"tipo":"tag_sem_declaracao","id":"auditar.converter-em-fases","arquivo":"up/workflows/auditar.md"},
  {"tipo":"pontos_abaixo_do_piso","esperado":20,"encontrado":18},
  {"tipo":"superficies_abaixo_do_piso","esperado":7,"encontrado":6}
]}
```

### Prova: verde, autoteste completo do arquivo já corrigido, contra o repositório real (depois do gap 1 também fechado)

```
$ node up/bin/lib/perguntas.test.cjs
vermelho: 7 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio,
  pontos_abaixo_do_piso, superficies_abaixo_do_piso
perguntas: vermelho OK (4 defeitos detectados), verde OK (21 pontos verificados)
EXIT_CODE=0
```

### O que ficou fora

A lista `ARQUIVOS_SUPERFICIE` é hardcoded, não descoberta por varredura de diretório (`up/workflows/*.md` +
`up/skills/*/SKILL.md` etc). O laudo sugeriu "varredura das superfícies por descoberta de arquivo" como
alternativa; optei pela lista fechada explícita porque é o que o texto do briefing pede literalmente ("a
lista fechada de superfícies passa a ser explícita") e porque descoberta por glob traria de volta um
problema simétrico (arquivo novo com pergunta crua que ninguém decidiu incluir no contrato passaria a ser
verificado por engano, ou o inverso, dependendo do filtro). Lista fechada com erro dedicado
(`arquivo_fora_da_lista_fechada`) quando o inventário aponta para fora dela força a atualização consciente
da lista quando uma fase futura (14 a 20) adicionar uma superfície nova de verdade.

## Regressão zero (REG-01, REG-02, REG-03) — não tocado, como instruído

REG-01 continua **fora deste rework**. `up/workflows/up.md` e `up/workflows/auditar.md` continuam chamando
`init up` e `init auditar`, que o despachante de `up/bin/up-tools.cjs` não reconhece — bug pré-existente,
não introduzido por esta fase nem por este rework, e nenhum dos dois arquivos foi editado por mim de um jeito
que toque essas linhas:

```
$ node up/bin/up-tools.cjs init up
Error: Unknown init workflow: up
$ node up/bin/up-tools.cjs init auditar
Error: Unknown init workflow: auditar
```

REG-02 (instalação nos quatro runtimes) e REG-03 (compatibilidade com planejamento legado) não foram
verificados de novo em profundidade neste rework porque os dois gaps que eu fechei não tocam nenhum dos dois
caminhos; a prova de instalação que rodei acima (glue:smoke) já confirma que a instalação do Claude Code
continua funcionando com as mudanças.

## Travessões

Zero introduzidos pelas mudanças deste rework:

```
$ git diff 43f0d29^..HEAD -- . ':(exclude).plano' | grep '^+' | grep -c $'—'   -> 0
$ git diff 43f0d29^..HEAD -- . ':(exclude).plano' | grep '^+' | grep -c $'–'   -> 0
```

## Veredito deste rework

Os dois gaps atribuíveis à fase (PERG-05 incompleto no caminho de execução, e o ponto cego do verificador)
estão fechados e provados com evidência fresca, produzida nesta rodada. O terceiro achado do laudo (REG-01)
não é desta fase e continua registrado como dívida pré-existente, sem tentativa de correção fora de escopo.

| Gap | Status | Commit |
|-----|--------|--------|
| Gap 1 — PERG-05 incompleto (execução sem escalação) | **Fechado, provado** | `b4dcf06` |
| Gap 2 — ponto cego do verificador de perguntas | **Fechado, provado** | `43f0d29` |
| Gap 3 — REG-01 (pré-existente, `init up`/`init auditar`) | **Não é desta fase; não tocado** | — |
