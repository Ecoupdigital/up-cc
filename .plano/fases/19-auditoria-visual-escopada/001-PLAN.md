---
phase: 19-auditoria-visual-escopada
plan: 19-001
type: feature
autonomous: true
wave: 0
depends_on: []
requirements: [AUD-01, AUD-02]
prova: lógica-vermelho-verde
must_haves:
  truths:
    - "Existe operação determinística que devolve os arquivos mais tocados numa janela de commits, com o número da janela declarado na saída e ajustável por flag"
    - "A operação declara em campo próprio se existe concentração de mudança, e quando não existe declara o motivo"
    - "Bump de versão, lockfile, artefato de planejamento e arquivo que não existe mais não aparecem como ponto quente"
    - "Existe contrato escrito do achado de auditoria, com os campos do card, o badge ternário e o campo do falsificador"
  artifacts:
    - path: "up/bin/lib/hotspots.cjs"
      provides: "collectHotspots: ranking de concentração de mudança por janela de commits, com veredito de concentração"
    - path: "up/bin/lib/hotspots.test.cjs"
      provides: "Suite vermelho e verde sobre a operação de pontos quentes"
    - path: "up/bin/up-tools.cjs"
      provides: "Subcomando hotspots no despachante da CLI"
    - path: "up/references/audit-findings-contract.md"
      provides: "Contrato do payload de auditoria consumido pelo renderizador e produzido pelo auditor"
  key_links:
    - from: "up/bin/lib/hotspots.cjs"
      to: "up/bin/lib/core.cjs"
      via: "execGit, a primitiva de git que já existe e nunca lança exceção"
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/hotspots.cjs"
      via: "case 'hotspots' no switch principal do main()"
---

# Fase 19 Plano 001: Pontos quentes e contrato de achado

**Objetivo:** Entregar as duas fundações determinísticas da auditoria escopada. Primeira: uma operação que responde "onde a mudança continua caindo" a partir do histórico de commits, com veredito explícito de concentração e regra de fallback declarada. Segunda: o contrato escrito do achado de auditoria, que o renderizador do plano 002 valida e o agente auditor do plano 003 produz. Sem estas duas peças, os planos seguintes não têm chão.

**Onda:** 0. Nada depende de outro plano desta fase. Os planos 002 e 003 dependem deste.

## Decisão fechada neste plano

**Pergunta:** qual o número padrão de commits da janela de concentração de mudança?

**Resposta recomendada: 50 commits.** Ajustável pela flag `--commits N`.

**Motivo, medido neste repositório em 2026-07-25 (180 commits no total), aplicando o filtro de ruído descrito na tarefa 2:**

| Janela | Arquivos com 3 toques ou mais | Topo do ranking |
|--------|-------------------------------|-----------------|
| 20 commits | 2 | 4 toques no arquivo mais tocado |
| 50 commits | 15 | 15, 13, 8, 7, 6 toques nos cinco primeiros |
| 100 commits | 19 | topo diluído: entra superfície que a versão 2 já renomeou, e o README sobe para terceiro lugar |

Com 20 commits, um repositório comprovadamente ativo cai no fallback de "sem concentração", o que torna o sinal inútil. Com 100 commits a janela arrasta arqueologia: puxa arquivo que só foi tocado num ciclo encerrado e dilui o que está se movendo agora. Com 50 commits há separação limpa entre o topo e a cauda, e o topo bate com as superfícies que de fato estão em obra.

Este número é o padrão, não um dogma. Quem quiser janela maior passa `--commits 100`. Quem tem repositório pequeno recebe a janela inteira, porque `git log -n` devolve o que existe.

## Contexto

@up/bin/lib/core.cjs - a primitiva `execGit(cwd, args)` já existe, devolve `{ exitCode, stdout, stderr }` e nunca lança exceção. Esta e a função de git que este plano reaproveita, por decisão do briefing.
@up/bin/lib/github.test.cjs - o único teste do lado UP hoje. Define a convenção de teste a copiar: `node:assert` puro, helper `t(nome, fn)` com contadores `pass`/`fail`, repositórios git temporários criados com `fs.mkdtempSync(path.join(os.tmpdir(), ...))`, sem framework, arquivo executável direto por `node`.
@up/bin/up-tools.cjs - despachante principal. O `switch (command)` no `main()` fica na faixa das linhas 179 a 525, e cada subcomando novo entra como `case` com um banner de comentário no padrão `// ==================== NOME ====================`. O padrão de delegação para módulo de lib está no `case 'github'`.
@.plano/codebase/CONVENTIONS.md - CommonJS exclusivo, aspas simples, ponto e vírgula obrigatório, dois espaços de indentação, `camelCase` em função e variável, `UPPER_SNAKE_CASE` em constante de módulo, `snake_case` nas chaves do JSON devolvido pela CLI, export nomeado por objeto literal no fim do arquivo.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato público que ele passa a oferecer |
|---------|-------------------------------------------|
| `up/bin/lib/hotspots.cjs` (novo) | Módulo que exporta `collectHotspots({ cwd, commits, minChurn, limite })` e as constantes de padrão. Nunca lança exceção, nunca escreve em disco, nunca toca a árvore de trabalho |
| `up/bin/lib/hotspots.test.cjs` (novo) | Suite executável por `node up/bin/lib/hotspots.test.cjs`, sai com código 1 se qualquer caso falhar |
| `up/bin/up-tools.cjs` (editado) | Subcomando `hotspots` no despachante, aceitando `--commits`, `--limite`, `--min-churn` |
| `up/references/audit-findings-contract.md` (novo) | Contrato do payload de auditoria: campos obrigatórios do card, badge ternário, campo do falsificador, seção de recomendação principal, contagem de descartados |

Nenhum arquivo de empacotamento precisa ser tocado: `up/bin` e `up/references` já constam na lista `files` do `package.json`, e o instalador copia `up/` inteiro por recursao, então os arquivos novos chegam aos quatro runtimes sem alteração no instalador.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/hotspots.test.cjs</files>
<action>
Criar a suite de testes ANTES da implementação (vermelho primeiro). Copiar a estrutura de `up/bin/lib/github.test.cjs`: cabecalho de comentário explicando como rodar, `require('assert')`, `fs`, `os`, `path`, `execSync`, helper `sh(cmd, cwd)`, contadores `let pass = 0, fail = 0`, helper `t(nome, fn)`, e no fim `console.log` do placar mais `process.exit(fail > 0 ? 1 : 0)`.

Escrever um helper de fixture:

```javascript
/** Cria repo git temp com autor fixo e sem assinatura. */
function mkRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-hot-'));
  sh('git init -q', dir);
  sh('git config user.email t@t.co', dir);
  sh('git config user.name t', dir);
  sh('git config commit.gpgsign false', dir);
  return dir;
}

/** Escreve arquivo (criando subdiretorios) e commita. linhas = quantidade de linhas do conteudo. */
function commitArquivo(dir, relPath, linhas, msg) {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, Array.from({ length: linhas }, (_, i) => `linha ${i} ${Math.random()}`).join('\n') + '\n');
  sh('git add -A', dir);
  sh(`git commit -qm "${msg}"`, dir);
}
```

Casos obrigatórios, um `t()` para cada:

1. `sem git: concentração false e motivo declarado` - chamar `collectHotspots({ cwd: fs.mkdtempSync(...) })` num diretório que não é repositório git. Asserts: `r.concentracao === false`, `typeof r.motivo === 'string'` e `r.motivo.length > 0`, `Array.isArray(r.pontos_quentes)` com `length === 0`. Não pode lançar exceção.
2. `janela curta: menos de 5 commits não vira concentração` - repo com 3 commits em 3 arquivos distintos. Asserts: `r.concentracao === false`, `r.motivo` contém a palavra `janela`, `r.commits_analisados === 3`.
3. `concentração verdadeira quando 3 arquivos passam do mínimo de toques` - repo com 8 commits, onde `a.js` e alterado em 4 deles, `b.js` em 3 e `c.js` em 3, cada alteração com 10 linhas. Asserts: `r.concentracao === true`, `r.pontos_quentes[0].arquivo === 'a.js'`, `r.pontos_quentes[0].toques === 4`, `r.pontos_quentes.length >= 3`.
4. `bump de versão não conta como toque` - repo onde `pkg.json` e alterado em 5 commits trocando apenas uma linha por vez (churn 2 por commit, abaixo do mínimo de 3) e `real.js` e alterado em 3 commits com 20 linhas. Asserts: nenhum item de `r.pontos_quentes` tem `arquivo === 'pkg.json'`, `r.descartados.churn_baixo >= 5`.
5. `arquivo que não existe mais fica de fora` - repo onde `morto.js` e criado e alterado em 4 commits e depois removido por `git rm`. Asserts: nenhum item com `arquivo === 'morto.js'`, `r.descartados.inexistentes >= 1`.
6. `caminho ignorado não entra` - repo com 4 commits em `.plano/STATE.md`, 4 em `package-lock.json` e 4 em `CHANGELOG.md`, todos com churn alto. Asserts: `r.pontos_quentes.length === 0` para esses caminhos (usar `r.pontos_quentes.every(p => !p.arquivo.startsWith('.plano/'))` e equivalentes), `r.descartados.ignorados >= 12`.
7. `renomeação é contada no caminho novo` - criar `velho.js`, alterar em 3 commits, depois `git mv velho.js src/novo.js` e alterar mais 2 vezes. Asserts: existe item com `arquivo === 'src/novo.js'`, não existe item com `arquivo === 'velho.js'`.
8. `limite e ordenação determinística` - repo com 6 arquivos quentes; chamar com `limite: 3`. Asserts: `r.pontos_quentes.length === 3`, e a lista está ordenada por `toques` decrescente (verificar `p[i].toques >= p[i+1].toques` em laco). Chamar duas vezes e comparar `JSON.stringify` das duas listas para provar determinismo.
9. `padrões declarados na saída` - qualquer repo valido: asserts `r.janela_commits === 50` quando `commits` não é passado, `r.min_churn === 3` quando `minChurn` não é passado, e `typeof r.gerado_em === 'string'`.

Cada `t()` deve criar seu próprio repositório temporário, sem estado compartilhado entre casos.

Rodar `node up/bin/lib/hotspots.test.cjs` e CONFIRMAR que falha (o módulo ainda não existe, o `require` estoura). Registrar a saída de erro no SUMMARY como o vermelho da dupla vermelho e verde.
</action>
<verify><automated>node up/bin/lib/hotspots.test.cjs; test $? -ne 0 && echo "VERMELHO CONFIRMADO"</automated></verify>
<done>O arquivo de teste existe com 9 casos, e a execução falha porque `up/bin/lib/hotspots.cjs` ainda não existe. A mensagem de falha está copiada no SUMMARY.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/hotspots.cjs</files>
<action>
Implementar o módulo até os 9 casos passarem. Estrutura obrigatória:

```javascript
/**
 * hotspots.cjs - concentracao de mudanca recente por janela de commits.
 * Alimenta a auditoria escopada: aprofundar modulo so onde a mudanca continua caindo.
 */

const fs = require('fs');
const path = require('path');
const { execGit } = require('./core.cjs');

// --- Padroes ---

const JANELA_PADRAO = 50;
const MIN_CHURN_PADRAO = 3;
const LIMITE_PADRAO = 20;
const MIN_TOQUES_QUENTE = 3;
const MIN_ARQUIVOS_QUENTES = 3;
const MIN_COMMITS_JANELA = 5;

const PADROES_IGNORADOS = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)\.next\//,
  /(^|\/)coverage\//,
  /(^|\/)vendor\//,
  /(^|\/)__pycache__\//,
  /(^|\/)\.plano\//,
  /(^|\/)\.planning\//,
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock)$/,
  /(^|\/)CHANGELOG(\.md)?$/i,
];
```

Regras de implementação, uma a uma:

**Chamada de git, uma única vez:**
```javascript
const res = execGit(cwd, ['log', '-n', String(janela), '--no-merges', '--numstat', '--format=@@@%H|%aI']);
```
`--no-merges` porque commit de merge não tem numstat e inflaria a contagem de commits analisados. Se `res.exitCode !== 0` ou `res.stdout` vazio, devolver imediatamente o resultado sem concentração com `motivo: 'sem repositorio git ou sem commits na janela'`.

**Parsing linha a linha:** linha que começa com `@@@` abre um commit novo: incrementar `commitsAnalisados`, guardar a data ISO (parte depois do `|`). Linha que casa `/^(\d+|-)\t(\d+|-)\t(.+)$/` e entrada de arquivo. Se o grupo 1 ou o 2 for `-` (binário), pular sem contar em descartados. Caso contrário `churn = adicionadas + removidas`.

**Normalização de renomeação,** função própria:
```javascript
function normalizarRenomeacao(p) {
  if (!p.includes('=>')) return p;
  const comChaves = p.replace(/\{([^{}]*)\s*=>\s*([^{}]*)\}/, '$2');
  if (comChaves !== p) return comChaves.replace(/\/{2,}/g, '/').replace(/^\//, '');
  return p.slice(p.indexOf('=>') + 2).trim();
}
```

**Ordem dos filtros e contadores de descarte** (o contador só incrementa uma vez por entrada, na primeira regra que barra):
1. `ignorado(p)` pelos padrões: `descartados.ignorados++`, seguir.
2. `churn < minChurn`: `descartados.churn_baixo++`, seguir.
3. Acumular no mapa: `toques + 1`, `linhas_mexidas + churn`, `ultimo_toque` recebe a data do primeiro commit em que o arquivo aparece (o `git log` já vem do mais recente para o mais antigo, então só escrever se ainda estiver vazio).

**Filtro de existência, depois do laco:** para cada caminho acumulado, se `!fs.existsSync(path.join(cwd, arquivo))`, remover e `descartados.inexistentes++`. Fica por último para não gastar `statSync` em entrada já barrada.

**Ordenação determinística:** `toques` decrescente, empate por `linhas_mexidas` decrescente, empate por `arquivo` em ordem crescente com `localeCompare`. Cortar em `limite`.

**Veredito de concentração:** `concentracao = commitsAnalisados >= MIN_COMMITS_JANELA && quentes.filter(p => p.toques >= MIN_TOQUES_QUENTE).length >= MIN_ARQUIVOS_QUENTES`. Quando falso, preencher `motivo` com uma frase que diga qual das duas condições falhou, citando os números: `janela curta demais (3 commits analisados, minimo de 5)` ou `sem concentracao: 1 arquivo com 3 toques ou mais, minimo de 3`.

**Formato de retorno, chaves em snake_case:**
```javascript
{
  janela_commits: Number,
  commits_analisados: Number,
  min_churn: Number,
  concentracao: Boolean,
  motivo: String | null,
  pontos_quentes: [{ arquivo: String, toques: Number, linhas_mexidas: Number, ultimo_toque: String }],
  descartados: { ignorados: Number, churn_baixo: Number, inexistentes: Number },
  gerado_em: new Date().toISOString(),
}
```

**Exports no fim do arquivo, objeto literal:** `module.exports = { collectHotspots, JANELA_PADRAO, MIN_CHURN_PADRAO, LIMITE_PADRAO, MIN_TOQUES_QUENTE, MIN_ARQUIVOS_QUENTES, MIN_COMMITS_JANELA };`

Envolver o corpo de `collectHotspots` num `try/catch` que devolve o resultado sem concentração com `motivo` descrevendo a falha. Este módulo nunca pode derrubar a CLI.
</action>
<verify><automated>node up/bin/lib/hotspots.test.cjs</automated></verify>
<done>Os 9 casos passam (placar sem falha, saída com código 0). O verde da dupla vermelho e verde está registrado no SUMMARY.</done>
</task>

<task id="3" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Ligar o subcomando no despachante. Duas edições:

**1. Import no topo do arquivo,** junto dos outros requires de lib (onde `github` e `multica` já são importados): `const hotspots = require('./lib/hotspots.cjs');`

**2. `case` novo no `switch (command)` do `main()`,** posicionado logo antes do `case 'phase-plan-index'`, com o banner no padrão do arquivo:

```javascript
    // ==================== HOTSPOTS (Fase 19: escopo por concentracao de mudanca) ====================
    case 'hotspots': {
      const sub = args.slice(1);
      const getFlag = (name, fallback) => {
        const i = sub.indexOf(name);
        if (i === -1) return fallback;
        const v = parseInt(sub[i + 1], 10);
        return Number.isFinite(v) && v > 0 ? v : fallback;
      };
      const result = hotspots.collectHotspots({
        cwd,
        commits: getFlag('--commits', hotspots.JANELA_PADRAO),
        limite: getFlag('--limite', hotspots.LIMITE_PADRAO),
        minChurn: getFlag('--min-churn', hotspots.MIN_CHURN_PADRAO),
      });
      output(result, raw, JSON.stringify(result));
      break;
    }
```

Flag invalida (valor ausente, zero, negativo ou não numérico) cai no padrão em vez de derrubar o comando, porque este subcomando e chamado por agente e não pode falhar por digitação.

Atualizar também a string de uso do `error('Usage: up-tools <command> ...')` no inicio do `main()` se ela listar comandos, acrescentando `hotspots` a lista.
</action>
<verify><automated>node up/bin/up-tools.cjs hotspots --commits 50 --limite 5 | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);if(r.janela_commits!==50||!Array.isArray(r.pontos_quentes))process.exit(1);console.log('OK',r.concentracao,r.pontos_quentes.length)})"</automated></verify>
<done>`node up/bin/up-tools.cjs hotspots` devolve JSON valido com `janela_commits`, `concentracao` e `pontos_quentes`. Rodando neste repositório com a janela padrão, `concentracao` é verdadeira e o topo do ranking cita superfícies do próprio UP (workflow de build e CLI de ferramentas), não lockfile nem artefato de planejamento.</done>
</task>

<task id="4" type="auto">
<files>up/references/audit-findings-contract.md</files>
<action>
Escrever a reference que define o contrato do payload de auditoria. Este arquivo é a fonte única que o renderizador (plano 002) valida e que o agente auditor (plano 003) produz. Escrever em português com acentuação, sem travessao.

Seções obrigatórias:

**1. Para que serve.** Uma frase: o auditor produz este payload, a CLI o transforma em relatório HTML, e o renderizador recusa payload fora do contrato. O formato do card e estrutural, não uma recomendação de redação.

**2. Formato do payload,** com bloco JSON de exemplo completo e preenchido de forma realista:

```json
{
  "projeto": "nome do projeto",
  "gerado_em": "2026-07-25T13:22:10.512Z",
  "escopo": {
    "janela_commits": 50,
    "concentracao": true,
    "rede_alargada": false,
    "motivo_alargamento": null,
    "pontos_quentes": [
      { "arquivo": "caminho/relativo.ext", "toques": 14 }
    ],
    "arquivos_lidos": 23
  },
  "recomendacao_principal": {
    "id": "AC-002",
    "motivo": "Uma frase dizendo por que este vem primeiro."
  },
  "descartados_por_falsificador": 9,
  "achados": [
    {
      "id": "AC-001",
      "titulo": "Titulo curto do achado",
      "arquivos": ["caminho/um.ext", "caminho/dois.ext"],
      "problema": "Uma frase.",
      "solucao": "Uma frase.",
      "ganhos": ["bullet curto", "outro bullet curto"],
      "forca": "Forte",
      "falsificador": "Uma frase nomeando a concentracao ou a metrica que salvou o achado."
    }
  ]
}
```

**3. Regras de campo,** em tabela: nome, obrigatório, tipo, regra. Registrar explicitamente que `problema` e `solucao` são de UMA frase (no máximo um terminador de frase), `ganhos` tem de 1 a 4 itens curtos, `forca` só aceita os três rótulos exatos `Forte`, `Vale explorar` e `Especulativo`, `falsificador` é obrigatório em todo achado publicado, `recomendacao_principal.id` tem de existir na lista de achados, e `descartados_por_falsificador` é obrigatório mesmo quando vale zero.

**4. Badge ternário, critério de cada rótulo:**
- `Forte`: mais de um sinal independente no código lido, ou um sinal com número objetivo medido (contagem de ocorrências, tamanho, versão com vulnerabilidade conhecida). O falsificador passa citando concentração de complexidade ou métrica que se move.
- `Vale explorar`: sinal único, ou ganho que depende de premissa não confirmada no código (volume de dados, frequência de uso, tamanho futuro do time).
- `Especulativo`: o padrão foi reconhecido mas o ganho só aparece depois de medir. Máximo de um por relatório, e apenas se o falsificador passar.

**5. Teste falsificador, critério de eliminação.** Antes de publicar, o achado responde as duas perguntas:
1. Corrigir isto concentra complexidade num lugar só, ou seja, diminui o número de lugares que precisam mudar quando o mesmo requisito voltar?
2. Corrigir isto move alguma métrica declarável: arquivos tocados por mudança tipica, bytes entregues, número de chamadas, tempo de execução da suite, número de caminhos condicionais?

Se as duas respostas forem não, o achado e DESCARTADO e entra em `descartados_por_falsificador`. Achado publicado carrega no campo `falsificador` a resposta que o salvou, nomeando qual concentração ou qual métrica. Frase genérica do tipo "melhora a manutenibilidade" não é resposta e não salva achado.

**6. Recomendação principal.** Obrigatória. Aponta um único achado e diz por que ele vem primeiro. Critério de desempate quando dois parecem iguais: vence o que fica dentro dos pontos quentes do escopo, porque e onde a mudança continua caindo. Se nenhum estiver, vence o de maior força.

**7. Fronteira do contrato.** O payload não carrega plano de implementação, nem passo a passo, nem trecho de código de solução. A solução é uma frase. Projetar a solução acontece depois do gate de handoff, noutra rodada, e nunca no mesmo turno do diagnostico.
</action>
<verify><automated>node -e "const fs=require('fs');const t=fs.readFileSync('up/references/audit-findings-contract.md','utf-8');const faltando=['descartados_por_falsificador','falsificador','Vale explorar','Especulativo','recomendacao_principal','rede_alargada'].filter(k=>!t.includes(k));if(faltando.length){console.error('faltando:',faltando);process.exit(1)};const m=t.match(/\`\`\`json([\s\S]*?)\`\`\`/);JSON.parse(m[1]);console.log('contrato OK, exemplo JSON parseavel')"</automated></verify>
<done>A reference existe, o exemplo JSON dentro dela e parseável, e as sete seções estão presentes com os três rótulos exatos do badge e as duas perguntas do falsificador escritas na integra.</done>
</task>

<task id="5" type="auto">
<files>up/bin/lib/hotspots.test.cjs</files>
<files>up/bin/lib/hotspots.cjs</files>
<action>
Fechamento do plano. Rodar a suite uma última vez e conferir a regressão minima local:

1. `node up/bin/lib/hotspots.test.cjs` passa com placar sem falha.
2. `node up/bin/lib/github.test.cjs` continua passando (nada foi quebrado no despachante).
3. `node up/bin/up-tools.cjs state load` continua devolvendo JSON (prova de que o `require` novo no topo do arquivo não quebrou nenhum outro caminho).
4. `git status --porcelain` mostra apenas os arquivos deste plano, sem lixo de fixture. Se algum diretório temporário tiver vazado para dentro do repositório, corrigir o teste para usar `os.tmpdir()`.

Commitar de forma atômica, um commit por unidade lógica, usando a operação de commit da própria CLI de ferramentas.
</action>
<verify><automated>node up/bin/lib/hotspots.test.cjs && node up/bin/lib/github.test.cjs && node up/bin/up-tools.cjs state load > /dev/null && test -z "$(git status --porcelain | grep -v '.plano/fases/19')" && echo "FECHAMENTO OK"</automated></verify>
<done>As duas suites passam, o despachante responde, e a árvore de trabalho contém apenas os arquivos previstos por este plano.</done>
</task>

## Critério de aceite do plano

- [ ] `node up/bin/up-tools.cjs hotspots` devolve JSON com `janela_commits: 50` por padrão, e `--commits N` muda esse número na saída (AUD-01)
- [ ] A saída traz `concentracao` como booleano e, quando falso, `motivo` com frase que cita os números que reprovaram (AUD-02)
- [ ] Bump de versão, lockfile, caminho de planejamento, changelog e arquivo removido não aparecem entre os pontos quentes, e cada descarte tem contador próprio
- [ ] A suite de pontos quentes tem 9 casos, foi vista falhar antes de passar, e roda em menos de 60 segundos
- [ ] A reference do contrato existe, com exemplo JSON parseável, os três rótulos exatos do badge e as duas perguntas do falsificador
- [ ] `node up/bin/lib/github.test.cjs` continua passando

## Tipo de prova

**Lógica, vermelho e verde.** A operação de pontos quentes é lógica determinística sobre saída de git, então a prova e teste automatizado visto falhar antes de passar. O SUMMARY deve carregar a mensagem de falha do vermelho e o placar do verde. A reference do contrato é documento, é a prova dela e a verificação estrutural automatizada da tarefa 4.

## Fora de escopo

- Não gerar HTML aqui. Renderização e do plano 002.
- Não tocar no agente auditor nem no workflow de auditoria. São dos planos 003 e 004.
- Não criar métrica de complexidade, não rodar análise estática, não pontuar arquivo por dificuldade. Ponto quente e frequência de mudança, e nada além disso.
- Não inferir autoria, não contar linhas por pessoa, não produzir ranking de quem mexeu mais. O sinal é o arquivo, nunca a pessoa.
- Não mexer no instalador nem na lista de arquivos publicados. Os diretórios novos já são cobertos.
- Não alterar `phase-plan-index`, `git-map.json` nem o log de aprovações. Contrato de dado desta fase e apenas o payload de auditoria.
</content>
</invoke>
