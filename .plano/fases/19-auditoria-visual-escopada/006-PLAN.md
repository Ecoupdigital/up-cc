---
phase: 19-auditoria-visual-escopada
plan: 19-006
type: chore
autonomous: true
wave: 5
depends_on: [19-005]
requirements: [AUD-01, AUD-02, AUD-03, AUD-04, AUD-05, AUD-06, AUD-07, AUD-08, AUD-09, REG-01, REG-02, REG-03]
prova: visual
must_haves:
  truths:
    - "Existe captura de tela do relatório HTML aberto, mostrando badge de força, recomendação principal, campo do falsificador e contagem de descartados"
    - "A árvore de trabalho e o diff do repositório continuam limpos depois de uma auditoria completa"
    - "Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração"
    - "Os onze requisitos da categoria de auditoria estão marcados com a evidência que os fecha"
  artifacts:
    - path: ".plano/REQUIREMENTS.md"
      provides: "Marcação dos onze requisitos de auditoria com a evidência correspondente"
    - path: ".plano/ROADMAP.md"
      provides: "Fase 19 fechada, com contagem de planos e evidência"
  key_links:
    - from: "captura de tela do relatório"
      to: "log de aprovações da fase"
      via: "entrada de evidência do tipo visual"
---

# Fase 19 Plano 006: Prova visual, regressão e fechamento

**Objetivo:** Rodar a auditoria de ponta a ponta neste próprio repositório, coletar a prova visual exigida pela fase (captura do relatório HTML aberto), provar que nada regrediu nos sete comandos, nos quatro runtimes e em projeto com planejamento antigo, e fechar os artefatos da fase. É o plano que transforma "está escrito" em "foi visto funcionando".

**Onda:** 5. Depende do plano 005, que fecha o outro lado do gate. É o último plano da fase.

## Contexto

@.plano/ROADMAP.md - o bloco da fase 19 declara nove critérios de sucesso e prova exigida do tipo visual. Este plano fecha os nove.
@.plano/REQUIREMENTS.md - os requisitos de AUD-01 a AUD-11 e os três requisitos transversais de regressão.
@up/bin/install.js - o instalador copia o diretório do pacote inteiro por recursao, então os arquivos novos chegam aos quatro runtimes sem alteração nele. Este plano verifica esse fato em vez de assumir.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato |
|---------|----------|
| `.plano/REQUIREMENTS.md` (editado) | Requisitos de auditoria marcados, cada um com a evidência que o fecha |
| `.plano/ROADMAP.md` (editado) | Fase 19 marcada como completa, com contagem de planos, evidência e data |
| `.plano/fases/19-auditoria-visual-escopada/006-SUMMARY.md` (novo, escrito pelo executor) | Registro das provas coletadas, incluindo o caminho absoluto da captura e a descrição do que aparece nela |

Nenhum arquivo de código e tocado neste plano. Se a execução descobrir que precisa mexer em código, isso é defeito encontrado pela verificação, e o certo e voltar ao plano que entregou aquele código em vez de remendar aqui.

## Tarefas

<task id="1" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Execução ponta a ponta neste repositório, em modo real.

1. Rodar o escopo e guardar a saída:
```bash
node up/bin/up-tools.cjs hotspots --commits 50 --limite 20
```
   Conferir que `concentracao` é verdadeira neste repositório (ele tem mais de 50 commits e concentração clara) e que o topo do ranking cita superfícies do próprio UP, e não lockfile, changelog nem artefato de planejamento.

2. Invocar a auditoria pelo caminho real do comando, com a janela padrão, e deixar o auditor rodar de verdade sobre o recorte. Não simular o agente, não escrever payload a mao. A prova desta fase e a execução real.

3. Guardar, para o SUMMARY: janela usada, se houve concentração, quantos arquivos foram lidos, quantos achados foram publicados, quantos foram descartados pelo falsificador, e qual foi a recomendação principal.

4. Guardar também o caminho absoluto do relatório HTML e o caminho absoluto do payload.

Se o auditor emitir payload fora do contrato na primeira tentativa, isso NAO e falha do plano: registrar quantas reemissoes foram necessárias, porque esse número é informação útil sobre a clareza do contrato. Três ou mais reemissoes indicam que a reference do contrato está ambígua, e ai sim vira defeito a reportar.
</action>
<verify><automated>node up/bin/up-tools.cjs hotspots --commits 50 --limite 20 | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);if(r.concentracao!==true){console.error('esperava concentracao neste repo');process.exit(1)}const ruim=r.pontos_quentes.filter(p=>/lock|CHANGELOG|^\.plano\//.test(p.arquivo));if(ruim.length){console.error('ruido no ranking:',ruim);process.exit(1)}console.log('escopo real OK:',r.pontos_quentes.slice(0,5).map(p=>p.toques+' '+p.arquivo).join(' | '))})"</automated></verify>
<done>A auditoria rodou de ponta a ponta neste repositório. O escopo saiu da concentração real de mudança, sem ruído de lockfile, changelog ou planejamento, e o relatório HTML foi gerado com caminho absoluto conhecido.</done>
</task>

<task id="2" type="checkpoint:human-verify">
<files>.plano/fases/19-auditoria-visual-escopada/006-SUMMARY.md</files>
<action>
Coletar a prova visual. Esta é a prova exigida pela fase, e ela não pode ser substituida por descrição em texto.

Ordem de tentativa, parar na primeira que funcionar:

**1. Playwright pelo servidor MCP** (caminho preferido, já e a integração usada pelo sistema para prova visual):
- navegar para `file:///{caminho absoluto do relatorio}`
- ajustar a janela para 1280 de largura
- capturar a tela inteira, salvando em `{diretorio temporario}/up-auditoria-captura-{carimbo}.png`

**2. Navegador em modo sem interface, pela linha de comando**, se o servidor MCP não estiver disponível. Tentar os executáveis nesta ordem: `chromium`, `chromium-browser`, `google-chrome`, `google-chrome-stable`.
```bash
CAPTURA="$(node -e "console.log(require('os').tmpdir())")/up-auditoria-captura-$(date +%s).png"
chromium --headless --disable-gpu --window-size=1280,2400 --screenshot="$CAPTURA" "file://$RELATORIO"
```

**3. Confirmação do dono**, último recurso: exibir o caminho absoluto, pedir que ele abra e confirme em uma linha o que ve. Registrar como evidência verificada por pessoa, e não como captura automatizada. Ser explícito no SUMMARY sobre qual dos três caminhos foi usado, porque a força da prova muda entre eles.

**O que a captura tem de mostrar, item por item.** Conferir cada um olhando a imagem, e escrever no SUMMARY o que foi visto:
1. O bloco `Recomendação principal` no topo, com o título do achado e o motivo.
2. Pelo menos um badge de força, com um dos três rótulos exatos.
3. Um card completo, na ordem: badge, título, arquivos, problema, solução, ganhos, falsificador.
4. A linha do rodape com a contagem de descartados pelo teste falsificador.
5. A linha do rodape com o caminho absoluto do próprio arquivo.
6. A linha de escopo no cabecalho, com a janela de commits usada.

**Onde a captura mora:** no diretório temporário, nunca dentro do repositório. O SUMMARY registra o caminho absoluto dela. A imagem é efêmera por desenho, igual ao relatório: o que sobrevive e a descrição do que foi visto e o registro no log de aprovações.

Se algum dos seis itens não aparecer na captura, a fase não passa. Voltar ao plano responsavel pelo item (002 para renderização, 003 para conteúdo) e corrigir antes de seguir.
</action>
<verify><automated>test -n "$CAPTURA" && test -f "$CAPTURA" && node -e "const fs=require('fs');const s=fs.statSync(process.argv[1]);if(s.size<10000){console.error('captura pequena demais, provavelmente pagina em branco');process.exit(1)}console.log('captura OK,',Math.round(s.size/1024),'KB')" "$CAPTURA"</automated></verify>
<done>Existe captura do relatório aberto, com os seis itens conferidos um a um e descritos no SUMMARY, e o caminho absoluto da imagem registrado. O caminho de coleta usado (servidor MCP, navegador sem interface ou confirmação do dono) está declarado.</done>
</task>

<task id="3" type="auto">
<files>.plano/fases/19-auditoria-visual-escopada/006-SUMMARY.md</files>
<action>
Provar a higiene do repositório, que e o critério 8 da fase.

1. Antes da auditoria, guardar a saída de `git status --porcelain` e de `git diff --stat`.
2. Depois da auditoria completa (incluindo a resposta ao gate), rodar as duas de novo e comparar.
3. Resultado esperado: identicas. A única diferenca aceitável e um registro de decisão criado por recusa estrutural, e ele já tem de estar commitado, portanto também não aparece como sujeira.
4. Conferir explicitamente que não existe diretório de auditoria dentro do planejamento, nem arquivo de relatório, nem payload, nem captura dentro do repositório:
```bash
find . -path ./node_modules -prune -o -name 'relatorio.html' -print -o -name 'up-auditoria-*' -print -o -path './.plano/auditar' -print -o -path './.plano/auditoria' -print
```
   A saída tem de ser vazia.
5. Registrar as duas saídas no SUMMARY, antes e depois, porque a promessa de não sujar a árvore só vale se alguém tiver olhado.
</action>
<verify><automated>test -z "$(find . -path ./node_modules -prune -o -name 'relatorio.html' -print -o -name 'up-auditoria-*' -print -o -path './.plano/auditar' -print -o -path './.plano/auditoria' -print)" && echo "NENHUM VAZAMENTO DE AUDITORIA NO REPOSITORIO"</automated></verify>
<done>As saídas de estado e de diff são identicas antes e depois da auditoria, e a busca por artefato de auditoria dentro do repositório volta vazia.</done>
</task>

<task id="4" type="auto">
<files>.plano/fases/19-auditoria-visual-escopada/006-SUMMARY.md</files>
<action>
Regressão dos sete comandos e das suites (REG-01).

1. Conferir que os sete arquivos de comando continuam existindo e com frontmatter valido (nome, descrição e lista de ferramentas). Os sete são: a porta única, planejamento, execução, teste, auditoria, depuração e a rota rapida.
2. Conferir que cada comando referência um workflow que existe no pacote. Cada referência de workflow apontando para arquivo inexistente e regressão.
3. Rodar as três suites do lado UP:
```bash
node up/bin/lib/github.test.cjs
node up/bin/lib/hotspots.test.cjs
node up/bin/lib/audit-report.test.cjs
```
4. Exercitar o despachante da CLI nos subcomandos que os workflows usam com mais frequência, conferindo que cada um devolve JSON e não erro: carregamento de estado, índice de planos da fase, situação do repositório, contexto, e os dois subcomandos novos desta fase.
5. Registrar o placar de tudo no SUMMARY.
</action>
<verify><automated>node -e "
const fs=require('fs');
const cmds=fs.readdirSync('up/commands').filter(f=>f.endsWith('.md'));
if(cmds.length!==7){console.error('esperava 7 comandos, achei',cmds.length,cmds);process.exit(1)}
for(const c of cmds){const t=fs.readFileSync('up/commands/'+c,'utf-8');
 if(!/^---[\s\S]*?name:/m.test(t)){console.error('frontmatter inválido em',c);process.exit(1)}
 const m=t.match(/workflows\/([a-z-]+)\.md/);
 if(m&&!fs.existsSync('up/workflows/'+m[1]+'.md')){console.error(c,'aponta para workflow inexistente:',m[1]);process.exit(1)}}
console.log('7 comandos OK, workflows resolvidos');
" && node up/bin/lib/github.test.cjs > /dev/null && node up/bin/lib/hotspots.test.cjs > /dev/null && node up/bin/lib/audit-report.test.cjs > /dev/null && node up/bin/up-tools.cjs state load > /dev/null && node up/bin/up-tools.cjs phase-plan-index 19 > /dev/null && echo "REG-01 OK"</automated></verify>
<done>Os sete comandos existem, todos apontam para workflow que existe, as três suites passam e o despachante responde nos subcomandos usados pelos workflows.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/19-auditoria-visual-escopada/006-SUMMARY.md</files>
<action>
Regressão dos quatro runtimes (REG-02) e de projeto com planejamento antigo (REG-03).

**Quatro runtimes.** Instalar num diretório de casa temporário, sem tocar na instalação real do dono:
```bash
FAKE_HOME=$(mktemp -d)
HOME="$FAKE_HOME" node up/bin/install.js --all --global
```
Conferir, no resultado, que os arquivos novos desta fase chegaram: o módulo de pontos quentes, o módulo do relatório, a reference do contrato de achado, o agente auditor reescrito e o workflow de auditoria reescrito. Conferir nos quatro alvos, cada um no seu diretório de configuração. Conferir também que as quatro skills de doutrina e os sete comandos continuam sendo emitidos, e que o bloco de bootstrap continua sendo injetado nos runtimes que dependem dele.

Regra de leitura do resultado: o instalador copia o diretório do pacote por recursao, então a expectativa e que nada precise ser alterado nele. Se algum arquivo novo NAO chegar, isso é defeito e o conserto e no instalador, com registro no SUMMARY.

**Projeto com planejamento antigo.** Montar um projeto de teste que imite planejamento anterior a este ciclo:
```bash
ANTIGO=$(mktemp -d); cd "$ANTIGO"; git init -q; mkdir -p .plano/fases/01-teste
```
Escrever um arquivo de estado, um roadmap em português com uma fase, uma configuração minima e um plano gravado na convenção antiga de nome. Fazer dois ou três commits. Depois:
1. Rodar o carregamento de estado, o índice de planos da fase e a operação de pontos quentes com o diretório apontado para esse projeto. Nenhum pode falhar nem exigir migração.
2. Conferir que a operação de pontos quentes devolve concentração falsa com motivo de janela curta, que é o comportamento correto para repositório novo, e não um erro.
3. Conferir que a auditoria não exige diretório de planejamento: rodar a operação de pontos quentes num repositório git sem planejamento nenhum e conferir que ela responde normalmente.
</action>
<verify><automated>FAKE_HOME=$(mktemp -d); HOME="$FAKE_HOME" node up/bin/install.js --all --global > /tmp/up-install-log.txt 2>&1 || { cat /tmp/up-install-log.txt; exit 1; }; for f in "$FAKE_HOME/.claude/up/bin/lib/hotspots.cjs" "$FAKE_HOME/.claude/up/bin/lib/audit-report.cjs" "$FAKE_HOME/.claude/up/references/audit-findings-contract.md" "$FAKE_HOME/.claude/up/agents/up-auditor.md" "$FAKE_HOME/.claude/up/workflows/auditar.md"; do test -f "$f" || { echo "FALTOU: $f"; exit 1; }; done; ANTIGO=$(mktemp -d); git -C "$ANTIGO" init -q; git -C "$ANTIGO" config user.email t@t.co; git -C "$ANTIGO" config user.name t; echo hello > "$ANTIGO/a.txt"; git -C "$ANTIGO" add -A; git -C "$ANTIGO" commit -qm init; node up/bin/up-tools.cjs hotspots --cwd "$ANTIGO" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);if(r.concentracao!==false||!r.motivo){console.error('esperava concentracao falsa com motivo em repo novo');process.exit(1)}console.log('REG-02 e REG-03 OK')})"</automated></verify>
<done>Os quatro runtimes recebem os arquivos novos sem alteração no instalador, as skills e os sete comandos continuam sendo emitidos, e projeto com planejamento antigo ou sem planejamento continua funcionando sem migração.</done>
</task>

<task id="6" type="auto">
<files>.plano/REQUIREMENTS.md</files>
<files>.plano/ROADMAP.md</files>
<action>
Fechar os artefatos da fase.

**Requisitos.** Marcar como concluidos os onze requisitos da categoria de auditoria, de AUD-01 a AUD-11, cada um com a evidência que o fecha citada em uma linha curta (qual teste, qual captura, qual verificação). Não marcar requisito sem evidência: requisito marcado sem prova e o teatro que este ciclo inteiro existe para acabar. Se algum dos onze não tiver sido fechado de verdade, deixar desmarcado e registrar no SUMMARY o que falta, sem maquiar.

Atenção aos dois que só fecham por observação de comportamento com o dono:
- O que exige que rejeição estrutural vire registro de decisão.
- O que exige que motivo efêmero não gere registro.
Se a execução da tarefa 1 terminou com escolha (e não com recusa), esses dois não foram exercitados de verdade. Nesse caso, exercitar de proposito: fazer uma rodada de recusa com motivo estrutural e uma com motivo efêmero, conferir que a primeira gera registro e a segunda não, e só então marcar. Se a operação de registro de decisão da fase 14 ainda não existir no repositório, marcar como pendente com a nota da degradação, e não como concluido.

**Roadmap.** No bloco da fase 19: marcar a caixa da lista de fases, atualizar a contagem de planos para 6 de 6, acrescentar as linhas de evidência (entrada do log de aprovações, número da issue e do PR quando houver, e o caminho absoluto da captura), acrescentar a data de conclusão, e registrar a decisão fechada da fase em uma linha: a janela padrão de concentração de mudança ficou em 50 commits, ajustável por flag. Atualizar também a tabela de progresso no fim do arquivo.

Commitar de forma atômica, separando o commit de requisitos do commit de roadmap.
</action>
<verify><automated>node -e "
const fs=require('fs');
const req=fs.readFileSync('.plano/REQUIREMENTS.md','utf-8');
const pend=[...req.matchAll(/- \[ \] (AUD-\d+)/g)].map(m=>m[1]);
console.log(pend.length? 'AUD ainda pendentes (justificar no SUMMARY): '+pend.join(', ') : 'todos os AUD marcados');
const road=fs.readFileSync('.plano/ROADMAP.md','utf-8');
if(!/6\/6|6 de 6/.test(road)){console.error('roadmap sem a contagem de planos da fase 19');process.exit(1)}
if(!/50 commits/.test(road)){console.error('roadmap sem a decisão da janela padrão');process.exit(1)}
console.log('roadmap OK');
"</automated></verify>
<done>Os requisitos de auditoria estão marcados com evidência (ou explicitamente pendentes com motivo), e o roadmap registra a fase como completa, com 6 de 6 planos, a evidência visual e a decisão da janela padrão de 50 commits.</done>
</task>

## Critério de aceite do plano

- [ ] Existe captura do relatório HTML aberto, com os seis itens obrigatórios conferidos um a um e descritos no resumo (AUD-03, AUD-04, AUD-06, AUD-07, AUD-09)
- [ ] O escopo da execução real saiu da concentração de mudança, sem ruído de lockfile, changelog ou planejamento (AUD-01, AUD-02)
- [ ] Estado e diff do repositório identicos antes e depois, e a busca por artefato de auditoria dentro do repositório volta vazia (AUD-05)
- [ ] O gate foi exercitado numa execução real: a apresentação terminou na pergunta e o passo seguinte só rodou depois da resposta (AUD-08)
- [ ] Os sete comandos existem, apontam para workflows que existem, e as três suites passam (REG-01)
- [ ] Os quatro runtimes recebem os arquivos novos sem alteração no instalador (REG-02)
- [ ] Projeto com planejamento antigo e repositório sem planejamento continuam funcionando sem migração (REG-03)
- [ ] Requisitos e roadmap fechados com evidência, sem marcar o que não foi provado (6 de 6 planos)

## Tipo de prova

**Visual.** E a prova exigida pela fase no roadmap. A captura de tela do relatório aberto é a evidência primária, e ela entra no log de aprovações como evidência do tipo visual. As regressoes ao redor são smoke, e servem de cerca: elas não provam a fase, provam que ela não quebrou o resto.

Regra de honestidade da prova, que vale para este plano inteiro: se a captura não mostrar um dos seis itens, a fase não passa. Descrever em texto o que a imagem deveria ter mostrado não substitui a imagem.

## Fora de escopo

- Não corrigir código aqui. Defeito encontrado volta ao plano que entregou aquele código.
- Não versionar a captura nem o relatório dentro do repositório. Os dois são efemeros por desenho, e o que sobrevive e a descrição e a entrada no log de aprovações.
- Não criar suite de teste visual automatizada, nem comparação de imagem entre versões. Este relatório nasce agora e não tem linha de base para comparar.
- Não auditar os outros seis comandos do sistema, nem estender a auditoria escopada para eles. A fase entrega o comando de auditoria, e nada além dele.
- Não publicar versão nova no registro de pacotes. Publicação e decisão do dono, fora do escopo da fase.
- Não mexer nos requisitos de outras fases do ciclo, mesmo que a execução encoste neles.
</content>
