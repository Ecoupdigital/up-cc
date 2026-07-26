# Itens fora de escopo encontrados durante a prova (plano 004)

Descobertas durante a tarefa 4 (regressão), fora do escopo desta fase porque não foram causadas
nem agravadas por ela. Registradas aqui em vez de corrigidas, conforme a regra de limite de escopo
do executor ("só auto-corrija issues DIRETAMENTE causados pelas mudanças da tarefa atual").

## 1. `up-tools.cjs init <workflow>` não reconhece `up` nem `auditar`

**Encontrado durante**: tarefa 4, item 7 (leituras de planejamento anterior ao ciclo).

**Sintoma**: `node up/bin/up-tools.cjs init up` e `node up/bin/up-tools.cjs init auditar` saem com
`Error: Unknown init workflow: <nome>` e código de saída 1 (texto de erro puro, não JSON), embora
`up/workflows/up.md` (linha 42) e `up/workflows/auditar.md` (linha 35) chamem exatamente esses dois
comandos. O dispatcher em `up/bin/up-tools.cjs` (função de `case 'init'`) só reconhece os nomes
`planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso,
verificar-trabalho, melhorias, ideias, iniciar`, que são nomes de workflow de uma convenção
anterior à atual (`up`, `plan`, `build`, `auditar`, `depurar`, `rapido`, `testar`). `executar-fase`,
`operacao-fase` e `rapido` batem com o que `build.md`, `remover-fase.md` e `rapido.md` chamam, mas
`up` e `auditar` não têm case correspondente.

**Confirmado como pré-existente, não regressão desta fase**: rodei o mesmo comando
(`init up`) na árvore do `SHA_BASE` (`89541fcc92613cc9624cc09d8dc34efb17fb0b3b`, o ponto de partida
desta fase, antes de qualquer edição do plano 15) via `git worktree add`, e o erro é idêntico,
caractere por caractere. A fase 15 não tocou `up/bin/up-tools.cjs` (nenhum plano desta fase lista
esse arquivo em `files_modified`) nem criou a chamada `init up` em `up.md` (ela já existia no
`SHA_BASE`). Portanto isso não é algo que este plano introduziu ou piorou.

**Por que não foi corrigido aqui**: corrigir o dispatcher de `init` é uma mudança em
`up/bin/up-tools.cjs`, arquivo que nenhum plano desta fase toca e que não tem relação com o modo
grill. Está fora do "Fora de escopo deste plano" (004-PLAN.md) por definição (não é doutrina de
grill, não é sonda, não é changelog), e a regra de limite de escopo do executor proíbe corrigir
"warnings pré-existentes... ou falhas em arquivos não relacionados".

**Impacto prático**: o passo 0 do workflow `up.md` (`INIT=$(node ... init up)`) e o passo inicial de
`auditar.md` (`INIT=$(node ... init auditar)`) quebram em uso real, hoje, independente desta fase.
Isso é sério o bastante para merecer atenção do dono, mas é um problema de outra superfície
(dispatcher de `init`), não do modo grill.

**Sugestão de encaminhamento**: abrir uma fase (ou tarefa avulsa) dedicada a adicionar os cases
`up` e `auditar` (e conferir se faltam outros) no dispatcher de `init`, com teste de regressão que
rode `init <cada workflow que algum .md realmente chama>` e falhe se algum não tiver case.
