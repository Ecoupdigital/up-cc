# Glossário interno do UP

<purpose>
Este é o vocabulário do próprio sistema UP: a fonte única de definição dos termos internos do produto. Agentes, workflows e skills devem citar o verbete deste arquivo em vez de reexplicar o conceito com redação própria.
</purpose>

## Regra de definição única

Primeira: quem precisa do termo usa o termo e aponta para este arquivo, nunca redefine.

Segunda: quem precisa de detalhe operacional descreve o procedimento, o que não é redefinir o termo.

Terceira: a linha `Evitar` de cada verbete lista sinônimos proibidos, e usar um deles no lugar do termo é erro de vocabulário.

Quarta: este arquivo é o único lugar do produto onde os termos abaixo aparecem definidos.

## Formas de redefinição contadas pela verificação

Lista fechada de quatro formas estruturais que a verificação conta como redefinição concorrente.

Forma 1: linha do tipo `**termo**:` seguida de prosa.

Forma 2: item de lista do tipo `- termo:` seguido de prosa.

Forma 3: linha de tabela cuja primeira célula é exatamente o termo, quando não é a linha de cabeçalho da tabela.

Forma 4: cabeçalho markdown cujo texto é exatamente o termo, ou exatamente `O que é <termo>`.

Três cortes valem sobre as quatro formas acima. Primeiro corte: só conta quando a prosa do lado direito tem oito palavras ou mais. Segundo corte: nunca conta linha dentro de bloco de código. Terceiro corte: nunca conta linha que já aponta para este arquivo.

## Termos

### fase
**Definição:** Unidade de escopo do roadmap, com objetivo próprio, critérios de sucesso e um ou mais planos. É a unidade que ganha branch, issue e fechamento no ciclo de execução.
**Formas:** fase, fases
**Evitar:** sprint, etapa, milestone, marco, iteração, stage

### plano
**Definição:** Arquivo executável de uma fase, com objetivo, tarefas numeradas, arquivos tocados e critério de aceite. É dimensionado para caber em uma janela de contexto fresca.
**Formas:** plano, planos
**Evitar:** spec, backlog, história, ticket, task list, roteiro

### onda
**Definição:** Visão derivada da dependência declarada entre planos, que agrupa os planos cujos bloqueadores já estão prontos. A onda é leitura do grafo de dependência, e não a ordem primária de execução: quem define a ordem é a aresta de bloqueio declarada no plano.
**Formas:** onda, ondas
**Evitar:** wave, batch, lote, rodada, sprint, estágio

### gate
**Definição:** Bloqueio determinístico que só libera o avanço quando existe veredito registrado no log de aprovações. Não é pausa para o dono: a pausa que devolve o controle ao dono chama-se checkpoint.
**Formas:** gate, gates
**Evitar:** portão, checkpoint, aprovação, validação, trava

### evidência
**Definição:** Prova registrada no log de aprovações, no formato tipo e resultado, que sustenta o veredito de uma fase. O tipo da prova sai da natureza do trabalho, não da preferência de quem executa.
**Formas:** evidência, evidências, evidencia, evidencias
**Evitar:** proof, comprovação, print, log, resultado, output

### worktree
**Definição:** Cópia de trabalho isolada do repositório, criada por fase, onde a execução acontece sem sujar a árvore principal. Toda worktree tem uma branch própria, mas branch e worktree não são a mesma coisa.
**Formas:** worktree, worktrees
**Evitar:** clone, cópia do repo, sandbox, ambiente, branch

### escape hatch
**Definição:** Caminho declarado para pular a cerimônia de fase (sem worktree, sem issue e sem PR) e commitar direto na branch atual, quando o trabalho não justifica o ciclo completo. No UP v2 o escape hatch é a rota rápida e a flag local; a flag solo não desliga a integração com o repositório.
**Formas:** escape hatch, escape-hatch
**Evitar:** atalho, bypass, modo rápido, exceção, gambiarra

### verificação
**Definição:** Passe que confere o resultado entregue contra o objetivo declarado da fase, de trás para frente, antes do veredito. É distinta da revisão, que olha conformidade com o spec e qualidade do código.
**Formas:** verificação, verificações, verificacao, verificacoes
**Evitar:** validação, QA, checagem, auditoria

### laço DCRV
**Definição:** Laço do comando de teste que detecta um problema, corrige e reverifica o mesmo ponto até fechar, em vez de reportar e seguir. Reverificar o mesmo ponto é o que fecha o laço.
**Formas:** DCRV, laço DCRV, laco DCRV, detectar-corrigir-reverificar
**Evitar:** ciclo de QA, loop de testes, DCR, iteração de correção
