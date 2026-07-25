---
phase: 17-planejamento-por-grafo
plan: "004"
type: feature
wave: 2
depends_on: ["003"]
autonomous: true
plan_schema: 2
requirements: [PLANO-09, PLANO-10, PLANO-11, PLANO-12]
files_modified:
  - up/bin/lib/plan-checks.cjs
  - up/bin/lib/plan-checks.test.cjs
  - up/bin/up-tools.cjs
  - up/agents/up-planejador.md
  - up/templates/plan-ready.md
  - .plano/fases/17-planejamento-por-grafo/evidencia/004-red.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/004-green.txt
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
must_haves:
  truths:
    - "Plano fica proibido de conter caminho de arquivo e bloco de código, e a proibição é verificada"
    - "Trecho vindo de protótipo continua permitido quando marcado como tal, e apenas nas partes ricas em decisão"
    - "Todo plano tem campo de fora de escopo preenchido, e campo vazio não conta como preenchido"
    - "Os templates de plano trazem exemplo ruim anotado ao lado do exemplo bom, com o motivo de cada linha ruim"
    - "Plano anterior a este ciclo recebe aviso e não é reprovado"
  artifacts:
    - path: "up/agents/up-planejador.md"
      provides: "Regra de durabilidade, marcador de origem protótipo, campo de fora de escopo e par de exemplos anotados"
    - path: "up/bin/lib/plan-checks.cjs"
      provides: "Regra de durabilidade e regra de campo obrigatório, sobre o harness criado no plano 003"
    - path: "up/templates/plan-ready.md"
      provides: "Campo de fora de escopo (acrescentado apenas se ausente) e par de exemplos anotados"
  key_links:
    - from: "up/bin/lib/plan-checks.cjs"
      to: "up/agents/up-planejador.md"
      via: "marcador de origem protótipo e marcador de exemplo ruim declarados na doutrina e reconhecidos pela regra"
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/plan-checks.cjs"
      via: "validate-plan, que passa a aplicar durabilidade e campo obrigatório no mesmo veredito"
---

# Fase 17 Plano 004: Durabilidade do plano, fora de escopo e exemplo ruim

<objective>
Fazer o plano sobreviver ao tempo entre ser escrito e ser executado. Caminho de arquivo e trecho de código envelhecem rápido, e o plano pronto deste sistema é feito para ser escrito num runtime e executado noutro, com o código já mexido. No lugar deles entram interface, tipo e contrato de comportamento.
</objective>

**Onda:** 2. **Depende de:** plano 003 desta fase. As duas regras deste plano rodam sobre o harness de checagem criado lá, com a mesma política de severidade e o mesmo formato de ocorrência. Escrever as regras antes do harness duplicaria o harness.
**Tipo de prova:** lógica, vermelho e verde.

**Nota sobre a regra que este plano entrega:** a proibição vale para plano gerado a partir do ciclo, e é o que esta fase constrói. Os caminhos aparecem nos campos `<files>` porque o executor depende deles como trava de escopo. O corpo das tarefas descreve contrato de comportamento, que é a forma que a regra passa a exigir.

## Contexto

@up/bin/lib/plan-checks.cjs - harness e política de severidade criados no plano 003
@up/agents/up-planejador.md - formato de plano publicado pela doutrina, e destino da regra
@up/templates/plan-ready.md - template do plano pronto. Ele ainda descreve aprovações de CEO, chiefs e supervisores: é sedimento conhecido, está fora de escopo, não mexer
@.plano/SYSTEM-DESIGN.md - seção 5.4, frontmatter do plano pronto

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-planejador.md (editar)</files>
<action>
Acrescentar à doutrina a regra de durabilidade, com o motivo declarado junto, porque regra sem motivo é negociada.

1. Plano não contém caminho de arquivo e não contém bloco de código.
2. No lugar, o plano descreve interface, tipo e contrato de comportamento: o que a superfície recebe, o que devolve, o que passa a ser verdade depois dela.
3. Nome de contrato público continua permitido e é o substituto correto do caminho: módulo exportado, interface, comando, rota, subcomando, campo de resposta.
4. O motivo: o plano é escrito num momento e executado noutro, possivelmente noutro runtime, com o código já mexido. Caminho e trecho envelhecem entre os dois momentos, e o executor confia neles.
5. Exceção única e fechada, com os quatro casos: máquina de estados, redutor, esquema de dados e formato de tipo, vindos de protótipo, e apenas nas partes ricas em decisão. O trecho traz o marcador de origem protótipo na linha imediatamente anterior; sem o marcador nessa posição, é violação. A exceção não cobre caminho de arquivo, que continua proibido dentro do trecho marcado.
6. Declarar os dois marcadores em texto literal, para que a checagem e o autor usem a mesma grafia: o de origem protótipo e o de exemplo ruim.
7. Onde isto é verificado: uma linha citando a validação de plano e o veredito que ela devolve.
</action>
<verify><automated>grep -qi "origem protótipo" up/agents/up-planejador.md && grep -qi "contrato de comportamento" up/agents/up-planejador.md && echo "durabilidade ok"</automated></verify>
<done>A doutrina traz a proibição, o substituto, o motivo, a exceção com os quatro casos e a grafia literal dos dois marcadores.</done>
</task>

<task id="2" type="auto">
<files>up/agents/up-planejador.md (editar)</files>
<action>
Tornar obrigatório o campo de fora de escopo no formato de plano publicado pela doutrina.

1. Seção com título fixo, uma vez por plano, com pelo menos um item, e uma linha de motivo por item.
2. Quando não há nada fora de escopo, o item é a frase padrão declarada na doutrina. Seção vazia não conta como preenchida, porque campo vazio passa na conferência e mata a função do campo.
3. A função declarada do campo: travar acréscimo não pedido durante a execução.
4. No bloco de artefatos do formato de plano, o campo hoje nomeado por caminho passa a ser nomeado por superfície, que é o contrato público tocado. É a mesma troca que a regra exige do corpo, aplicada aos metadados. O campo de arquivos tocados continua existindo, porque é a trava de escopo do executor.
</action>
<verify><automated>grep -qi "fora de escopo" up/agents/up-planejador.md && grep -q "surface:" up/agents/up-planejador.md && echo "campo ok"</automated></verify>
<done>O formato de plano exige a seção de fora de escopo preenchida, com frase padrão para o caso vazio, e o artefato passa a ser nomeado por superfície.</done>
</task>

<task id="3" type="auto">
<files>up/templates/plan-ready.md (editar)</files>
<action>
Acrescentar ao template do plano pronto o campo de fora de escopo e a seção correspondente. Edição cirúrgica: acrescentar, não reorganizar.

**Guarda obrigatória, por causa da fase 16.** A fase 16 acrescenta a este mesmo template três chaves de frontmatter: o marcador de esquema, o bloco de fronteiras confirmadas e o campo de fora de escopo. As duas fases rodam em paralelo e escrevem o mesmo campo. Portanto:

1. Antes de escrever, conferir se a chave de fora de escopo já existe no frontmatter. Se existir, não duplicar: apenas conferir que o comentário ao lado dela descreve a obrigatoriedade e a linha de motivo por item, e completar o que faltar.
2. O mesmo vale para a seção de corpo: se já existir seção de fora de escopo, completar em vez de acrescentar uma segunda.
3. Não tocar no marcador de esquema nem no bloco de fronteiras confirmadas. Eles são da fase 16, e reescrevê-los apagaria trabalho dela.
4. Se a fase 16 ainda não tiver passado, acrescentar a chave e a seção, deixando o marcador de esquema para ela.
5. Não tocar na seção de aprovações antiga, que lista CEO, chiefs e supervisores. É sedimento conhecido, com passe próprio, e removê-lo aqui estoura o escopo.
</action>
<verify><automated>test $(grep -c "^fora_de_escopo" up/templates/plan-ready.md) -le 1 && grep -qi "fora de escopo" up/templates/plan-ready.md && grep -q "CEO" up/templates/plan-ready.md && echo "template ok"</automated></verify>
<done>O template tem exatamente uma chave de fora de escopo e uma seção correspondente, o trabalho da fase 16 está intacto, e o sedimento antigo continua onde estava.</done>
</task>

<task id="4" type="auto">
<files>up/agents/up-planejador.md (editar), up/templates/plan-ready.md (editar)</files>
<action>
Acrescentar o exemplo ruim anotado ao lado do exemplo bom, nos dois lugares.

1. Os dois exemplos descrevem o mesmo cenário, para que a comparação seja honesta.
2. O exemplo ruim vem com o marcador de exemplo ruim declarado na tarefa 1, o mesmo que a regra de adjetivo do plano 003 já reconhece, para que a checagem não acuse o próprio exemplo.
3. Cada linha ruim traz o motivo na própria linha, e não num parágrafo depois.
4. Três pares obrigatórios: tarefa descrita por caminho de arquivo contra tarefa descrita por contrato público; critério de aceite por adjetivo contra critério em número; fora de escopo vazio contra fora de escopo com uma linha de motivo por item.
</action>
<verify><automated>node -e "const fs=require('fs');for(const f of ['up/agents/up-planejador.md','up/templates/plan-ready.md']){const t=fs.readFileSync(f,'utf-8');if(!/exemplo ruim/i.test(t))throw new Error('sem exemplo ruim em '+f);if(!/exemplo bom/i.test(t))throw new Error('sem exemplo bom em '+f);}console.log('exemplos ok');"</automated></verify>
<done>Os três pares existem nos dois lugares, marcados, com anotação por linha ruim.</done>
</task>

<task id="5" type="auto">
<files>up/bin/lib/plan-checks.test.cjs (editar), .plano/fases/17-planejamento-por-grafo/evidencia/004-red.txt (novo)</files>
<action>
Escrever os casos ANTES da implementação e VER FALHAR. Bloco novo no arquivo de teste criado no plano 003.

Casos obrigatórios:

1. Plano com caminho de arquivo no corpo: ocorrência.
2. Plano com endereço de rede com esquema de protocolo: sem ocorrência.
3. Plano com bloco cercado: ocorrência.
4. Plano com bloco cercado precedido pelo marcador de origem protótipo na linha imediatamente anterior: sem ocorrência.
5. Plano com bloco marcado como protótipo contendo caminho de arquivo: ocorrência, apontando o caminho e não o bloco.
6. Plano com nome de contrato entre crases simples: sem ocorrência.
7. Marcador de protótipo a duas linhas de distância do bloco: ocorrência, porque a exceção só vale na linha imediatamente anterior.
8. Plano sem seção de fora de escopo: ocorrência.
9. Plano com seção de fora de escopo vazia: ocorrência.
10. Plano com seção de fora de escopo preenchida com a frase padrão: sem ocorrência.
11. Plano limpo: veredito de aprovação.
12. Plano sem marcador de esquema, violando tudo: todas as ocorrências como aviso, veredito sem reprovação.
13. Trecho dentro de exemplo marcado como ruim, violando as duas regras: sem ocorrência.

Rodar e gravar a saída em `evidencia/004-red.txt`.
</action>
<verify><automated>node up/bin/lib/plan-checks.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/004-red.txt 2>&1; grep -qE "FAIL|failed" .plano/fases/17-planejamento-por-grafo/evidencia/004-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 13 casos existem, foram executados e falharam por ausência das regras, com a saída vermelha gravada.</done>
</task>

<task id="6" type="auto">
<files>up/bin/lib/plan-checks.cjs (editar), .plano/fases/17-planejamento-por-grafo/evidencia/004-green.txt (novo)</files>
<action>
Implementar as duas regras no harness e fechar o verde.

`checkDurability(text, doctrineText)`. Detecção:

1. **Caminho de arquivo:** sequência sem espaço com ao menos uma barra e um segmento com extensão de arquivo, ou começando por ponto e barra, til e barra, ou barra. Endereço de rede com esquema de protocolo não é ocorrência, porque referência externa não envelhece com o código.
2. **Bloco de código:** bloco cercado por três crases. Trecho entre crases simples não é ocorrência, porque nome de contrato público entre crases é nome, e não código.
3. **Exceção:** bloco cercado imediatamente precedido pelo marcador de origem protótipo não é ocorrência. Caminho dentro do bloco marcado continua sendo.
4. **Exemplo ruim:** trecho dentro de exemplo marcado não é ocorrência.
5. A checagem é sintática e não consulta o sistema de arquivos, porque o plano pode ser validado noutra máquina e noutro momento.
6. O campo de arquivos tocados de cada tarefa é a trava de escopo do executor e fica fora da varredura, declarado por lista de campos isentos. Sem essa isenção a regra tornaria o plano inexecutável.

`checkRequiredSections(text)`: a seção de fora de escopo existe, aparece uma vez e tem pelo menos um item. Seção ausente, duplicada ou vazia é ocorrência.

Ocorrências no mesmo formato do plano 003, com linha, trecho e identificador de regra, e a mesma política de severidade pelo marcador de esquema. Rodar o teste até ficar verde e gravar em `evidencia/004-green.txt`.
</action>
<verify><automated>node up/bin/lib/plan-checks.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/004-green.txt 2>&1; grep -q "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/004-green.txt && echo "GREEN confirmado"</automated></verify>
<done>Os 23 casos do arquivo (10 do plano 003 e 13 deste) passam, com as saídas vermelha e verde gravadas lado a lado.</done>
</task>

<task id="7" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Aplicar as duas regras novas no mesmo veredito da validação de plano.

1. As ocorrências entram na lista de problemas que a operação já devolve, com identificador de regra próprio, sem alterar a forma da resposta.
2. Ocorrência de severidade aviso não derruba o veredito e vai para a coleção separada de avisos criada no plano 003.
3. A sugestão de correção de cada regra é uma frase e diz o que colocar no lugar, e não apenas o que remover.
</action>
<verify><automated>node -e "const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');const d=fs.mkdtempSync(path.join(os.tmpdir(),'up-dur-'));const f=path.join(d,'x.md');fs.writeFileSync(f,'---\nplan_schema: 2\n---\n# t\n### 1. tarefa\nver o modulo em up/bin/x.cjs\n## Fora de escopo\n- nada\n');const out=cp.execSync('node up/bin/up-tools.cjs validate-plan '+f).toString();if(!/durab|caminho|path/i.test(out))throw new Error(out);fs.rmSync(d,{recursive:true,force:true});console.log('validate durabilidade ok');"</automated></verify>
<done>Plano com caminho de arquivo no corpo reprova quando declara o marcador de esquema, e plano anterior ao ciclo com o mesmo defeito apenas avisa.</done>
</task>

<task id="8" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/004-autoaplicacao.txt (novo)</files>
<action>
Autoaplicação: a regra vale para quem a escreveu.

Rodar a validação de plano sobre os cinco planos desta fase e gravar a saída. Os cinco precisam passar sem ocorrência de caminho no corpo, sem ocorrência de bloco e com seção de fora de escopo preenchida. Se algum não passar, corrigir o plano antes de fechar esta tarefa e registrar a correção.

Conferir também que os campos de arquivos tocados continuam intactos nos cinco, porque a isenção declarada na tarefa 6 é o que mantém os planos executáveis.
</action>
<verify><automated>for f in .plano/fases/17-planejamento-por-grafo/00*-PLAN.md; do node up/bin/up-tools.cjs validate-plan "$f" --raw; echo; done > .plano/fases/17-planejamento-por-grafo/evidencia/004-autoaplicacao.txt 2>&1; test $(grep -c "PASS" .plano/fases/17-planejamento-por-grafo/evidencia/004-autoaplicacao.txt) -eq 5 && echo "autoaplicacao ok"</automated></verify>
<done>Os cinco planos da fase passam na própria regra, com a evidência gravada, e os campos de arquivos tocados continuam presentes.</done>
</task>

## Critério de aceite do plano

- [ ] A doutrina declara a proibição de caminho e de bloco, o substituto e o motivo
- [ ] A exceção de protótipo vale só no bloco imediatamente marcado e não cobre caminho de arquivo
- [ ] Todo plano gerado a partir deste ciclo traz seção de fora de escopo preenchida, e seção vazia reprova
- [ ] Os dois templates trazem os três pares de exemplo bom e ruim, com motivo por linha ruim
- [ ] O template do plano pronto tem exatamente uma chave de fora de escopo, sem duplicar a da fase 16
- [ ] O campo de arquivos tocados fica isento da varredura, e os planos continuam executáveis
- [ ] Os 13 casos passam, e o vermelho está gravado
- [ ] Os cinco planos desta fase passam na própria regra

## Fora de escopo

1. Remover o sedimento de papéis removidos na versão anterior que ainda aparece no template do plano pronto. Esta fase toca o template só para acrescentar campo e exemplo. O sedimento tem passe próprio, e misturar os dois esconderia a mudança real dentro de um diff grande.
2. Reescrever plano já gravado para tirar caminho e bloco. Plano antigo recebe aviso, e reescrever histórico de planejamento apagaria o registro do que foi pedido na época.
3. Aplicar a regra ao briefing, ao desenho do sistema e ao mapa do codebase. Esses documentos citam caminho de propósito, porque são fotografia do estado do repositório.
4. Aplicar a regra ao campo de arquivos tocados. Ele é a trava de escopo do executor, e proibi-lo tornaria o plano inexecutável.
5. Regra anti tautologia e campo de fronteiras confirmadas. São da fase 16.

## Colisões conhecidas

1. O plano 003 desta fase cria o harness e fecha antes deste por aresta declarada. Não há escrita concorrente no módulo de checagem.
2. A fase 16 acrescenta ao template do plano pronto três chaves, e uma delas é o campo de fora de escopo, que também é requisito desta fase. A tarefa 3 traz guarda explícita de não duplicar e de não tocar no que é dela. A política de severidade por marcador de esquema é a mesma nas duas fases por decisão, e não por coincidência, e o marcador é o dela.

## Decisões registradas

**Decisão 1. Nome de contrato entre crases simples continua permitido.** Alternativa rejeitada: proibir qualquer marcação de código. Rejeitada porque o substituto do caminho é justamente o nome do contrato público, e proibir de nomeá-lo deixaria o plano sem como apontar para nada.

**Decisão 2. O campo de arquivos tocados fica isento da regra.** Alternativa rejeitada: proibir caminho em todo o arquivo, sem isenção. Rejeitada porque o executor usa esse campo como trava de escopo, e um plano sem ele não é executável: a regra mataria o artefato que ela existe para proteger.

**Decisão 3. A checagem é sintática e não consulta o disco.** Alternativa rejeitada: confirmar se o caminho citado existe antes de acusar. Rejeitada porque o resultado passaria a depender da máquina que roda a checagem, que é o tipo de fragilidade que a regra de durabilidade combate.
