---
phase: 19-auditoria-visual-escopada
plan: 19-005
type: feature
autonomous: true
wave: 3
depends_on: [19-004]
requirements: [AUD-05, AUD-10, AUD-11]
prova: smoke
must_haves:
  truths:
    - "Escolhido um candidato, a auditoria encerra apontando a rota de exploração, sem projetar nada no mesmo turno"
    - "Rejeição com motivo estrutural vira registro de decisão cuja função declarada e impedir que auditorias futuras sugiram a mesma coisa"
    - "Motivo efêmero ou auto-evidente não gera registro, e o critério de cada classe está escrito no workflow"
    - "Ao fim da auditoria a árvore de trabalho e o diff estão iguais aos de antes, fora um registro de decisão já commitado"
  artifacts:
    - path: "up/workflows/auditar.md"
      provides: "Passo de tratamento da resposta, classificação da recusa, rota de memória e passo de higiene da árvore"
  key_links:
    - from: "up/workflows/auditar.md"
      to: "operação de registro de decisão entregue na fase 14"
      via: "rota de rejeição estrutural, com degradação declarada quando a operação não existe"
    - from: "up/workflows/auditar.md"
      to: "arquivo de sessão gravado no diretório temporário"
      via: "guarda do gate lida no inicio do passo, e escrita do desfecho no fim"
---

# Fase 19 Plano 005: Resposta do dono, rejeição que vira memória e higiene

**Objetivo:** Fechar o outro lado do gate. Depois que o dono responde, dois caminhos: ele escolhe um candidato e a auditoria termina apontando a rota, ou ele recusa e a recusa com motivo estrutural vira memória do projeto, para nenhuma auditoria futura sugerir a mesma coisa outra vez. E, no fim de qualquer caminho, provar que a auditoria não sujou a árvore de trabalho.

**Onda:** 3. Depende do plano 004, que entrega os passos 1 a 5 do workflow e a guarda do gate por onde este plano começa.

## Decisão fechada aqui, com motivo

**A única escrita permitida no repositório e o registro de decisão.** A auditoria não suja a árvore: não há mais arquivo intermediário dentro do diretório de planejamento, e o relatório mora no diretório temporário. A exceção única e o registro de decisão criado por recusa estrutural do dono, que é artefato de memória do projeto, versionado por desenho, e commitado de forma atômica no mesmo turno. Fora essa exceção, ao fim da auditoria a saída de estado do git tem de estar igual a de antes. Sem essa exceção escrita, os dois requisitos brigariam: um manda não tocar na árvore, o outro manda gravar memória.

## Contexto

@up/workflows/auditar.md - o workflow, já com os passos 1 a 5 entregues pelo plano 004. Este plano acrescenta os passos 6 e 7 e faz a limpeza final do sedimento.
@.plano/ROADMAP.md - a fase 14 entrega o registro de decisão com numeração determinística e a base de rejeições por conceito. Este plano consome esses contratos.
@.plano/SYSTEM-DESIGN.md - a seção 6 lista, na matriz de escrita por artefato, que a auditoria escreve glossário e registro de decisão na hora em que a decisão cai, e que escrita em lote no fim da sessão é proibida.

## Contrato herdado da fase 14, e o que fazer se não existir

| Contrato herdado | Como descobrir na hora da execução | Degradação se não existir |
|------------------|-------------------------------------|---------------------------|
| Operação de criação de registro de decisão com numeração determinística | Rodar o despachante da CLI sem argumento para listar os subcomandos disponíveis, e ler o resumo da fase 14 no diretório de fases | Não falhar a auditoria. Avisar o dono que o registro não pode ser gravado agora, exibir o texto pronto do registro para ele guardar, e seguir |
| Base de rejeições por conceito | Mesma descoberta | Mesma degradação |

Não inventar nome de subcomando, não criar a operação aqui, não gravar arquivo numerado a mao imitando o formato da fase 14. Duas implementações do mesmo artefato é a pior saída possível: quebra a numeração determinística que a fase 14 promete.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato público que ele passa a oferecer |
|---------|-------------------------------------------|
| `up/workflows/auditar.md` (completado) | Passos 6 e 7 do pipeline: tratamento da resposta com as duas rotas, classificação da recusa em três classes, higiene da árvore e critérios de sucesso |

## Tarefas

<task id="1" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Escrever o passo 6, tratamento da resposta. Ele ABRE pela guarda do gate escrita no plano 004 (a que imprime `GATE FECHADO` e sai quando a escolha é nula) e só então se ramifica.

**Caminho A, o dono escolheu um candidato.**
1. Atualizar o arquivo de sessão com `escolha: "AC-NNN"` e `gate: "escolhido"`.
2. Encerrar a auditoria apontando a rota, sem projetar nada aqui:
   - Para explorar a intenção antes de decidir o desenho: a porta única, com o título do achado como frase de entrada.
   - Para já planejar, quando o dono declarar que o desenho está claro: o comando de planejamento.
   Exibir as duas rotas em duas linhas, com a primeira marcada como recomendada e o motivo em uma linha (explorar antes de planejar custa pouco e evita planejar a coisa errada).
3. Se a flag de ideação de feature veio no comando, e só agora, spawnar o pesquisador em modo mercado e apresentar o resultado no terminal. Fora do relatório HTML e fora do repositório.
4. Proibição que continua valendo depois da escolha: não começar a implementar. Escolher um candidato abre a próxima rodada, não autoriza a execução.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const req=['GATE FECHADO','escolhido','porta única'];const f=req.filter(s=>!t.toLowerCase().includes(s.toLowerCase()));if(f.length){console.error('faltando no caminho A:',f);process.exit(1)}console.log('caminho A OK')"</automated></verify>
<done>O passo 6 abre pela guarda do gate, registra a escolha no arquivo de sessão e encerra apontando duas rotas, com a recomendada marcada e o motivo dela em uma linha. Nada de implementação acontece no mesmo turno.</done>
</task>

<task id="2" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Escrever o caminho B do passo 6: o dono respondeu `nenhum destes`, ou recusou um candidato com motivo.

1. Pedir o motivo em uma única pergunta, se ele não tiver vindo junto da resposta.
2. Classificar o motivo pela tabela abaixo, escrita dentro do próprio workflow:

| Classe | Como reconhecer | Ação |
|--------|-----------------|------|
| Estrutural | O motivo continua verdadeiro daqui a três meses e vale para qualquer auditoria futura. Exemplos: o acoplamento e intencional e desacoplar custa mais do que rende; a duplicação e deliberada porque os dois lados evoluem separados; a dependência fica porque o substituto não cobre um caso conhecido | Gera registro de decisão |
| Efêmero | O motivo é de calendário, de prioridade ou de disposição. Exemplos: agora não; depois do lancamento; não é prioridade este mês; sem tempo | Não gera registro |
| Auto-evidente | O motivo já está escrito num artefato que o projeto tem e a auditoria deveria ter lido (glossário, registro de decisão existente, seção de fora de escopo do roadmap) | Não gera registro. Apontar o artefato existente e anotar que a auditoria falhou em ler antes de sugerir |

3. Caso ambíguo: uma única pergunta ao dono, no formato da fase 13, com a opção recomendada sendo **não gravar** e o motivo `registro de ruído e caro de limpar, e a recusa pode ser refeita na próxima auditoria a um custo baixo`.
4. Sendo estrutural, criar o registro pela operação da fase 14, com quatro conteudos: o conceito recusado, o motivo do dono nas palavras dele, a alternativa que tinha sido proposta, e a função declarada do registro, escrita literalmente dentro do arquivo: `este registro existe para impedir que auditorias futuras sugiram de novo o mesmo conceito`. Commitar de forma atômica, no mesmo turno, nunca em lote no fim da sessão.
5. Não existindo a operação da fase 14, aplicar a degradação da tabela de contratos herdados: avisar, exibir o texto pronto do registro e seguir. A auditoria não falha por causa disso.
6. Atualizar o arquivo de sessão com `gate: "recusado"` e o `motivo_recusa`.

Escrever também, logo abaixo da tabela, a razão de a classificação existir: registro que não muda auditoria futura é ruído, é ruído em base de memória envenena a leitura dela. Gravar de menos custa uma sugestão repetida; gravar de mais custa a confianca no arquivo inteiro.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const req=['Estrutural','Efêmero','Auto-evidente','impedir que auditorias futuras','não gravar','recusado'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando no caminho B:',f);process.exit(1)}console.log('caminho B OK')"</automated></verify>
<done>O caminho B classifica a recusa nas três classes com exemplos, tem regra para caso ambíguo com recomendação de não gravar, escreve a função declarada dentro do registro, e traz a degradação para quando a operação da fase 14 ainda não existe.</done>
</task>

<task id="3" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Escrever o passo 7, higiene, e o bloco de critérios de sucesso do workflow. Fazer também a limpeza final do sedimento.

**Passo 7, higiene da árvore.** Ao fim de qualquer caminho:
```bash
git status --porcelain
```
Regra escrita no workflow: a saída tem de estar igual a de antes da auditoria. A única entrada nova aceitável e um registro de decisão criado no caminho B, e ele já foi commitado, portanto nem aparece. Havendo qualquer outra coisa, a auditoria vazou arquivo para o repositório: reportar ao dono qual arquivo vazou e de onde veio. Este passo nunca apaga arquivo sozinho, porque apagar arquivo do repositório do dono sem ele pedir é pior que o vazamento.

**Bloco `<success_criteria>` do workflow**, em caixas de checagem:
- [ ] Escopo exibido antes da análise, com janela, concentração e topo do ranking
- [ ] Sem concentração, a rede alargou e o motivo foi declarado ao dono e no relatório
- [ ] Relatório HTML gerado no diretório temporário, aberto ou com caminho absoluto informado
- [ ] Apresentação curta, uma única pergunta de handoff com opção recomendada e motivo
- [ ] Nenhum conteúdo de projeto no turno da pergunta
- [ ] Guarda do gate presente e barrando sem escolha registrada
- [ ] Recusa estrutural virou registro; recusa efêmera ou auto-evidente não virou
- [ ] Árvore de trabalho igual a de antes, fora o registro de decisão commitado
- [ ] Nada foi escrito no arquivo de estado do projeto, e nada foi commitado além do registro

**Limpeza do sedimento.** Remover do workflow o que sobrou do ciclo anterior: spawn do sintetizador para consolidar relatório markdown, tabela de quadrantes de esforço e impacto, seção de anti-features e o passo de conversão em fase do roadmap. Se algum deles ainda estiver la, a reescrita da fase não terminou. O agente sintetizador continua existindo no pacote e não é removido: ele só sai do caminho da auditoria.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const orfaos=['RELATORIO.md','Quick Wins','generate-from-report','anti-features','up-sintetizador'];const p=orfaos.filter(s=>t.includes(s));if(p.length){console.error('sedimento ainda presente:',p);process.exit(1)}if(!t.includes('git status --porcelain')){console.error('falta a checagem de higiene');process.exit(1)}if(/\u2014|\u2013/.test(t)){console.error('travessao encontrado');process.exit(1)}console.log('higiene e limpeza OK')"</automated></verify>
<done>O passo de higiene existe e não apaga nada sozinho, os critérios de sucesso cobrem os nove pontos, e nenhum bloco do pipeline antigo (sintetizador, quadrantes, anti-features, conversão em fase) sobrou no workflow.</done>
</task>

<task id="4" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Smoke das duas rotas de recusa, sem depender de execução com o dono.

1. Montar dois motivos de teste e classifica-los a mao, seguindo a tabela do workflow, registrando o resultado no SUMMARY:
   - `o acoplamento entre o despachante e a biblioteca de git e intencional, porque separar exigiria uma camada que só tem um consumidor` deve cair em estrutural.
   - `depois do lancamento eu penso nisso` deve cair em efêmero.
   Este exercicio não é teatro: ele existe para provar que a tabela e usável por quem le, e não apenas bonita.
2. Verificar a existência da operação de registro de decisão da fase 14:
```bash
node up/bin/up-tools.cjs 2>&1 | head -5
```
   Registrar no SUMMARY se ela existe. Existindo, criar um registro de teste num repositório temporário (nunca neste) e conferir a numeração. Não existindo, registrar que a rota de degradação foi a exercitada e que o requisito de rejeição fica pendente até a fase 14 aterrissar. Requisito pendente registrado com motivo é honesto; requisito marcado sem prova não e.
3. Conferir a higiene deste próprio plano: `git status --porcelain` mostra apenas os arquivos previstos.
4. Commit atômico do workflow.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const passos=['Passo 6','Passo 7'];const f=passos.filter(s=>!t.includes(s));if(f.length){console.error('passos faltando:',f);process.exit(1)}console.log('workflow completo com os 7 passos')" && test -z "$(git status --porcelain | grep -v '.plano/fases/19')" && echo "ARVORE LIMPA"</automated></verify>
<done>As duas rotas de recusa foram exercitadas por classificação explícita, a existência da operação da fase 14 foi verificada e registrada, e o workflow está completo com os sete passos.</done>
</task>

## Critério de aceite do plano

- [ ] O passo de tratamento da resposta abre pela guarda do gate e não roda sem escolha registrada
- [ ] Escolhido um candidato, a auditoria encerra apontando duas rotas, com a recomendada marcada, e não implementa nada
- [ ] Recusa estrutural gera registro de decisão com a função declarada escrita dentro do arquivo (AUD-10)
- [ ] Recusa efêmera ou auto-evidente não gera registro, e a tabela das três classes está no workflow com exemplos (AUD-11)
- [ ] Sem a operação da fase 14, a auditoria degrada avisando em vez de falhar, e o requisito fica pendente com motivo
- [ ] Ao fim da auditoria a árvore de trabalho está igual a de antes, fora um eventual registro já commitado (AUD-05)
- [ ] Nenhum bloco do pipeline antigo sobrou no workflow

## Tipo de prova

**Smoke.** A prova e a classificação explícita de dois motivos reais pelas classes da tabela, mais a verificação da existência (ou ausência declarada) da operação herdada da fase 14, mais a checagem de higiene do repositório. A prova de comportamento com o dono de verdade acontece na execução real do plano 006.

## Fora de escopo

- Não implementar a operação de registro de decisão nem a base de rejeições. São da fase 14, e este plano só as consome.
- Não gravar arquivo numerado a mao imitando o formato da fase 14. Duas implementações do mesmo artefato quebram a numeração determinística.
- Não remover o agente sintetizador do pacote. Ele só sai do caminho da auditoria.
- Não alterar os passos 1 a 5 do workflow, entregues no plano 004, a não ser que a integração revele defeito. Nesse caso, corrigir e registrar no SUMMARY.
- Não tocar no agente auditor, no renderizador nem na operação de pontos quentes.
- Não coletar a prova visual nem rodar a regressão dos runtimes. São do plano 006.
</content>
