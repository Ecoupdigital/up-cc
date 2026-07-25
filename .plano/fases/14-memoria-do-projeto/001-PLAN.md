---
phase: 14-memoria-do-projeto
plan: 001
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [MEM-01]
files_modified:
  - up/references/glossario-up.md
  - up/bin/install.js
  - up/skills/usando-up/SKILL.md
must_haves:
  truths:
    - "Existe um glossário interno do UP com os nove termos do próprio sistema, cada verbete com definição, formas reconhecidas e sinônimos proibidos"
    - "O verbete de onda já nasce escrito como visão derivada da dependência declarada, e não como ordem primária de execução"
    - "O glossário chega aos quatro runtimes suportados quando o pacote é instalado"
  artifacts:
    - path: "up/references/glossario-up.md"
      provides: "Fonte única de definição dos termos do UP, em formato parseável por ferramenta"
  key_links:
    - from: "up/bin/install.js"
      to: "up/references/glossario-up.md"
      via: "bloco de bootstrap injetado em GEMINI.md e AGENTS.md aponta para o caminho do glossário"
    - from: "up/skills/usando-up/SKILL.md"
      to: "up/references/glossario-up.md"
      via: "linha de vocabulário no bootstrap de sessão do Claude Code"
---

# Fase 14 Plano 001: Glossário interno do UP

<objective>
Criar a fonte única de vocabulário do próprio sistema UP: um glossário com os nove termos do sistema, cada um com definição curta, lista de formas reconhecidas e lista de sinônimos proibidos, em formato que ferramenta consegue ler. Garantir que ele chegue aos quatro runtimes suportados, porque sem distribuição ele não é fonte única.
</objective>

**Onda:** 1. Não depende de nenhum outro plano desta fase.

**Bloqueia:** plano 004 (que cita o glossário nas superfícies e conta as redefinições remanescentes).

## Contexto

O sistema hoje não tem glossário: cada agente e cada workflow reexplica os conceitos com redação própria. O pacote inteiro (`up/`) é copiado para `<config>/up/` nos quatro runtimes pelo instalador, então um arquivo novo em `up/references/` já viaja por padrão. O que não viaja por padrão é a instrução de usar o glossário nos runtimes sem hook nativo (Gemini, OpenCode e Codex), que dependem do bloco de bootstrap injetado no arquivo de instruções global.

@up/references/questioning.md - exemplo de reference de doutrina já existente
@up/bin/install.js - função `buildUpBootstrapBlock` monta o bloco injetado nos runtimes sem hook
@up/skills/usando-up/SKILL.md - bootstrap de sessão do Claude Code

## Contrato do arquivo de glossário

Este contrato é consumido pelo plano 004, que implementa o leitor. Ele é lei para os dois planos.

Cabeçalho do arquivo: título de nível 1, uma seção de propósito, uma seção com a regra de citação e uma seção `## Termos`.

Dentro de `## Termos`, cada verbete é um cabeçalho de nível 3 com o termo canônico em minúsculas, seguido de exatamente três linhas em negrito, nesta ordem:

```
### fase
**Definição:** uma ou duas frases.
**Formas:** forma1, forma2
**Evitar:** sinonimo1, sinonimo2, sinonimo3
```

Regras do contrato: `Formas` lista todas as grafias que a ferramenta deve reconhecer como o termo (singular, plural, com e sem acento). `Evitar` lista os sinônimos proibidos. Nenhum verbete pode ficar sem as três linhas. O leitor do plano 004 extrai a lista de termos e de formas exatamente daqui, então mudar esse formato quebra o leitor.

## Tarefas

<task id="1" type="auto">
<files>up/references/glossario-up.md (novo)</files>
<contrato>Arquivo de referência de doutrina, distribuído dentro do pacote, sem frontmatter YAML (as references do UP não usam frontmatter). Escrito em português brasileiro acentuado, sem travessão.</contrato>
<action>
Criar o arquivo com o cabeçalho, nesta ordem.

Título: `# Glossário interno do UP`.

Bloco `<purpose>`: declarar em duas frases que este é o vocabulário do próprio sistema UP, que ele é fonte única, e que agentes, workflows e skills devem citar o verbete em vez de reexplicar o conceito com redação própria.

Seção `## Regra de definição única`: declarar as quatro regras, em prosa curta.
Primeira: quem precisa do termo usa o termo e aponta para este arquivo, nunca redefine.
Segunda: quem precisa de detalhe operacional descreve o procedimento, o que não é redefinir o termo.
Terceira: a linha `Evitar` de cada verbete lista sinônimos proibidos, e usar um deles no lugar do termo é erro de vocabulário.
Quarta: este arquivo é o único lugar do produto onde os termos abaixo aparecem definidos.

Seção `## Formas de redefinição contadas pela verificação`: declarar a lista fechada de quatro formas estruturais que a verificação conta como redefinição concorrente, exatamente estas.
Forma 1: linha do tipo `**termo**:` seguida de prosa.
Forma 2: item de lista do tipo `- termo:` seguido de prosa.
Forma 3: linha de tabela cuja primeira célula é exatamente o termo, quando não é a linha de cabeçalho da tabela.
Forma 4: cabeçalho markdown cujo texto é exatamente o termo, ou exatamente `O que é <termo>`.
Declarar também os três cortes, em número: só conta quando a prosa do lado direito tem oito palavras ou mais; nunca conta linha dentro de bloco de código; nunca conta linha que já aponta para este arquivo.
</action>
<aceite>O arquivo existe, tem título, propósito, a seção de regra de definição única com quatro regras e a seção de formas de redefinição com as quatro formas e os três cortes numerados. Nenhuma frase usa travessão.</aceite>
<prova>smoke: `grep -c "Forma" up/references/glossario-up.md` retorna 4 ou mais e `grep -n "oito palavras" up/references/glossario-up.md` retorna uma linha.</prova>
</task>

<task id="2" type="auto">
<files>up/references/glossario-up.md</files>
<contrato>Seção `## Termos` com os nove verbetes obrigatórios, cada um seguindo o contrato de três linhas declarado acima.</contrato>
<action>
Acrescentar a seção `## Termos` e escrever os nove verbetes, nesta ordem e com este conteúdo. As definições abaixo são o texto a usar, não uma sugestão para reescrever.

`### fase`
Definição: Unidade de escopo do roadmap, com objetivo próprio, critérios de sucesso e um ou mais planos. É a unidade que ganha branch, issue e fechamento no ciclo de execução.
Formas: fase, fases
Evitar: sprint, etapa, milestone, marco, iteração, stage

`### plano`
Definição: Arquivo executável de uma fase, com objetivo, tarefas numeradas, arquivos tocados e critério de aceite. É dimensionado para caber em uma janela de contexto fresca.
Formas: plano, planos
Evitar: spec, backlog, história, ticket, task list, roteiro

`### onda`
Definição: Visão derivada da dependência declarada entre planos, que agrupa os planos cujos bloqueadores já estão prontos. A onda é leitura do grafo de dependência, e não a ordem primária de execução: quem define a ordem é a aresta de bloqueio declarada no plano.
Formas: onda, ondas
Evitar: wave, batch, lote, rodada, sprint, estágio

`### gate`
Definição: Bloqueio determinístico que só libera o avanço quando existe veredito registrado no log de aprovações. Não é pausa para o dono: a pausa que devolve o controle ao dono chama-se checkpoint.
Formas: gate, gates
Evitar: portão, checkpoint, aprovação, validação, trava

`### evidência`
Definição: Prova registrada no log de aprovações, no formato tipo e resultado, que sustenta o veredito de uma fase. O tipo da prova sai da natureza do trabalho, não da preferência de quem executa.
Formas: evidência, evidências, evidencia, evidencias
Evitar: proof, comprovação, print, log, resultado, output

`### worktree`
Definição: Cópia de trabalho isolada do repositório, criada por fase, onde a execução acontece sem sujar a árvore principal. Toda worktree tem uma branch própria, mas branch e worktree não são a mesma coisa.
Formas: worktree, worktrees
Evitar: clone, cópia do repo, sandbox, ambiente, branch

`### escape hatch`
Definição: Caminho declarado para pular a cerimônia de fase (sem worktree, sem issue e sem PR) e commitar direto na branch atual, quando o trabalho não justifica o ciclo completo. No UP v2 o escape hatch é a rota rápida e a flag local; a flag solo não desliga a integração com o repositório.
Formas: escape hatch, escape-hatch
Evitar: atalho, bypass, modo rápido, exceção, gambiarra

`### verificação`
Definição: Passe que confere o resultado entregue contra o objetivo declarado da fase, de trás para frente, antes do veredito. É distinta da revisão, que olha conformidade com o spec e qualidade do código.
Formas: verificação, verificações, verificacao, verificacoes
Evitar: validação, QA, checagem, auditoria

`### laço DCRV`
Definição: Laço do comando de teste que detecta um problema, corrige e reverifica o mesmo ponto até fechar, em vez de reportar e seguir. Reverificar o mesmo ponto é o que fecha o laço.
Formas: DCRV, laço DCRV, laco DCRV, detectar-corrigir-reverificar
Evitar: ciclo de QA, loop de testes, DCR, iteração de correção

Antes de escrever o verbete de escape hatch, confirmar o comportamento atual lendo a lógica de início e de encerramento de fase em `up/bin/lib/github.cjs`: a flag solo não desliga a integração e a flag local é que produz o caminho sem worktree. O texto acima já reflete o comportamento verificado; se a leitura contradisser, o comportamento no código vence e o verbete é corrigido, com a divergência anotada no resumo do plano.
</action>
<aceite>Os nove verbetes existem sob `## Termos`, cada um com as três linhas em negrito na ordem Definição, Formas, Evitar. O verbete de onda contém a frase que a declara visão derivada da dependência declarada e nega que ela seja a ordem primária. Nenhum verbete tem linha Evitar vazia.</aceite>
<prova>smoke: `grep -c "^### " up/references/glossario-up.md` retorna 9; `grep -c "^\*\*Evitar:\*\*" up/references/glossario-up.md` retorna 9; `grep -c "^\*\*Formas:\*\*" up/references/glossario-up.md` retorna 9; `grep -n "derivada" up/references/glossario-up.md` casa dentro do verbete de onda.</prova>
</task>

<task id="3" type="auto">
<files>up/skills/usando-up/SKILL.md</files>
<contrato>Skill de bootstrap injetada no início de sessão do Claude Code. Ganha uma linha nova de vocabulário, no mesmo estilo das linhas existentes (rótulo em negrito seguido de uma frase). Nenhuma linha existente é reescrita.</contrato>
<action>
Inserir uma linha única logo depois da linha que começa com `**Persistencia:**`, com este texto:

`**Vocabulário único:** os termos do UP (fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV) têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.`

O caminho é escrito com `$HOME/.claude/` de propósito: o instalador reescreve esse prefixo para o diretório de configuração de cada runtime. Não usar o prefixo de arroba antes do caminho, para não forçar carga do arquivo em toda sessão.
</action>
<aceite>A skill contém exatamente uma ocorrência de `glossario-up.md`, e a linha nova cita os nove termos. As demais linhas do arquivo continuam idênticas.</aceite>
<prova>smoke: `grep -c "glossario-up.md" up/skills/usando-up/SKILL.md` retorna 1; `git diff --stat up/skills/usando-up/SKILL.md` mostra uma linha acrescentada e nenhuma removida.</prova>
</task>

<task id="4" type="auto">
<files>up/bin/install.js</files>
<contrato>A função que monta o bloco de bootstrap injetado em GEMINI.md (Gemini) e AGENTS.md (OpenCode e Codex) passa a citar o glossário. O bloco continua idempotente e continua sendo remontado a cada instalação. Nenhum alvo de instalação novo, nenhuma flag nova, nenhuma mudança na ordem dos passos de instalação.</contrato>
<action>
Em `buildUpBootstrapBlock`, declarar uma constante local para o diretório de references, no mesmo padrão da constante já existente para skills, usando o mesmo helper de prefixo de home e o sufixo `up/references`.

Acrescentar um item novo à lista numerada do bloco, depois do item 5 (o que fala de estado em `.plano/`), com este texto:

`6. VOCABULÁRIO ÚNICO: os termos do UP (fase, plano, onda, gate, evidência, worktree, escape hatch, verificação, laço DCRV) têm definição única. Ref: <refs>/glossario-up.md. Use o termo, não redefina.`

onde `<refs>` é a constante nova. Manter o restante do bloco intacto, inclusive a linha final de porta única.
</action>
<aceite>Instalar em diretório temporário com o alvo de todos os runtimes e o modo local faz GEMINI.md e os dois AGENTS.md conterem a string `glossario-up.md`. Reinstalar duas vezes seguidas mantém uma única ocorrência do bloco em cada arquivo (idempotência preservada).</aceite>
<prova>smoke: em diretório temporário, rodar o instalador com `--all --local`, depois `grep -c "glossario-up.md" .gemini/GEMINI.md .opencode/AGENTS.md .codex/AGENTS.md` (cada um retorna 1), rodar o instalador de novo e repetir o grep com o mesmo resultado.</prova>
</task>

<task id="5" type="auto">
<files>nenhum arquivo alterado (tarefa de prova)</files>
<contrato>Prova de distribuição nos quatro runtimes. A instalação acontece em diretório temporário com o modo local, para nunca tocar a configuração real do dono.</contrato>
<action>
Criar um diretório temporário, entrar nele e rodar o instalador do pacote com os argumentos de todos os runtimes e instalação local. Conferir, para cada um dos quatro diretórios de configuração gerados, que o glossário chegou em `up/references/glossario-up.md`. Conferir também que a contagem de references subiu de dezenove para vinte em cada runtime. Registrar a saída no resumo do plano. Remover o diretório temporário ao final.
</action>
<aceite>Os quatro caminhos de glossário existem depois da instalação, e a contagem de arquivos em `up/references` é 20 em cada um dos quatro diretórios de configuração.</aceite>
<prova>smoke: instalação real em diretório temporário seguida de conferência por listagem de arquivo, com a saída colada no resumo.</prova>
</task>

## Critérios de Sucesso

- [ ] O glossário existe com os nove termos exigidos, cada um com definição, formas e sinônimos proibidos
- [ ] O verbete de onda está escrito na forma final, como visão derivada da dependência declarada
- [ ] O verbete de escape hatch reflete o comportamento verificado no código, e não a descrição antiga
- [ ] O contrato de formato do arquivo (três linhas por verbete) está cumprido, porque o plano 004 depende dele
- [ ] O glossário chega aos quatro runtimes na instalação, provado por instalação real em diretório temporário
- [ ] Os três runtimes sem hook nativo recebem, no bloco de bootstrap, a instrução de usar o glossário

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Citar o glossário nos doze agentes e nos doze workflows. Isso é o plano 004, dono desses arquivos.
- Implementar a contagem de redefinições. Isso é o plano 004.
- Criar qualquer artefato dentro de `.plano/` do projeto do usuário (glossário de projeto, decisões ou base de rejeições). Isso é dos planos 002, 003 e 005.
- Reacentuar ou reescrever as linhas já existentes do bloco de bootstrap e da skill de bootstrap. O passe de redação tem briefing próprio.
- Criar alvo de instalação novo, flag nova ou mudar a ordem dos passos do instalador.
- Adicionar um décimo termo ao glossário. Nove é o piso exigido e o teto deste plano.
- Implementar a derivação da ordem de execução a partir das arestas de bloqueio. O verbete de onda nasce na forma final por decisão registrada, e o comportamento correspondente é entregue na fase 17, que confere o verbete publicado contra o que entregou. Aqui se escreve a definição, não o mecanismo.
