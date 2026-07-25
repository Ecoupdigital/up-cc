---
phase: 19-auditoria-visual-escopada
plan: 19-003
type: refactor
autonomous: true
wave: 1
depends_on: [19-001]
requirements: [AUD-01, AUD-02, AUD-06, AUD-07, AUD-09, AUD-05]
prova: smoke
must_haves:
  truths:
    - "O auditor escolhe onde aprofundar a partir da concentração de mudança recente, e quando não há concentração ele alarga a rede e declara isso no próprio payload"
    - "Todo achado candidato passa pelo teste falsificador antes de virar card, e o número de descartados e contado e declarado"
    - "O auditor emite o payload no contrato, com badge ternário e recomendação principal nomeando um único achado"
    - "O auditor não escreve nada dentro do repositório: o payload sai no diretório temporário do sistema"
  artifacts:
    - path: "up/agents/up-auditor.md"
      provides: "Agente auditor escopado, com teste falsificador, badge ternário, recomendação principal e proibição de projetar solução"
  key_links:
    - from: "up/agents/up-auditor.md"
      to: "subcomando hotspots da CLI de ferramentas"
      via: "primeiro passo do processo do agente, antes de qualquer leitura de arquivo"
    - from: "up/agents/up-auditor.md"
      to: "up/references/audit-findings-contract.md"
      via: "carregamento obrigatório de contexto e formato exato do payload emitido"
---

# Fase 19 Plano 003: Agente auditor escopado

**Objetivo:** Reescrever o agente auditor para que ele pare de varrer o repositório inteiro despejando lista plana, e passe a fazer o oposto: escolher onde aprofundar a partir de onde a mudança continua caindo, matar candidato genérico com um teste falsificador explícito, e entregar um payload no contrato, com força declarada por achado e uma recomendação principal com motivo.

**Onda:** 1. Depende do plano 001, que entrega o subcomando de pontos quentes e a reference do contrato. Roda em paralelo com o plano 002, que escreve o validador e o renderizador do mesmo contrato. Os dois planos programam contra a mesma especificação escrita, por isso podem correr juntos.

## O que muda em relação ao agente de hoje

| Hoje | Depois desta fase |
|------|-------------------|
| Descobre todos os arquivos do repositório e analisa tudo | Descobre a concentração de mudança e aprofunda ali. Sem concentração, alarga a rede e declara |
| Emite sugestão com arquivo, linha, dimensao, esforço e impacto | Emite achado com arquivos, problema em uma frase, solução em uma frase, ganhos, força e falsificador |
| Publica tudo que encontra | Publica só o que sobrevive ao teste falsificador, e conta quantos morreram nele |
| Não se compromete com prioridade | Nomeia uma recomendação principal com motivo |
| Escreve arquivos markdown dentro do diretório de planejamento | Escreve o payload no diretório temporário do sistema, e nada no repositório |
| Sugere a solução com exemplo de código quando possível | Solução é uma frase. Projetar acontece depois do gate de handoff, noutra rodada |

O mapa de cobertura obrigatório do ciclo anterior não desaparece, ele encolhe para caber no escopo: o payload declara quantos arquivos foram lidos, e o retorno textual do agente lista quais foram. A promessa continua sendo "nada de número sem lastro", só que agora sobre o recorte escolhido em vez de sobre o repositório inteiro.

## Contexto

@up/agents/up-auditor.md - o agente atual, que este plano reescreve. Preservar o que continua valendo: passe único nas três dimensoes, detecção de stack, descarte de falso positivo por leitura de contexto, proibição de instalar dependência, proibição de ler ou citar conteúdo de arquivo de credencial.
@up/references/audit-findings-contract.md - contrato entregue pelo plano 001. É a fonte do formato do payload, dos critérios do badge ternário e das duas perguntas do teste falsificador. O agente carrega esta reference sempre.
@up/references/audit-ux.md, @up/references/audit-performance.md, @up/references/audit-modernidade.md - catalogos por dimensao, carregados sob demanda. O de modernidade e grande, então carregar com deslocamento e limite quando necessário.
@.plano/SYSTEM-DESIGN.md - a seção 7 lista a auditoria como superfície interativa, e a seção 6 registra que o auditor não escreve dentro do repositório.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato público que ele passa a oferecer |
|---------|-------------------------------------------|
| `up/agents/up-auditor.md` (reescrito) | Agente que, dado um repositório, devolve o caminho de um payload de auditoria valido no contrato e um resumo textual com o escopo, a contagem de publicados e a de descartados. Não escreve dentro do repositório, não projeta solução, não decide o que será feito |

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Reescrever o frontmatter e o bloco `<role>`.

Frontmatter, mantendo o padrão de agente do repositório (`tools` como string separada por vírgula, `color` como nome simples):

```yaml
---
name: up-auditor
description: Auditoria escopada por concentração de mudança. Passe único em UX, performance e modernidade, com teste falsificador e badge de força. Use no /up:auditar. Diagnostica e para: não projeta solução.
tools: Read, Write, Bash, Grep, Glob
model: sonnet
color: magenta
---
```

Bloco `<role>` com estes pontos, em português com acentuação:

1. Você e o Auditor UP. Você diagnostica num passe único cobrindo UX, performance e modernidade.
2. Você trabalha por leitura de código. Você não ve a interface renderizada, não roda benchmark, não executa profiling e não modifica código.
3. **Você escopa antes de varrer.** Aprofundar módulo só paga onde a mudança continua caindo. O escopo vem da concentração de mudança recente, e não da sua curiosidade.
4. **Você publica pouco.** Todo candidato passa por um teste de eliminação antes de virar card. Lista genérica e o fracasso desta função, não o produto dela.
5. **Você diagnostica e para.** A solução que você escreve tem uma frase. Projetar a solução acontece depois, noutra rodada, depois que o dono escolher. Emendar diagnostico com design e violação dura.
6. **Você não escreve dentro do repositório.** Sua única escrita e o payload no diretório temporário do sistema. A árvore de trabalho e o diff do dono continuam limpos depois de você passar.
7. Leitura inicial obrigatória: se o prompt trouxer bloco de arquivos a ler, carregar todos antes de qualquer ação.

Substituir o bloco `<context_loading>` para incluir, como carregamento sempre obrigatório, a reference do contrato de achado, e manter as três references de dimensao como carregamento sob demanda. Remover a linha que manda carregar o template de sugestão do ciclo anterior, porque o formato agora e o do contrato.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const req=['audit-findings-contract','concentração de mudança','diagnostica e para','não escreve dentro do repositório'];const f=req.filter(s=>!t.toLowerCase().includes(s.toLowerCase()));if(f.length){console.error('faltando no role:',f);process.exit(1)}console.log('role OK')"</automated></verify>
<done>Frontmatter atualizado e bloco de papel declarando escopo antes da varredura, publicação enxuta, gate entre diagnosticar e projetar e proibição de escrita no repositório.</done>
</task>

<task id="2" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Substituir os passos 1 e 2 do processo (detecção de stack e descoberta de arquivos) por um passo de escopo que vem ANTES de tudo.

Novo `<step name="escopo">`, Passo 1:

1. Rodar a operação de pontos quentes da CLI de ferramentas:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" hotspots --commits ${COMMITS:-50} --limite 20
```
   A janela padrão e 50 commits. Se o prompt trouxer outro número, usar o do prompt.
2. Ler a resposta. Dois caminhos, e apenas dois:
   - **`concentracao` verdadeira:** o escopo é a lista de pontos quentes mais a vizinhança imediata de cada um (o que cada arquivo quente importa e quem o importa, descoberto por busca textual). Aprofundar ali. Registrar `rede_alargada: false`.
   - **`concentracao` falsa:** alargar a rede. Varrer o repositório como o agente antigo fazia, com as exclusões de sempre. Registrar `rede_alargada: true` e copiar para `motivo_alargamento` o motivo devolvido pela operação, em uma frase legível pelo dono. Esta declaração é obrigatória e vai aparecer no cabecalho do relatório.
3. Detectar a stack uma única vez, como o agente já faz hoje (framework de componente, framework de CSS, biblioteca de interface, biblioteca de formulário, camada de banco, versão de Node e TypeScript, ferramenta de build e de teste). A stack define quais categorias são relevantes e quais viram falso positivo.
4. Anunciar o escopo antes de ler qualquer arquivo, em três linhas: janela usada, se houve concentração, e quantos arquivos entraram no recorte.

Regra dura a escrever no passo: **nunca inventar ponto quente.** Se a operação devolver lista vazia, o caminho e alargar a rede e declarar, nunca escolher arquivo por intuição e chamar de quente.

Regra de degradação: se a operação de pontos quentes falhar (repositório sem git, comando indisponível), tratar como concentração falsa, com `motivo_alargamento` dizendo que o sinal de concentração não estava disponível. A auditoria não pode morrer por falta do sinal de escopo.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const req=['hotspots','rede_alargada','motivo_alargamento','nunca inventar ponto quente'];const f=req.filter(s=>!t.toLowerCase().includes(s.toLowerCase()));if(f.length){console.error('faltando no passo de escopo:',f);process.exit(1)}console.log('escopo OK')"</automated></verify>
<done>O passo de escopo existe, roda a operação de pontos quentes antes de qualquer leitura, tem os dois caminhos declarados, a regra de degradação e a proibição de inventar ponto quente.</done>
</task>

<task id="3" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Reescrever o passo de análise sistematica para operar dentro do escopo.

Manter: passe único cobrindo as três dimensoes, categorias vindas das references, leitura de 5 a 10 linhas de contexto antes de criar candidato, descarte de falso positivo (a stack já resolve, o tratamento existe noutro lugar, e teste ou fixture, e código gerado, e padrão documentado nas convenções do projeto).

Mudar:
- A ordem de leitura passa a ser a ordem do ranking de pontos quentes. O arquivo mais tocado e lido primeiro, porque e onde a mudança continua caindo e portanto onde o achado tem mais chance de pagar.
- A regra anti duplicação entre dimensoes continua, agora expressa no contrato novo: um achado que cabe em duas dimensoes vira um achado só, e a segunda dimensao aparece dentro do texto do problema, não como card repetido.
- Some o teto por bloco de código e entra um teto por relatório: **no máximo 7 achados publicados**. Não é limite de qualidade, é limite de atenção. Se sobrarem mais de 7 candidatos vivos depois do falsificador, publicar os 7 de maior força e citar no retorno textual quantos ficaram de fora.
- Cada candidato nasce com os campos do contrato já preenchidos, e não como texto livre depois convertido. Isso evita o achado que só vira card no fim e chega sem falsificador.

Escrever também a regra de leitura de credencial, preservada do agente atual: nunca ler nem citar conteúdo de arquivo de ambiente, de credencial, de chave ou de certificado. Anotar apenas a existência.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const req=['máximo 7 achados','ordem do ranking','credencial'];const f=req.filter(s=>!t.toLowerCase().includes(s.toLowerCase()));if(f.length){console.error('faltando na analise:',f);process.exit(1)}console.log('analise OK')"</automated></verify>
<done>O passo de análise le na ordem do ranking, mantem o passe único nas três dimensoes, tem teto de 7 achados publicados por relatório e preserva a regra de credencial.</done>
</task>

<task id="4" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Criar o passo do teste falsificador, que é o coração desta fase. Ele roda DEPOIS da análise e ANTES da emissao.

Texto obrigatório do passo:

Para cada candidato, responder as duas perguntas, nesta ordem, por escrito:

1. Corrigir isto concentra complexidade num lugar só, ou seja, diminui o número de lugares que precisam mudar quando o mesmo requisito voltar?
2. Corrigir isto move alguma métrica declarável: arquivos tocados por mudança tipica, bytes entregues, número de chamadas, tempo de execução da suite, número de caminhos condicionais?

Se as duas respostas forem não, o candidato e **descartado**. Incrementar o contador de descartados. Ele não vira card, não aparece em nota de rodape e não volta como observação. Descartado é descartado.

Se pelo menos uma for sim, o candidato sobrevive e a resposta que o salvou vira o campo `falsificador` do card, em uma frase, nomeando qual concentração ou qual métrica. Frase genérica do tipo "melhora a manutenibilidade", "deixa o código mais limpo" ou "facilita a evolução" não é resposta, não salva candidato, e o candidato que só tiver isso é descartado.

Exemplos escritos lado a lado no próprio agente, um bom e um ruim, no mesmo cenário:
- Ruim: `falsificador: "melhora a organização do código"`. Não nomeia concentração nem métrica, então o achado não deveria ter sido publicado.
- Bom: `falsificador: "concentra a decisao de rota que hoje existe em dois arquivos, entao passa de dois lugares para um quando a rota muda"`. Nomeia a concentração e conta os lugares.

Depois de rodar o teste em todos os candidatos, atribuir o badge de força a cada sobrevivente, usando os três critérios exatos da reference do contrato (`Forte`, `Vale explorar`, `Especulativo`), com o teto de um `Especulativo` por relatório.

Por fim, escolher a **recomendação principal**: um único achado, com o motivo em uma frase. Critério de desempate quando dois parecem iguais: vence o que está dentro dos pontos quentes do escopo. Se nenhum estiver, vence o de maior força. Não e permitido devolver empate, nem escolher dois, nem dizer "depende".
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const req=['concentra complexidade','métrica declarável','descartado','melhora a manutenibilidade','recomendação principal','Especulativo'];const f=req.filter(s=>!t.toLowerCase().includes(s.toLowerCase()));if(f.length){console.error('faltando no falsificador:',f);process.exit(1)}console.log('falsificador OK')"</automated></verify>
<done>O passo do falsificador existe com as duas perguntas na integra, a regra de descarte com contador, o par de exemplos bom e ruim no mesmo cenário, os critérios do badge e a escolha obrigatória de uma única recomendação principal.</done>
</task>

<task id="5" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Reescrever o passo de saída. O agente para de escrever markdown dentro do diretório de planejamento e passa a emitir o payload do contrato no diretório temporário do sistema.

Passo de emissao:

1. Montar o objeto exatamente no formato da reference do contrato, com `projeto`, `gerado_em`, `escopo` (janela, concentração, rede alargada, motivo do alargamento, pontos quentes e arquivos lidos), `recomendacao_principal`, `descartados_por_falsificador` e `achados`.
2. Numerar os achados com `AC-001`, `AC-002` e assim por diante, na ordem de publicação.
3. Gravar com a ferramenta de escrita (nunca por heredoc no shell) em um caminho dentro do diretório temporário do sistema. Descobrir o diretório com:
```bash
node -e "console.log(require('os').tmpdir())"
```
   Nome do arquivo: `up-auditoria-payload-<carimbo ISO com dois pontos trocados por traco>.json`.
4. Proibição dura: não escrever nada dentro do repositório. Nada em diretório de planejamento, nada de arquivo temporário na raiz, nada de rascunho. Ao terminar, `git status --porcelain` no repositório auditado tem de continuar como estava antes.
5. Retornar ao orquestrador, em texto, neste formato:

```markdown
## AUDITORIA ESCOPADA COMPLETA

**Escopo:** janela de {N} commits, concentração {sim|não}{, rede alargada por {motivo}}
**Pontos quentes usados:** {lista curta ou "nenhum"}
**Arquivos lidos:** {N} ({lista})
**Achados publicados:** {N}
**Descartados pelo falsificador:** {N}
**Recomendação principal:** {AC-NNN} - {título}
**Payload:** {caminho absoluto do JSON}
```

A lista de arquivos lidos vive aqui, no retorno textual, e não dentro do payload. É o que resta da promessa de cobertura do ciclo anterior, adaptada ao escopo: o número aparece no relatório, a lista aparece para quem orquestra.

6. Se o payload for recusado pelo renderizador (o orquestrador devolve a lista de erros), corrigir os campos apontados e reemitir. Não argumentar com o validador, não contornar o contrato, não publicar card sem falsificador.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const req=['AUDITORIA ESCOPADA COMPLETA','tmpdir','git status --porcelain','AC-001'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando na saida:',f);process.exit(1)}console.log('saida OK')"</automated></verify>
<done>O passo de saída emite o payload no diretório temporário, numera os achados, proibe qualquer escrita no repositório e define o formato exato do retorno textual ao orquestrador.</done>
</task>

<task id="6" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Reescrever os blocos `<critical_rules>` e `<success_criteria>` finais.

Regras criticas, a lista completa (as antigas que continuam valendo mais as novas):

1. Escopar antes de varrer. Sem concentração, alargar a rede e declarar. Nunca inventar ponto quente.
2. Todo achado passa pelo teste falsificador. Achado sem resposta que nomeie concentração ou métrica não é publicado.
3. Contar e declarar os descartados. Contagem zero só e aceitável se nenhum candidato tiver morrido de verdade.
4. Card no formato do contrato, sempre: arquivos, problema em uma frase, solução em uma frase, ganhos em bullets curtos, badge de força e falsificador.
5. Uma recomendação principal, com motivo. Sem empate e sem "depende".
6. **Diagnosticar e parar.** Proibido escrever plano de implementação, passo a passo de correção ou trecho de código de solução. Quem projeta e a rodada seguinte, depois que o dono escolher.
7. Somente leitura no repositório. Nunca instalar dependência, nunca atualizar pacote, nunca modificar arquivo do projeto auditado.
8. Nenhuma escrita dentro do repositório. A única escrita e o payload no diretório temporário.
9. Nunca ler nem citar conteúdo de arquivo de ambiente, credencial, chave ou certificado. Anotar apenas a existência.
10. Passe único nas três dimensoes. Não spawnar subagente.
11. Teto de 7 achados publicados e de um `Especulativo` por relatório.
12. Texto em português brasileiro com acentuação. Zero travessao. Tags estruturais e nomes de campo em inglês quando já são assim no restante do sistema.

Critérios de sucesso, em caixas de checagem, cobrindo: escopo declarado, stack detectada, references carregadas sob demanda, falsificador aplicado com contagem, badge atribuido, recomendação principal escolhida, payload valido gravado fora do repositório, árvore de trabalho intacta, retorno textual no formato acima.

Apagar do arquivo todo resto do ciclo anterior que ficou órfão: referência ao template de sugestão, formato de sugestão com esforço e impacto, classificação em quadrantes, escrita em arquivo de melhorias, menção ao sintetizador recebendo o arquivo. Se o passe único ainda citar essas peças, a reescrita não terminou.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const orfaos=['suggestion.md','Quick Wins','auditoria-sugestoes.md','.plano/melhorias'];const p=orfaos.filter(s=>t.includes(s));if(p.length){console.error('sedimento do ciclo anterior ainda presente:',p);process.exit(1)}if(/\u2014|\u2013/.test(t)){console.error('travessao encontrado');process.exit(1)}console.log('limpeza OK')"</automated></verify>
<done>As regras criticas e os critérios de sucesso estão reescritos, e nenhuma referência ao formato de sugestão, aos quadrantes ou ao arquivo de melhorias do ciclo anterior sobrou no agente. Zero travessao no arquivo.</done>
</task>

<task id="7" type="auto">
<files>up/agents/up-auditor.md</files>
<action>
Checagem estrutural final e smoke manual do contrato.

1. Rodar a verificação estrutural completa: o arquivo tem os seis blocos (`<role>`, `<context_loading>`, `<process>` com os passos de escopo, análise, falsificador e saída, `<output_format>`, `<critical_rules>`, `<success_criteria>`).
2. Escrever a mao, a partir da leitura do próprio agente, um payload de exemplo com dois achados, e valida-lo pelo validador entregue no plano 002:
```bash
printf '%s' "$PAYLOAD" | node up/bin/up-tools.cjs audit-report render --sem-abrir
```
   Se o plano 002 ainda não tiver aterrissado no momento da execução (planos da mesma onda), validar apenas contra a reference do contrato, por leitura, e registrar no SUMMARY que a validação executável ficou para a integração do plano 004. Não bloquear por isso.
3. Conferir que o arquivo do agente continua abaixo de 300 linhas. Agente que cresce vira documento que ninguém le inteiro, e o contexto dele e pago em toda invocação.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/agents/up-auditor.md','utf-8');const blocos=['<role>','<context_loading>','<process>','<output_format>','<critical_rules>','<success_criteria>'];const f=blocos.filter(b=>!t.includes(b));if(f.length){console.error('blocos faltando:',f);process.exit(1)}const n=t.split('\n').length;if(n>300){console.error('agente com',n,'linhas, teto de 300');process.exit(1)}console.log('estrutura OK,',n,'linhas')"</automated></verify>
<done>O agente tem os seis blocos estruturais, cabe em 300 linhas, e um payload de exemplo escrito a partir dele bate com o contrato.</done>
</task>

## Critério de aceite do plano

- [ ] O primeiro passo do agente e a operação de pontos quentes, e nenhuma leitura de arquivo acontece antes dela (AUD-01)
- [ ] Existem exatamente dois caminhos de escopo: aprofundar na concentração, ou alargar a rede declarando o motivo (AUD-02)
- [ ] O passo do falsificador traz as duas perguntas na integra, a regra de descarte, o contador e o par de exemplos bom e ruim (AUD-09)
- [ ] O payload emitido tem card no formato fixo com badge ternário (AUD-06) e recomendação principal com motivo (AUD-07)
- [ ] O agente declara que não escreve nada dentro do repositório e que a árvore continua limpa (AUD-05)
- [ ] Nenhuma referência ao formato de sugestão, aos quadrantes de esforço e impacto ou ao arquivo de melhorias do ciclo anterior sobrou no arquivo
- [ ] Zero travessao no arquivo, texto em português acentuado

## Tipo de prova

**Smoke, por verificação estrutural automatizada.** Este plano entrega prompt, e prompt não tem teste unitário honesto: um teste que só procura substring no próprio texto que acabou de ser escrito e tautológico. Por isso a prova aqui e dupla e declarada como tal:
1. Verificação estrutural automatizada, que garante presenca dos blocos, ausência do sedimento do ciclo anterior e teto de tamanho. Ela pega regressão de edição, e não qualidade de diagnostico.
2. A prova real do comportamento e a execução ponta a ponta com captura visual, entregue no plano 006. Este plano não reivindica ter provado que o auditor diagnostica bem, apenas que ele está escrito no contrato.

## Fora de escopo

- Não mexer no workflow nem no comando de auditoria. São do plano 004.
- Não tocar nas três references de dimensao (UX, performance e modernidade). Os catalogos continuam como estão, e só o modo de usa-los muda.
- Não criar agente novo, não dividir o auditor por dimensao. A fusao em passe único e do ciclo anterior e continua valendo.
- Não implementar a rejeição virando registro de decisão. Quem trata a resposta do dono e o workflow, no plano 004.
- Não pesquisar mercado, não sugerir feature nova, não pontuar por impacto e confianca. A auditoria desta fase diagnostica o que existe.
- Não remover o agente sintetizador nem o caminho com pesquisa de mercado do comando. Se a integração entre auditor e sintetizador precisar mudar, a decisão é do plano 004.
</content>
