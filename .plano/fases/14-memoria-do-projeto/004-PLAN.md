---
phase: 14-memoria-do-projeto
plan: 004
type: feature
autonomous: true
wave: 2
depends_on: ["001", "002"]
requirements: [MEM-02]
files_modified:
  - up/bin/lib/memoria-glossario.cjs
  - up/bin/lib/memoria-glossario.test.cjs
  - up/agents/up-arquiteto.md
  - up/agents/up-auditor.md
  - up/agents/up-depurador.md
  - up/agents/up-executor.md
  - up/agents/up-mapeador-codigo.md
  - up/agents/up-pesquisador.md
  - up/agents/up-planejador.md
  - up/agents/up-revisor.md
  - up/agents/up-roteirista.md
  - up/agents/up-sintetizador.md
  - up/agents/up-tester.md
  - up/agents/up-verificador.md
  - up/workflows/auditar.md
  - up/workflows/build.md
  - up/workflows/dcrv.md
  - up/workflows/governance.md
  - up/workflows/mapear-codigo.md
  - up/workflows/onboarding.md
  - up/workflows/pausar.md
  - up/workflows/plan.md
  - up/workflows/rapido.md
  - up/workflows/remover-fase.md
  - up/workflows/resetar.md
  - up/workflows/up.md
  - up/skills/up-tdd/SKILL.md
  - up/skills/up-verificar-antes-de-concluir/SKILL.md
must_haves:
  truths:
    - "Os doze agentes e os doze workflows apontam para o glossário interno em vez de reexplicar os termos"
    - "A contagem de redefinições remanescentes dos termos do glossário é zero, medida por operação determinística"
    - "Redação fora dos termos do glossário não foi tocada"
  artifacts:
    - path: "up/bin/lib/memoria-glossario.cjs"
      provides: "Leitor do glossário, contagem de redefinições pelas quatro formas e cobertura da citação"
    - path: "up/bin/lib/memoria-glossario.test.cjs"
      provides: "Prova vermelho e verde da contagem, com par de fixtures que redefine e que cita"
  key_links:
    - from: "up/agents e up/workflows"
      to: "up/references/glossario-up.md"
      via: "linha única de vocabulário, idêntica em todos os arquivos, com o caminho reescrito pelo instalador"
---

# Fase 14 Plano 004: Definição única e citação nas superfícies

<objective>
Fazer o glossário interno virar fonte única de verdade: cada agente e cada workflow aponta para o verbete em vez de reexplicar o conceito, e uma operação determinística conta as redefinições remanescentes, com aceite zero.
</objective>

**Onda:** 2. Depende do plano 001, que entrega o glossário e o contrato de formato, e do plano 002, que abre o roteador e declara a entrada `glossario`.

**Bloqueia:** plano 006 (a verificação final da fase roda esta contagem).

## Contexto

Sem citação, o glossário vira mais um arquivo que ninguém lê, e cada superfície continua com redação própria do mesmo conceito. Com citação e sem medida, ninguém sabe se sobrou redefinição. Este plano entrega as duas pontas: a citação e a régua.

A régua precisa ser explicável, porque falso positivo em cima de prosa legítima faria o aceite zero virar teatro. Por isso as formas contadas são estruturais e fechadas, e estão declaradas no próprio glossário pelo plano 001.

@up/references/glossario-up.md - fonte dos termos e das formas, entregue pelo plano 001
@up/bin/lib/memoria.cjs - roteador e helpers, entregues pelo plano 002
@up/agents/up-executor.md - exemplo de agente, com frontmatter no topo
@up/workflows/build.md - exemplo de workflow, que abre com bloco de propósito e não tem frontmatter

## Contrato da linha de citação

Linha única, idêntica em todos os arquivos, escrita como citação de bloco:

```
> Vocabulário UP: fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.
```

O caminho usa o prefixo de home de propósito, porque o instalador o reescreve para o diretório de configuração de cada runtime. Não usar o prefixo de arroba antes do caminho, para não forçar carga do arquivo em toda invocação.

Posição: em agente e em skill, logo depois do fechamento do frontmatter, com linha em branco antes e depois. Em workflow, logo depois do fechamento do bloco de propósito, com linha em branco antes e depois.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/memoria-glossario.cjs (novo)</files>
<contrato>Submódulo do espaço `memoria`, exportando `run(cwd, args)` e as funções internas usadas pelo teste. Leitura pura: nunca escreve arquivo nem cria diretório.</contrato>
<action>
Implementar o leitor do glossário e a varredura.

Função `caminhoGlossario()`: resolve o glossário dentro do próprio pacote, subindo do diretório do módulo até a raiz do pacote e entrando no diretório de references. Aceita substituição por flag, para o teste apontar para uma fixture.

Função `lerTermos(caminho)`: lê a seção de termos e devolve, por verbete, o termo canônico (cabeçalho de nível 3), a lista de formas (linha em negrito de formas, separada por vírgula) e a lista de sinônimos proibidos (linha em negrito de evitar). Verbete sem as três linhas faz a função lançar exceção citando o termo incompleto, porque glossário quebrado invalida a medida.

Função `arquivosVarridos(raiz)`: lista os arquivos de markdown dos diretórios de agentes, workflows, skills, comandos, references e templates, a partir da raiz do pacote, excluindo o próprio glossário. Aceita substituição da raiz por flag, para o teste apontar para uma árvore de fixtures.

Função `linhasUteis(conteudo)`: devolve as linhas com o número da linha, marcando as que estão dentro de bloco de código cercado por crase tripla, para que a contagem as ignore.
</action>
<aceite>Com o glossário real, `lerTermos` devolve nove verbetes, cada um com formas e sinônimos não vazios. Com uma fixture de verbete sem a linha de formas, a função lança exceção citando o termo. A varredura da raiz real devolve a lista de arquivos de markdown das seis pastas, sem o glossário.</aceite>
<prova>lógica: teste da tarefa 4, casos de glossário válido, glossário incompleto e listagem de arquivos.</prova>
</task>

<task id="2" type="auto">
<files>up/bin/lib/memoria-glossario.cjs</files>
<contrato>Ação `check`. Conta redefinição concorrente pelas quatro formas estruturais declaradas no glossário, com os três cortes. Nada além dessas formas é contado, porque poda de redação é passe separado.</contrato>
<action>
Implementar a contagem.

Forma 1: linha que casa rótulo em negrito com o termo (ou uma das formas dele) seguido de dois pontos, e prosa depois.
Forma 2: item de lista cujo rótulo é o termo (ou uma das formas) seguido de dois pontos, e prosa depois.
Forma 3: linha de tabela cuja primeira célula, sem negrito e sem espaço nas pontas, é exatamente o termo (ou uma das formas), quando a linha não é o cabeçalho da tabela. Cabeçalho é a linha imediatamente anterior a uma linha de separador de tabela.
Forma 4: cabeçalho markdown cujo texto é exatamente o termo (ou uma das formas), ou exatamente a pergunta sobre o que é o termo. Para esta forma, a prosa avaliada é o primeiro parágrafo abaixo do cabeçalho.

Os três cortes, aplicados a todas as formas. Corte de tamanho: só conta quando a prosa avaliada tem oito palavras ou mais, o que separa definição de rótulo de campo. Corte de bloco de código: linha dentro de bloco cercado nunca conta. Corte de citação: linha que contém o nome do arquivo de glossário nunca conta, porque já está apontando em vez de redefinir.

Retorno: quantidade de termos, quantidade de arquivos varridos, lista de achados (caminho relativo, número da linha, termo, forma, trecho cortado em cento e vinte caracteres), total e o booleano de aprovação, verdadeiro quando o total é zero.

Flag `--estrito`: com ela, total maior que zero lança exceção listando os achados, o que dá código de saída 1. Sem ela, o comando apenas relata e sai com código zero.

Flag `--pastas`: lista separada por vírgula das pastas a varrer, com padrão nas seis. Serve para medir um recorte sem misturar arquivo de outro dono, e é usada pela tarefa 7.
</action>
<aceite>Contra uma fixture com uma linha em cada uma das quatro formas, o total é 4 e cada achado nomeia a forma. Contra a mesma fixture com o nome do glossário na linha, o total é 0. Rótulo de campo com prosa de menos de oito palavras não conta. Linha dentro de bloco de código não conta.</aceite>
<prova>lógica, vermelho e verde: teste da tarefa 4, com par de fixtures, um que redefine e um que cita.</prova>
</task>

<task id="3" type="auto">
<files>up/bin/lib/memoria-glossario.cjs</files>
<contrato>Ação `citacao`. Mede a cobertura da citação, que é a outra metade de fonte única: sem citação, a régua de redefinição passa por vazio.</contrato>
<action>
Implementar a ação de cobertura.

Varre os arquivos de markdown dos diretórios de agentes e de workflows e devolve, para cada um, se a linha de citação está presente, detectada pela ocorrência do nome do arquivo de glossário. Devolve também as duas contagens (com citação e sem citação), a lista dos que faltam e o booleano de aprovação, verdadeiro quando nenhum falta.

Flag `--estrito`: com ela, arquivo faltando lança exceção listando os arquivos.
</action>
<aceite>Antes do passe das tarefas 5 e 6, a ação lista vinte e quatro arquivos sem citação. Depois do passe, lista zero e aprova. A ação não considera comandos nem templates, porque o alvo declarado são agentes e workflows.</aceite>
<prova>smoke: rodar a ação antes e depois do passe e colar as duas saídas no resumo do plano.</prova>
</task>

<task id="4" type="auto">
<files>up/bin/lib/memoria-glossario.test.cjs (novo)</files>
<contrato>Teste no mesmo padrão dos planos 002 e 003. Usa uma árvore de fixtures montada em diretório temporário, com um glossário de fixture e arquivos de superfície de fixture, nunca o repositório real.</contrato>
<action>
Escrever os casos, vistos falhar antes da implementação e passar depois.

Casos de leitura do glossário: nove verbetes lidos da fixture completa; exceção na fixture com verbete incompleto.

Casos das quatro formas: um arquivo de fixture por forma, cada um produzindo exatamente um achado com a forma correta.

Casos dos três cortes: rótulo de campo com prosa curta não conta; linha dentro de bloco de código não conta; linha que cita o glossário não conta, e este é o par bom do teste.

Caso de modo estrito: com achado, código de saída diferente de zero; sem achado, código zero.

Casos de cobertura de citação: árvore de fixture com um agente citando e um sem citar devolve um faltando; com os dois citando, aprova.

Caso de linha de comando: uma execução real do binário de ferramentas contra a árvore de fixtures, conferindo o código de saída nos dois modos.
</action>
<aceite>`node up/bin/lib/memoria-glossario.test.cjs` imprime a contagem final e sai com código zero. Antes das tarefas 1 a 3, o mesmo comando sai com código diferente de zero, e essa falha é registrada no resumo do plano.</aceite>
<prova>lógica, vermelho e verde: saída do teste falhando antes e passando depois, colada no resumo.</prova>
</task>

<task id="5" type="auto">
<files>os doze arquivos de `up/agents/`</files>
<contrato>Cada agente ganha a linha de citação, idêntica, na posição declarada no contrato acima. Nenhuma linha existente é reescrita, nenhum bloco é removido, e o frontmatter não é tocado.</contrato>
<action>
Inserir a linha de citação nos doze agentes, logo depois do fechamento do frontmatter, com linha em branco antes e depois.

Depois da inserção, rodar a contagem de redefinição sobre a pasta de agentes e tratar o que aparecer, se aparecer: quando um agente tiver uma das quatro formas definindo um termo do glossário, substituir aquele bloco pela citação, preservando o detalhe operacional que estiver ao redor. Detalhe de procedimento não é definição e fica onde está.

O diff de cada agente deve ser, no caso comum, uma única linha acrescentada.
</action>
<aceite>Os doze agentes contêm exatamente uma ocorrência do nome do arquivo de glossário. A contagem de redefinição sobre a pasta de agentes devolve zero. O diff mostra uma linha acrescentada por arquivo, salvo nos arquivos onde uma redefinição precisou ser convertida, e nesses o resumo do plano explica a conversão.</aceite>
<prova>smoke: `grep -L "glossario-up.md" up/agents/*.md` devolve vazio, e a ação de contagem devolve zero para a pasta de agentes.</prova>
</task>

<task id="6" type="auto">
<files>os doze arquivos de `up/workflows/`, mais `up/skills/up-tdd/SKILL.md` e `up/skills/up-verificar-antes-de-concluir/SKILL.md`</files>
<contrato>Mesma linha de citação, na posição declarada: nos workflows, depois do bloco de propósito; nas duas skills, depois do frontmatter. A skill de brainstorm e a skill de bootstrap não são tocadas aqui, porque pertencem aos planos 005 e 001.</contrato>
<action>
Inserir a linha de citação nos doze workflows e nas duas skills indicadas, na posição do contrato.

Depois da inserção, rodar a contagem de redefinição sobre essas pastas e converter o que aparecer, com a mesma regra da tarefa 5: definição vira citação, procedimento fica.

Atenção ao workflow de execução, que é o maior do sistema e concentra o vocabulário de fase, onda, gate, evidência e worktree. É o candidato mais provável a ter uma forma contada, e é onde a conversão precisa ser mais cuidadosa para não apagar procedimento.
</action>
<aceite>Os doze workflows e as duas skills contêm exatamente uma ocorrência do nome do arquivo de glossário. A contagem de redefinição sobre essas pastas devolve zero.</aceite>
<prova>smoke: `grep -L "glossario-up.md" up/workflows/*.md` devolve vazio, e a ação de contagem devolve zero para as pastas de workflows e skills.</prova>
</task>

<task id="7" type="auto">
<files>nenhum arquivo alterado (tarefa de prova)</files>
<contrato>Medida final das duas réguas sobre o repositório inteiro, no modo estrito.</contrato>
<action>
Rodar a contagem de redefinição no modo estrito sobre as pastas que este plano pode tocar (agentes, workflows, references, comandos e templates) e conferir o código de saída zero. Rodar a cobertura de citação no modo estrito e conferir o código de saída zero.

Rodar a contagem no modo relatório sobre a pasta de skills. Achado em skill de outro dono (a de brainstorm, do plano 005, e a de bootstrap, do plano 001) não é convertido aqui, para não haver duas escritas no mesmo arquivo na mesma onda: é registrado no resumo com caminho, linha e forma, e a conversão fica para a verificação final da fase, no plano 006. Achado nas duas skills que este plano possui é convertido aqui mesmo.

Colar as três saídas no resumo do plano.
</action>
<aceite>As duas ações devolvem aprovação no modo estrito nas pastas deste plano, com total de redefinições igual a zero e nenhum arquivo de agente ou workflow sem citação. O relatório sobre a pasta de skills está no resumo, com zero achado ou com o achado nomeado e encaminhado ao plano 006.</aceite>
<prova>smoke: saída das duas execuções em modo estrito, com o código de saída, colada no resumo.</prova>
</task>

## Critérios de Sucesso

- [ ] Os doze agentes e os doze workflows citam o glossário, com a linha idêntica em todos
- [ ] A contagem de redefinições dos termos do glossário é zero no modo estrito
- [ ] A régua conta apenas as quatro formas estruturais declaradas, com os três cortes numerados
- [ ] O par de fixtures (um que redefine, um que cita) foi visto falhar antes de passar
- [ ] Redação fora dos termos do glossário permaneceu intocada, e cada conversão feita está explicada no resumo

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Contar ou proibir sinônimo banido nas superfícies. A régua deste plano é redefinição, não vocabulário. Contagem de sinônimo produziria ruído em prosa legítima e é passe separado.
- Podar instrução morta, negação ou sedimento nos workflows. Esse passe tem briefing próprio e não é este.
- Tocar a skill de brainstorm (plano 005), a skill de bootstrap (plano 001) ou os sete comandos.
- Editar o roteador de memória, o módulo de decisão ou o módulo de rejeições. São dos planos 002 e 003.
- Acrescentar ou remover termo do glossário. O conteúdo do glossário é do plano 001.
- Ligar a contagem ao gate de aprovação de fase. Aqui ela é comando e prova; quem decide gate é outro ciclo.
