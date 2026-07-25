---
phase: 19-auditoria-visual-escopada
plan: 19-002
type: feature
autonomous: true
wave: 2
depends_on: [19-001]
requirements: [AUD-03, AUD-04, AUD-05, AUD-06, AUD-07, AUD-09]
prova: lógica-vermelho-verde
must_haves:
  truths:
    - "O relatório de auditoria e um HTML autocontido gravado em diretório temporário do sistema, fora do repositório, e a operação recusa gravar dentro do repositório"
    - "A operação abre o arquivo no navegador do sistema e devolve o caminho absoluto, e quando a abertura falha ela devolve o caminho mesmo assim"
    - "Payload sem falsificador, sem recomendação principal, sem contagem de descartados ou com badge fora do ternário é recusado com mensagem que nomeia o campo e o achado"
    - "Problema e solução com mais de uma frase são recusados, o que torna o formato do card estrutural e não apenas instrução de redação"
  artifacts:
    - path: "up/bin/lib/audit-report.cjs"
      provides: "validarPayload, renderizarHtml e escreverRelatorio: validação do contrato, HTML autocontido e escrita fora do repositório"
    - path: "up/bin/lib/audit-report.test.cjs"
      provides: "Suite vermelho e verde sobre validação, renderização e local de escrita"
    - path: "up/bin/up-tools.cjs"
      provides: "Subcomando audit-report render, lendo o payload pela entrada padrão"
  key_links:
    - from: "up/bin/lib/audit-report.cjs"
      to: "up/references/audit-findings-contract.md"
      via: "Implementa como validação executável cada regra de campo escrita na reference"
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/audit-report.cjs"
      via: "case 'audit-report' no switch principal do main()"
---

# Fase 19 Plano 002: Renderizador do relatório HTML autocontido

**Objetivo:** Transformar o payload de auditoria em relatório HTML autocontido, gravado no diretório temporário do sistema operacional, aberto no navegador, com o caminho absoluto devolvido ao chamador. E, no mesmo movimento, tornar o formato do card estrutural: quem valida o contrato e código determinístico, não instrução em prompt. Card sem falsificador não renderiza. Relatório sem recomendação principal não renderiza. Badge fora do ternário não renderiza.

**Onda:** 2. Depende do plano 001, que entrega a reference com o contrato do payload. Roda em paralelo com o plano 003, que escreve o produtor do mesmo contrato.

## Por que a validação mora aqui e não no prompt do agente

Instrução em prompt é recomendação. Validação em código é regra. O briefing pede formato de card FIXO e seção de recomendação principal OBRIGATÓRIA. A única forma dessas duas palavras significarem alguma coisa é existir um validador que recusa. O auditor do plano 003 recebe o erro do validador quando errar o formato, e corrige sozinho. Sem isso, a primeira execução com pressa devolve lista plana de novo.

## Contexto

@up/references/audit-findings-contract.md - contrato entregue pelo plano 001. É a especificação que este plano transforma em código executável. Ler antes de escrever qualquer validação e implementar exatamente as regras de campo da tabela dele.
@up/bin/lib/core.cjs - de onde vem o padrão de nunca lançar exceção em operação de ambiente e o helper `output`. O protocolo de saída grande por arquivo temporário já usa `require('os').tmpdir()`, e este plano usa a mesma primitiva para o relatório.
@up/bin/lib/github.test.cjs - convenção de teste do repositório: `node:assert` puro, helper `t(nome, fn)`, sem framework, arquivo executável direto por `node`.
@up/references/ui-brand.md - vocabulário visual do UP, hoje só de terminal. O HTML herda a postura, não os caracteres: sem dependência externa e sem framework de CSS.
@.plano/SYSTEM-DESIGN.md - a seção 10 registra a decisão de não criar arquivo de tokens de design aqui, porque o relatório é autocontido e efêmero.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato público que ele passa a oferecer |
|---------|-------------------------------------------|
| `up/bin/lib/audit-report.cjs` (novo) | Exporta `validarPayload(payload)` devolvendo lista de erros, `renderizarHtml(payload, arquivoAbsoluto)` devolvendo string HTML, e `escreverRelatorio({ payload, cwd, abrir })` devolvendo `{ ok, arquivo, abriu, cards, descartados_por_falsificador }`. Nunca escreve dentro do repositório |
| `up/bin/lib/audit-report.test.cjs` (novo) | Suite executável por `node up/bin/lib/audit-report.test.cjs`, saída com código 1 em qualquer falha |
| `up/bin/up-tools.cjs` (editado) | Subcomando `audit-report render`, que le o payload pela entrada padrão é aceita `--sem-abrir` |

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/audit-report.test.cjs</files>
<action>
Criar a suite ANTES da implementação. Estrutura igual a de `up/bin/lib/github.test.cjs`: `require('assert')`, `fs`, `os`, `path`, contadores `let pass = 0, fail = 0`, helper `t(nome, fn)`, placar no fim e `process.exit(fail > 0 ? 1 : 0)`.

Definir no topo um construtor de payload valido, para cada caso mutar apenas o que testa:

```javascript
function payloadValido(over) {
  return Object.assign({
    projeto: 'projeto-teste',
    gerado_em: '2026-07-25T13:22:10.512Z',
    escopo: {
      janela_commits: 50,
      concentracao: true,
      rede_alargada: false,
      motivo_alargamento: null,
      pontos_quentes: [{ arquivo: 'src/a.js', toques: 9 }],
      arquivos_lidos: 12,
    },
    recomendacao_principal: { id: 'AC-001', motivo: 'Fica dentro do ponto quente mais ativo.' },
    descartados_por_falsificador: 4,
    achados: [{
      id: 'AC-001',
      titulo: 'Roteamento duplicado em dois lugares',
      arquivos: ['src/a.js', 'src/b.js'],
      problema: 'A mesma decisao de rota existe em dois arquivos.',
      solucao: 'Deixar a decisao num lugar so e importar nos dois.',
      ganhos: ['um lugar para mudar', 'menos divergencia silenciosa'],
      forca: 'Forte',
      falsificador: 'Concentra a decisao de rota que hoje mora em dois arquivos.',
    }],
  }, over || {});
}
```

Casos obrigatórios, um `t()` para cada:

1. `payload válido não gera erro` - devolve array vazio.
2. `achado sem falsificador é recusado` - remover o campo. A mensagem de erro contém `falsificador` e o id do achado.
3. `badge fora do ternário é recusado` - `forca: 'Media'`. O erro cita `forca` e lista os três rótulos aceitos.
4. `problema com duas frases é recusado` - `problema: 'Uma coisa. Outra coisa.'`. O erro cita `problema` e a palavra `frase`.
5. `solução com duas frases é recusada` - mesma lógica no campo `solucao`.
6. `recomendação principal ausente é recusada` - remover `recomendacao_principal`.
7. `recomendação principal apontando id inexistente é recusada` - `id: 'AC-999'`. O erro cita o id procurado.
8. `contagem de descartados ausente é recusada`, e caso irmao `contagem zero é aceita` com `descartados_por_falsificador: 0` devolvendo array vazio.
9. `lista de achados vazia é recusada` - `achados: []`.
10. `ganhos fora do intervalo é recusado` - dois asserts, um com `ganhos: []` e outro com cinco itens.
11. `html é autocontido` - `renderizarHtml(payloadValido())` devolve string que começa com `<!doctype html`, contém `<style`, e não contém `http://`, `https://`, `<script src` nem `<link rel="stylesheet"`.
12. `html escapa conteúdo vindo do agente` - achado com `titulo` contendo uma tag de script. O HTML contém a versão escapada e não contém a tag executável.
13. `html traz recomendação principal, badge e contagem de descartados` - o HTML contém o texto `Recomendação principal`, o rótulo `Forte` e o número de descartados.
14. `escrita cai no diretório temporário e nunca dentro do repositório` - chamar `escreverRelatorio` com `abrir: false`. Asserts: `r.ok === true`, `path.isAbsolute(r.arquivo)`, `r.arquivo.startsWith(os.tmpdir())`, `fs.existsSync(r.arquivo)` e `!r.arquivo.startsWith(path.resolve(process.cwd()) + path.sep)`.
15. `duas chamadas seguidas não colidem` - dois caminhos diferentes.
16. `abrir falso não tenta abrir navegador` - `r.abriu === false`.
17. `payload inválido não escreve arquivo` - chamar `escreverRelatorio` com payload sem falsificador. Asserts: `r.ok === false`, `Array.isArray(r.erros)` com pelo menos um item, e `r.arquivo` indefinido.

Rodar a suite e CONFIRMAR que falha, porque o módulo ainda não existe. Copiar a saída do vermelho para o SUMMARY.
</action>
<verify><automated>node up/bin/lib/audit-report.test.cjs; test $? -ne 0 && echo "VERMELHO CONFIRMADO"</automated></verify>
<done>Suite com 18 asserts agrupados nos 17 casos escrita e vista falhando por ausência do módulo. Mensagem do vermelho copiada no SUMMARY.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/audit-report.cjs</files>
<action>
Implementar a validação. Assinatura `validarPayload(payload)` devolvendo array de strings, vazio quando valido. Nunca lança.

Cabecalho do módulo e constantes:

```javascript
/**
 * audit-report.cjs - valida o payload de auditoria e renderiza o relatorio HTML autocontido.
 * O relatorio e efemero por design: mora no diretorio temporario do sistema, nunca no repositorio.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const FORCAS = ['Forte', 'Vale explorar', 'Especulativo'];
const MAX_GANHOS = 4;
const MIN_FALSIFICADOR = 20;

/** Conta terminadores de frase. 'Uma coisa.' devolve 1. 'Uma. Outra.' devolve 2. */
function contarFrases(texto) {
  return (String(texto).match(/[.!?](\s|$)/g) || []).length;
}
```

Regras, nesta ordem, cada uma acrescentando uma frase ao array de erros:

1. `payload` ausente ou não objeto: erro único e retorno imediato.
2. `escopo` ausente, `escopo.janela_commits` não número, `escopo.concentracao` não booleano ou `escopo.rede_alargada` não booleano: um erro por campo. Se `rede_alargada` for verdadeiro e `motivo_alargamento` estiver vazio, erro dizendo que rede alargada precisa declarar o motivo. Esta regra é o que torna a declaração de alargamento estrutural no relatório.
3. `recomendacao_principal` ausente, sem `id` ou sem `motivo`: um erro por campo.
4. `descartados_por_falsificador` ausente ou não inteiro maior ou igual a zero: erro. Zero e valor legitimo e não gera erro.
5. `achados` não array ou vazio: erro e retorno, porque não há o que renderizar.
6. Por achado, com o id dentro do texto de todo erro para o agente saber qual corrigir:
   - `id` e `titulo` obrigatórios e não vazios;
   - `arquivos` array com pelo menos um caminho não vazio;
   - `problema` obrigatório com `contarFrases(problema) <= 1`, mensagem no formato `achado AC-00N: campo problema deve ter uma unica frase`;
   - `solucao` obrigatório com a mesma regra e mensagem equivalente;
   - `ganhos` array com 1 a `MAX_GANHOS` itens não vazios;
   - `forca` presente e dentro de `FORCAS`, com a mensagem listando os três rótulos aceitos;
   - `falsificador` presente, não vazio e com pelo menos `MIN_FALSIFICADOR` caracteres, mensagem nomeando campo e id.
7. Ids duplicados entre achados: erro citando o id repetido.
8. `recomendacao_principal.id` que não existe na lista de achados: erro citando o id procurado.

Toda mensagem em português, curta, sempre nomeando campo e id. Ela vai ser lida por um agente que precisa consertar sozinho, e não por uma pessoa.
</action>
<verify><automated>node -e "const a=require('./up/bin/lib/audit-report.cjs');const e=a.validarPayload({achados:[]});if(!Array.isArray(e)||e.length===0)process.exit(1);console.log('validador recusa payload vazio com',e.length,'erros')"</automated></verify>
<done>`validarPayload` existe, devolve array de mensagens em português nomeando campo e id, e os casos 1 a 10 da suite passam.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/audit-report.cjs</files>
<action>
Implementar `renderizarHtml(payload, arquivoAbsoluto)`, devolvendo string. Requisitos duros: autocontido (estilo embutido em `<style>`, zero requisição externa, zero script externo, zero fonte remota) e todo texto vindo do payload passa por escape.

```javascript
function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Estrutura do documento, nesta ordem:

1. `<!doctype html>`, `<html lang="pt-BR">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">` e `<title>` com o nome do projeto.
2. Bloco `<style>` com o tema abaixo, escrito literalmente:

```css
:root { --bg:#0f1115; --card:#171a21; --linha:#252a35; --texto:#e7e9ee; --fraco:#98a0b0; --acento:#4f8cff; }
* { box-sizing:border-box; }
body { margin:0; padding:32px 16px 64px; background:var(--bg); color:var(--texto);
  font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height:1.55; }
.wrap { max-width:880px; margin:0 auto; }
h1 { font-size:24px; margin:0 0 4px; letter-spacing:-0.01em; }
.sub { color:var(--fraco); font-size:14px; margin:0 0 28px; }
.principal { background:var(--card); border:1px solid var(--linha); border-left:3px solid var(--acento);
  border-radius:8px; padding:18px 20px; margin:0 0 32px; }
.principal h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:var(--fraco); margin:0 0 8px; }
.card { background:var(--card); border:1px solid var(--linha); border-radius:8px; padding:18px 20px; margin:0 0 16px; }
.card h3 { font-size:17px; margin:0 0 10px; }
.arquivos { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px;
  color:var(--fraco); margin:0 0 12px; word-break:break-all; }
.rot { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--fraco); margin:12px 0 2px; }
.card p { margin:0; }
.card ul { margin:4px 0 0; padding-left:20px; }
.badge { display:inline-block; font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; }
.b-forte { background:#1f7a4d; color:#eafaf1; }
.b-explorar { background:#7a5b1f; color:#fbf1de; }
.b-especulativo { background:#3a3f4b; color:#d3d8e2; }
.falsificador { font-size:13px; color:var(--fraco); border-top:1px dashed var(--linha); margin-top:14px; padding-top:10px; }
footer { color:var(--fraco); font-size:12px; border-top:1px solid var(--linha); margin-top:32px; padding-top:16px; }
```

3. Cabecalho: `<h1>Auditoria escopada</h1>` e uma linha `.sub` com o nome do projeto, a data legível e a frase de escopo. A frase de escopo tem duas formas, escolhidas pelo campo `rede_alargada`:
   - concentrada: `Escopo: janela de {janela_commits} commits, {n} pontos quentes, {arquivos_lidos} arquivos lidos.`
   - alargada: `Escopo: rede alargada. {motivo_alargamento}. {arquivos_lidos} arquivos lidos.`
   Havendo pontos quentes, listar os cinco primeiros em elemento monoespacado com o número de toques ao lado.
4. Bloco `.principal` com `<h2>Recomendação principal</h2>`, o título do achado apontado por `recomendacao_principal.id` e o texto de `motivo`.
5. Um `.card` por achado, na ordem em que vieram, com está ordem interna fixa: badge de força, `<h3>` com o título, `.arquivos` com os caminhos, rótulo `Problema` mais parágrafo, rótulo `Solucao` mais parágrafo, rótulo `Ganhos` mais lista, e por último `.falsificador` com o prefixo `Falsificador:` seguido da frase. Mapa de classe do badge: `Forte` para `b-forte`, `Vale explorar` para `b-explorar`, `Especulativo` para `b-especulativo`.
6. `<footer>` com quatro linhas: `{n} achados publicados`, `{descartados_por_falsificador} descartados pelo teste falsificador`, `Gerado em {gerado_em}` e o caminho absoluto do próprio arquivo quando `arquivoAbsoluto` for passado.

Nenhum card pode ser renderizado sem o campo do falsificador visível. Se `renderizarHtml` for chamado com payload inválido, ele chama `validarPayload` primeiro e lança com a lista de erros concatenada, porque renderizar payload fora do contrato é exatamente o buraco que esta fase fecha.
</action>
<verify><automated>node -e "const a=require('./up/bin/lib/audit-report.cjs');const p={projeto:'t',gerado_em:'2026-07-25T00:00:00.000Z',escopo:{janela_commits:50,concentracao:true,rede_alargada:false,motivo_alargamento:null,pontos_quentes:[{arquivo:'a.js',toques:9}],arquivos_lidos:3},recomendacao_principal:{id:'AC-001',motivo:'Esta no ponto quente mais ativo.'},descartados_por_falsificador:2,achados:[{id:'AC-001',titulo:'t',arquivos:['a.js'],problema:'Uma frase.',solucao:'Outra frase.',ganhos:['g1'],forca:'Forte',falsificador:'Concentra a decisão que hoje mora em dois lugares.'}]};const h=a.renderizarHtml(p);const ruim=['<script src','https://','http://'].filter(s=>h.includes(s));if(ruim.length){console.error('não autocontido:',ruim);process.exit(1)}if(!h.startsWith('<!doctype html')||!h.includes('Recomendação principal')||!h.includes('Falsificador'))process.exit(1);console.log('html autocontido OK,',h.length,'bytes')"</automated></verify>
<done>O HTML começa com o doctype, não referência recurso externo, escapa conteúdo do agente e traz recomendação principal, badge e campo do falsificador. Os casos 11 a 13 da suite passam.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/audit-report.cjs</files>
<action>
Implementar `escreverRelatorio({ payload, cwd, abrir })`:

1. Validar. Havendo erro, NAO escrever arquivo nenhum e devolver `{ ok: false, erros }`. Devolver, e não lançar: esse é o comportamento testado no caso 17.
2. Montar o diretório de saída:
```javascript
const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), `up-auditoria-${carimbo}-`));
const arquivo = path.join(dir, 'relatorio.html');
```
   `mkdtempSync` resolve colisão entre duas execuções no mesmo segundo, que e o caso 15 da suite.
3. Guarda de repositório, obrigatória, antes de qualquer escrita:
```javascript
const raizRepo = path.resolve(cwd || process.cwd());
if (path.resolve(arquivo).startsWith(raizRepo + path.sep)) {
  return { ok: false, erros: ['recusado: o diretorio temporario resolveu para dentro do repositorio'] };
}
```
   Esta guarda existe porque a promessa de não sujar a árvore de trabalho não pode depender de configuração de ambiente.
4. Renderizar passando o caminho absoluto (`renderizarHtml(payload, arquivo)`) e gravar com `fs.writeFileSync(arquivo, html, 'utf-8')`.
5. Abrir no navegador quando `abrir` for verdadeiro:
```javascript
function abrirNoNavegador(arquivo) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start ""'
    : 'xdg-open';
  try {
    execSync(`${cmd} "${arquivo}"`, { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
```
   Falha aberta: sem ambiente grafico (servidor, container), devolver `abriu: false` e seguir. O caminho absoluto continua sendo entregue, e ele é o que o requisito exige.
6. Retorno: `{ ok: true, arquivo, abriu, cards: payload.achados.length, descartados_por_falsificador: payload.descartados_por_falsificador }`.
7. Exports no fim do arquivo, objeto literal: `module.exports = { validarPayload, renderizarHtml, escreverRelatorio, FORCAS };`
</action>
<verify><automated>node up/bin/lib/audit-report.test.cjs</automated></verify>
<done>Os 17 casos passam. O arquivo escrito fica sob o diretório temporário do sistema, o caminho e absoluto, duas chamadas seguidas não colidem, e payload inválido não deixa arquivo para tras.</done>
</task>

<task id="5" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Ligar o subcomando no despachante. Duas edições:

**1. Import junto dos demais requires de lib:** `const auditReport = require('./lib/audit-report.cjs');`

**2. `case` novo,** logo após o `case 'hotspots'` criado no plano 001, com banner no padrão do arquivo:

```javascript
    // ==================== AUDIT-REPORT (Fase 19: relatorio HTML autocontido) ====================
    case 'audit-report': {
      const sub = args[1];
      if (sub !== 'render') {
        error('Unknown audit-report subcommand. Available: render');
      }
      const semAbrir = args.indexOf('--sem-abrir') !== -1;
      let bruto = '';
      try {
        bruto = fs.readFileSync(0, 'utf-8');
      } catch {
        error('audit-report render: payload esperado na entrada padrao');
      }
      let payload;
      try {
        payload = JSON.parse(bruto);
      } catch (e) {
        error('audit-report render: JSON invalido na entrada padrao (' + e.message + ')');
      }
      const result = auditReport.escreverRelatorio({ payload, cwd, abrir: !semAbrir });
      if (!result.ok) {
        error('audit-report render: payload fora do contrato\n- ' + result.erros.join('\n- '));
      }
      output(result, raw, JSON.stringify(result));
      break;
    }
```

`fs.readFileSync(0, 'utf-8')` le a entrada padrão inteira. A flag `--sem-abrir` existe para teste automatizado e para ambiente sem navegador. Quando o payload é recusado, a saída por erro lista uma linha por problema, para o agente corrigir sem adivinhar.

Acrescentar `audit-report` a string de uso do `error('Usage: up-tools <command> ...')` no inicio do `main()`.
</action>
<verify><automated>printf '%s' '{"projeto":"t","gerado_em":"2026-07-25T00:00:00.000Z","escopo":{"janela_commits":50,"concentracao":true,"rede_alargada":false,"motivo_alargamento":null,"pontos_quentes":[],"arquivos_lidos":3},"recomendacao_principal":{"id":"AC-001","motivo":"m"},"descartados_por_falsificador":2,"achados":[{"id":"AC-001","titulo":"t","arquivos":["a.js"],"problema":"Uma frase.","solucao":"Outra frase.","ganhos":["g"],"forca":"Forte","falsificador":"Concentra a decisao que hoje mora em dois lugares."}]}' | node up/bin/up-tools.cjs audit-report render --sem-abrir</automated></verify>
<done>O subcomando aceita o payload pela entrada padrão, devolve JSON com `arquivo` absoluto sob o diretório temporário, e recusa payload fora do contrato listando um erro por linha.</done>
</task>

<task id="6" type="auto">
<files>up/bin/lib/audit-report.test.cjs</files>
<files>up/bin/lib/audit-report.cjs</files>
<action>
Fechamento do plano:

1. `node up/bin/lib/audit-report.test.cjs` passa com placar sem falha.
2. `node up/bin/lib/hotspots.test.cjs` e `node up/bin/lib/github.test.cjs` continuam passando.
3. `node up/bin/up-tools.cjs state load` continua devolvendo JSON, provando que o require novo no topo não quebrou outro caminho.
4. Gerar um relatório real com o payload de exemplo da reference do contrato, usando `--sem-abrir`, e abrir manualmente o caminho devolvido apenas para conferir que o layout renderiza. A prova visual formal é do plano 006 e não precisa ser coletada aqui.
5. `git status --porcelain` mostra apenas os arquivos deste plano. Nenhum arquivo de relatório pode aparecer, porque ele mora fora do repositório.

Commitar de forma atômica pela operação de commit da própria CLI de ferramentas, separando o commit do módulo do commit do despachante.
</action>
<verify><automated>node up/bin/lib/audit-report.test.cjs && node up/bin/lib/hotspots.test.cjs && node up/bin/lib/github.test.cjs && node up/bin/up-tools.cjs state load > /dev/null && test -z "$(git status --porcelain | grep -v '.plano/fases/19')" && echo "FECHAMENTO OK"</automated></verify>
<done>As três suites passam, o despachante responde, e a árvore de trabalho contém apenas os arquivos previstos por este plano.</done>
</task>

## Critério de aceite do plano

- [ ] O relatório e gravado sob o diretório temporário do sistema operacional e a operação recusa gravar dentro do repositório (AUD-03, AUD-05)
- [ ] O caminho devolvido e absoluto e a abertura no navegador falha aberta sem derrubar a operação (AUD-04)
- [ ] O card renderizado tem, nesta ordem, badge de força, título, arquivos, problema, solução, ganhos e falsificador (AUD-06)
- [ ] Renderizar sem a seção de recomendação principal e impossível: o validador recusa antes (AUD-07)
- [ ] O rodape declara quantos achados foram descartados pelo teste falsificador, e a ausência do campo é recusada (AUD-09)
- [ ] O HTML não faz nenhuma requisição externa e escapa todo texto vindo do agente
- [ ] A suite foi vista falhar antes de passar, e roda em menos de 60 segundos
- [ ] `node up/bin/lib/hotspots.test.cjs` e `node up/bin/lib/github.test.cjs` continuam passando

## Tipo de prova

**Lógica, vermelho e verde.** Validação de contrato, montagem de HTML e escolha de diretório de escrita são lógica determinística. O SUMMARY carrega a mensagem do vermelho e o placar do verde. A prova visual do relatório renderizado (captura de tela) é do plano 006, porque só faz sentido sobre uma auditoria real ponta a ponta.

## Fora de escopo

- Não escrever o agente auditor nem o workflow. São dos planos 003 e 004.
- Não criar arquivo de tokens de design, nem tema claro, nem alternador de tema. A decisão já está registrada no desenho do sistema: relatório autocontido e efêmero não carrega sistema de design.
- Não versionar o relatório, não gravar copia dentro do repositório, não acrescentar entrada no arquivo de exclusão do git. O que é efêmero mora fora, e por isso não precisa ser ignorado.
- Não gerar PDF, não gerar Markdown paralelo, não mandar o relatório por nenhum canal. A saída e uma só.
- Não adicionar dependência de produção. O pacote continua com zero dependência.
- Não mexer no instalador nem na lista de arquivos publicados.
</content>
