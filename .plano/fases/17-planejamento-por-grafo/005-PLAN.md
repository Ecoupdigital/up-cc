---
phase: 17-planejamento-por-grafo
plan: "005"
type: chore
wave: 3
depends_on: ["002", "004"]
autonomous: true
plan_schema: 2
requirements: [REG-01, REG-02, REG-03]
files_modified:
  - .plano/ROADMAP.md
  - .plano/STATE.md
  - .plano/governance/approvals.log
  - .plano/fases/17-planejamento-por-grafo/evidencia/005-comandos.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/005-projeto-antigo.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/005-suite.txt
prova: "glue:smoke (regressão de comandos, runtimes e projeto antigo) mais logic:test_pass na passada consolidada"
must_haves:
  truths:
    - "O verbete de onda do glossário interno confere com o comportamento entregue, ou a divergência está registrada e fechada"
    - "Os sete comandos continuam funcionando ao fim da fase"
    - "Os quatro runtimes suportados continuam instalando e operando ao fim da fase"
    - "Projeto com planejamento anterior a este ciclo continua funcionando, sem migração"
    - "A suíte de testes do lado UP roda inteira e verde numa única passada"
  artifacts:
    - path: ".plano/fases/17-planejamento-por-grafo/evidencia/"
      provides: "Saída real de cada conferência de regressão, gravada como evidência da fase"
    - path: ".plano/ROADMAP.md"
      provides: "Fase 17 fechada, com contagem de planos e data"
  key_links:
    - from: ".plano/governance/approvals.log"
      to: ".plano/ROADMAP.md"
      via: "entrada de veredito da fase 17 no formato de seis colunas, com a evidência do tipo exigido"
    - from: "up/bin/install.js"
      to: "up/commands/"
      via: "instalação real nos quatro runtimes, em diretório de configuração temporário"
---

# Fase 17 Plano 005: Fechamento, verbete de onda e regressão zero

<objective>
Fechar a fase com prova de que nada regrediu e com a janela entre esta fase e a fase 14 fechada. A fase 14 escreve o verbete de onda na forma derivada, e esta fase confirma que o comportamento entregue é aquele.
</objective>

**Onda:** 3. **Depende de:** planos 002 e 004 desta fase. A conferência do verbete depende do comportamento de fronteira entregue no 002, e a conferência dos planos contra a própria regra depende da checagem entregue no 004. O 003 entra por transitividade, porque bloqueia o 004.
**Tipo de prova:** smoke para comandos, runtimes e projeto antigo; lógica para a passada consolidada dos testes; conferência documental para o verbete e para o registro de fechamento.

**Nota sobre a regra que esta fase entrega:** os caminhos aparecem nos campos `<files>` porque o executor depende deles como trava de escopo. O corpo das tarefas descreve contrato de comportamento.

## Contexto

@.plano/ROADMAP.md - bloco da fase 17 e grafo de bloqueio do ciclo
@.plano/REQUIREMENTS.md - categoria de planejamento por grafo e categoria de regressão zero
@.plano/SYSTEM-DESIGN.md - seção 11, riscos de contrato e decisões de compatibilidade
@up/bin/install.js - instalador multi runtime, alvo de execução e não de edição

## Tarefas

<task id="1" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-verbete.txt (novo)</files>
<action>
Conferir o verbete de onda do glossário interno contra o comportamento de fronteira entregue no plano 002. Três saídas possíveis, e exatamente uma delas é registrada:

1. **Glossário existe e o verbete confere.** Registrar a conferência citando a frase do verbete e o comportamento correspondente. Nada é editado.
2. **Glossário existe e o verbete diverge.** Corrigir apenas o verbete de onda, no máximo duas frases, para descrever a onda como visão derivada da dependência declarada. Nenhum outro verbete é tocado. Registrar como fechamento da janela entre as duas fases.
3. **Glossário ainda não existe**, porque a fase 14 ainda não fechou. Registrar a pendência no arquivo de evidência e no documento de estado, com a frase que o verbete precisa conter, e não criar o glossário aqui. Criar artefato de outra fase quebraria a matriz de escrita por artefato, que existe para impedir dois donos escrevendo o mesmo arquivo com semânticas diferentes.

A saída 3 não bloqueia o fechamento da fase, porque as fases 14 e 17 são irmãs independentes no grafo do ciclo.
</action>
<verify><automated>mkdir -p .plano/fases/17-planejamento-por-grafo/evidencia; { ls up/references/ | grep -i glossar || echo "glossario ausente: pendencia registrada"; } > .plano/fases/17-planejamento-por-grafo/evidencia/005-verbete.txt 2>&1; test -s .plano/fases/17-planejamento-por-grafo/evidencia/005-verbete.txt && echo "verbete conferido"</automated></verify>
<done>Uma das três saídas está registrada com evidência, e a fase não ficou bloqueada pela ausência do artefato da fase irmã.</done>
</task>

<task id="2" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-comandos.txt (novo)</files>
<action>
Conferir a integridade dos sete comandos.

Por comando: o frontmatter continua válido, e a referência ao workflow correspondente resolve para arquivo existente. Nos dois fluxos que esta fase alterou, o de planejamento e o de execução de fase, nenhum passo ou gate que existia antes foi removido: a guarda de artefatos por rodada, a verificação da fase, a revisão, o gate visual antes do merge e o menu de fechamento continuam presentes.

Referência quebrada por alteração desta fase é regressão desta fase, e é corrigida aqui.
</action>
<verify><automated>{ ls up/commands/*.md | wc -l; for c in up/commands/*.md; do w=$(grep -oE "workflows/[a-z-]+\.md" $c | head -1); test -f "up/$w" && echo "ok $c -> $w" || echo "QUEBRADO $c"; done; grep -c "GATE" up/workflows/build.md; } > .plano/fases/17-planejamento-por-grafo/evidencia/005-comandos.txt 2>&1; test $(grep -c "QUEBRADO" .plano/fases/17-planejamento-por-grafo/evidencia/005-comandos.txt) -eq 0 && echo "comandos ok"</automated></verify>
<done>Os sete comandos resolvem para workflow existente, nenhum gate sumiu dos dois fluxos alterados, e a evidência está gravada.</done>
</task>

<task id="3" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt (novo)</files>
<action>
Rodar a instalação real para os quatro runtimes suportados, em diretório de configuração temporário, sem tocar a configuração real da máquina.

Conferir, por runtime: os sete comandos foram emitidos no formato daquele runtime; as quatro skills de doutrina continuam presentes; e o bloco de arranque continua sendo injetado onde o runtime não tem gancho nativo. Conferir também que a instalação para o runtime nativo continua emitindo os comandos como skills invocáveis, que foi o que a fase 11 entregou.

Nenhuma bandeira nova e nenhum alvo novo de instalação podem aparecer.
</action>
<verify><automated>D=$(mktemp -d); for r in claude gemini opencode codex; do HOME=$D node up/bin/install.js --$r --global >> .plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt 2>&1 || echo "FALHOU $r" >> .plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt; done; find $D -name "*.md" | wc -l >> .plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt; test $(grep -c "FALHOU" .plano/fases/17-planejamento-por-grafo/evidencia/005-runtimes.txt) -eq 0 && rm -rf $D && echo "runtimes ok"</automated></verify>
<done>Os quatro runtimes instalam em diretório temporário, emitem comandos e skills, e a evidência está gravada. A configuração real da máquina não foi tocada.</done>
</task>

<task id="4" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-projeto-antigo.txt (novo)</files>
<action>
Conferir que projeto anterior a este ciclo continua funcionando, sem migração.

1. Sobre as fases já gravadas neste repositório: inventário, índice, progresso e status devolvem resposta coerente com o disco, e a ordem derivada é a mesma de antes desta fase.
2. Sobre um diretório de planejamento sintético, criado em diretório temporário e gravado no formato anterior ao ciclo, sem dependência declarada, sem seção de fora de escopo, sem linha de estimativa e com caminho de arquivo no corpo do plano: a leitura funciona, a ordem sai pela onda numerada, e as três ausências mais o caminho produzem aviso e nenhuma reprovação.
3. Nenhuma migração é executada, e nenhum arquivo de projeto antigo é renomeado ou reescrito.
</action>
<verify><automated>D=$(mktemp -d); mkdir -p $D/.plano/fases/01-legado; printf -- "---\nphase: 01-legado\nplan: 01-001\nwave: 1\n---\n# Legado\n### 1. editar o modulo\neditar src/a.ts conforme o padrao antigo\n" > $D/.plano/fases/01-legado/001-PLAN.md; node up/bin/up-tools.cjs validate-plan $D/.plano/fases/01-legado/001-PLAN.md > .plano/fases/17-planejamento-por-grafo/evidencia/005-projeto-antigo.txt 2>&1; node up/bin/up-tools.cjs phase-plan-index 1 --cwd $D >> .plano/fases/17-planejamento-por-grafo/evidencia/005-projeto-antigo.txt 2>&1; grep -q "PASS" .plano/fases/17-planejamento-por-grafo/evidencia/005-projeto-antigo.txt && test -z "$(git status --porcelain .plano/fases/03-templates-formatos-padrao .plano/fases/09-comando-ideias .plano/fases/11-suporte-grok-build)" && rm -rf $D && echo "projeto antigo ok"</automated></verify>
<done>Plano anterior ao ciclo passa com aviso e sem reprovação, a ordem sai pela onda numerada, e nenhum arquivo de fase antiga foi tocado.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-suite.txt (novo)</files>
<action>
Rodar a suíte do lado UP inteira numa única passada e gravar a saída: o teste da biblioteca de planos, o do módulo de checagem e o teste já existente da biblioteca de integração com repositório.

Se o corredor de testes do lado UP criado pela fase 16 já existir, usar ele. Se ainda não existir, invocar os três arquivos diretamente, na ordem, somando os códigos de saída. Nenhum teste depende de rede, e cada um cria e apaga o próprio estado temporário.
</action>
<verify><automated>{ node up/bin/lib/plans.test.cjs; node up/bin/lib/plan-checks.test.cjs; node up/bin/lib/github.test.cjs; } > .plano/fases/17-planejamento-por-grafo/evidencia/005-suite.txt 2>&1; test $(grep -c "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/005-suite.txt) -eq 3 && echo "suite ok"</automated></verify>
<done>Os três arquivos de teste saem verdes na mesma passada, e a contagem total de casos está gravada.</done>
</task>

<task id="6" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/005-escrita.txt (novo)</files>
<action>
Autoaplicação final e conferência de escrita.

1. A validação de plano roda sobre os cinco planos desta fase e sobre os resumos gerados, e todos passam nas regras entregues nos planos 003 e 004.
2. Os artefatos escritos nesta fase respeitam as regras de escrita do projeto: português acentuado e nenhuma ocorrência de travessão longo ou médio.

Qualquer ocorrência é corrigida antes de fechar esta tarefa.
</action>
<verify><automated>{ for f in .plano/fases/17-planejamento-por-grafo/*.md; do node up/bin/up-tools.cjs validate-plan "$f" --raw; echo; done; node -e "const fs=require('fs');const alvos=fs.readdirSync('.plano/fases/17-planejamento-por-grafo').filter(n=>n.endsWith('.md')).map(n=>'.plano/fases/17-planejamento-por-grafo/'+n).concat(['up/bin/lib/plans.cjs','up/bin/lib/plan-checks.cjs']);let n=0;for(const a of alvos){let t='';try{t=fs.readFileSync(a,'utf-8')}catch{continue}if(/[\u2014\u2013]/.test(t)){console.log('travessao em '+a);n++}}console.log(n===0?'sem travessao':'travessao encontrado')"; } > .plano/fases/17-planejamento-por-grafo/evidencia/005-escrita.txt 2>&1; grep -q "sem travessao" .plano/fases/17-planejamento-por-grafo/evidencia/005-escrita.txt && test $(grep -c "FAIL" .plano/fases/17-planejamento-por-grafo/evidencia/005-escrita.txt) -eq 0 && echo "escrita ok"</automated></verify>
<done>Os planos e resumos da fase passam nas próprias regras, e nenhum artefato da fase contém travessão longo ou médio.</done>
</task>

<task id="7" type="auto">
<files>.plano/governance/approvals.log (editar), .plano/ROADMAP.md (editar), .plano/STATE.md (editar)</files>
<action>
Registrar o fechamento da fase.

1. Entrada no log de aprovações, no formato documentado de seis colunas emitido pelo escritor oficial, com o escopo da fase e a evidência do tipo exigido, que é lógica com vermelho e verde. Não escrever à mão em formato divergente: foi assim que as fases 11 e 12 criaram o problema de leitura que a fase 16 está consertando.
2. Roadmap: fase 17 marcada como concluída, com a contagem de planos e a data, e a linha correspondente da tabela de progresso.
3. Documento de estado: posição nova, decisões registradas nos planos desta fase e próximo comando sugerido.
4. Pendências que saem desta fase, uma linha cada: a conferência do verbete quando ela caiu na saída 3 da tarefa 1, e o passe de corte de sedimento nos templates.
</action>
<verify><automated>grep -q "fase=17\|phase-17" .plano/governance/approvals.log && grep -q "Fase 17" .plano/ROADMAP.md && grep -qi "17" .plano/STATE.md && echo "fechamento ok"</automated></verify>
<done>O log tem a entrada da fase no formato de seis colunas, o roadmap está fechado com contagem e data, e o estado aponta o próximo passo e as pendências.</done>
</task>

## Critério de aceite do plano

- [ ] O verbete de onda está conferido, corrigido ou registrado como pendência
- [ ] Os sete comandos resolvem para workflow existente e nenhum gate sumiu
- [ ] Os quatro runtimes instalam e emitem comandos e skills
- [ ] Projeto anterior a este ciclo continua funcionando, com aviso e sem reprovação
- [ ] A suíte do lado UP sai verde numa única passada
- [ ] Nenhum artefato da fase contém travessão longo ou médio
- [ ] O fechamento está registrado no log, no roadmap e no estado

## Fora de escopo

1. Escrever o glossário interno. É artefato da fase 14, e criar aqui daria dois donos ao mesmo arquivo.
2. Corrigir verbete diferente do de onda, mesmo que pareça errado. A janela declarada entre as duas fases é a de onda, e alargar a conferência inventaria escopo não acordado.
3. Passe de corte de sedimento nos templates. Tem briefing próprio.
4. Publicar versão nova do pacote. A publicação acontece no fechamento do ciclo, e não por fase.
5. Alterar instalador ou runtime além do que os artefatos desta fase exigirem. A fronteira do ciclo declara isso.

## Colisões conhecidas

As fases 14, 16, 18, 19 e 20 rodam em paralelo com esta no grafo do ciclo. A conferência de regressão desta fase cobre apenas o que a fase 17 alterou. Achado que venha de fase irmã é registrado e devolvido para ela, e não corrigido aqui: corrigir trabalho de fase irmã em paralelo produz conflito no merge e apaga a autoria do defeito.

## Decisões registradas

**Decisão 1. Ausência do glossário não bloqueia o fechamento desta fase.** Alternativa rejeitada: fazer esta fase depender da fase 14. Rejeitada porque inverteria o grafo do ciclo, que declara as duas como irmãs independentes, e serializaria duas fases que não precisam ser serializadas. A janela entre elas é fechada por conferência, e não por dependência.

**Decisão 2. A correção admitida aqui é apenas no verbete de onda.** Alternativa rejeitada: corrigir o glossário inteiro quando ele existir. Rejeitada porque a matriz de escrita por artefato dá um dono por artefato, e o custo de dois donos é maior que o de uma pendência registrada.

**Decisão 3. O corredor de testes é usado se existir, e não é criado aqui.** Alternativa rejeitada: criar um corredor próprio da fase 17. Rejeitada porque a fase 16 já cria o corredor do lado UP, e dois corredores para a mesma suíte divergem na primeira vez que alguém acrescenta um arquivo de teste.
