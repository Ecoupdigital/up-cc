---
phase: 18-contexto-e-revisao
plan: "005"
type: logic
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-03, CTX-09, CTX-10]
objective: "Limiar de zona segura em setenta por cento e monitor de contexto que oferece handoff em vez de so avisar"
prova: "logic:test_pass (vermelho e verde sobre as fronteiras de nivel)"
files_modified:
  - up/bin/lib/zona-segura.cjs
  - up/bin/lib/zona-segura.test.cjs
  - up/bin/lib/core.cjs
  - up/hooks/up-context-monitor.js
  - up/skills/usando-up/SKILL.md
  - up/templates/config.json
  - .plano/fases/18-contexto-e-revisao/evidencia/005-red.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/005-green.txt
must_haves:
  truths:
    - "Existe limiar numerico de zona segura, em percentual de janela ocupada, com valor padrao no arquivo de configuracao"
    - "Ao cruzar o limiar, o monitor oferece a acao de handoff em vez de apenas avisar"
    - "A distincao entre handoff e compactacao esta escrita em uma linha na doutrina"
  artifacts:
    - path: "up/bin/lib/zona-segura.cjs"
      provides: "Decisao pura de nivel de contexto contra o limiar configurado"
    - path: "up/hooks/up-context-monitor.js"
      provides: "Oferta de handoff com comando pronto ao cruzar o limiar"
  key_links:
    - from: "up/hooks/up-context-monitor.js"
      to: "o subcomando de handoff"
      via: "comando pronto no texto da oferta, com os campos que o dono precisa preencher"
---

# Fase 18 Plano 005: Limiar de zona segura e monitor que oferece

<objective>
Fechar o limiar de zona segura em número, pôr o monitor na mesma escala que o dono enxerga na barra de status, e trocar o aviso por uma oferta de handoff com o comando pronto, mais a linha de doutrina que distingue handoff de compactação.
</objective>

**Onda:** 2. **Depende de:** plano 001, porque só se oferece uma ação que já existe.
**Tipo de prova:** lógica, vermelho e verde, para a decisão de nível, com as fronteiras exatas testadas. Smoke para o gancho e para a configuração.

## O defeito que este plano conserta

O monitor hoje avisa, em inglês, e o texto do aviso chega a mandar explicitamente não escrever handoff.
Pior: ele avisa tarde. Usa a escala crua de percentual restante, enquanto a barra que o dono vê usa a
escala descontada do espaço reservado para compactação automática. Quinze por cento restantes na escala
crua correspondem à barra já cheia na escala mostrada. O aviso chega depois da degradação.

## Decisão fechada neste planejamento

**Pergunta:** qual o valor padrão do limiar de zona segura, em percentual de janela ocupada?

**Resposta recomendada:** setenta por cento, medido na mesma escala que a barra de status mostra ao dono,
isto é, percentual ocupado da janela utilizável, já descontado o espaço reservado para compactação
automática.

**Motivo:** setenta já é o número que a doutrina de planejamento do próprio sistema usa quando diz que um
plano deve caber na janela sem passar de cerca de setenta por cento. Fixar o mesmo valor faz configuração
e doutrina pararem de discordar. Setenta também é o início da faixa de degradação da curva de qualidade
declarada no sistema (pico até quarenta, bom até sessenta, degradando de sessenta a oitenta, ruim acima
de oitenta), o que deixa dez pontos de margem antes da faixa ruim. Dez pontos bastam para escrever um
handoff, porque o handoff é curto por construção: ele referencia em vez de copiar.

**Alternativas rejeitadas:** sessenta por cento, rejeitada porque a oferta apareceria ainda dentro da
faixa boa, e oferta que aparece cedo demais vira papel de parede e deixa de ser lida. Oitenta por cento,
rejeitada porque o handoff seria escrito por um agente já degradado, e o documento vira o prompt da
sessão seguinte, então a degradação se propaga em vez de parar. Manter a escala crua de percentual
restante, rejeitada porque o dono veria um número e o sistema usaria outro, e duas escalas para a mesma
coisa é exatamente o tipo de coisa que este ciclo existe para matar.

**Segundo nível, derivado e não configurável:** limiar mais quinze pontos, com teto em noventa e cinco.
Abaixo do limiar, silêncio. Do limiar até o segundo nível, oferta. Acima, prescrição. Um único número
configurável, o segundo derivado dele, porque dois botões para a mesma decisão convidam a desregular um
sem o outro.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisão D3
@up/hooks/up-context-monitor.js - os dois limiares crus atuais, a supressão por repetição e a detecção de projeto com planejamento
@up/hooks/up-statusline.js - onde a escala descontada é calculada e o arquivo de ponte é escrito
@up/bin/lib/core.cjs - função de carregamento de configuração, com os valores padrão e o objeto devolvido
@up/skills/usando-up/SKILL.md - doutrina injetada em todo início de sessão e nos runtimes sem gancho
@up/bin/lib/test-helpers.cjs - helper de teste entregue pela fase 16

O plano 001 entrega o subcomando de handoff. Se não existir, parar e escalar: oferecer ação inexistente é
pior que não oferecer.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/zona-segura.test.cjs (novo), .plano/fases/18-contexto-e-revisao/evidencia/005-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR.

Casos contra o limiar padrão de setenta: sessenta e nove devolve silêncio; setenta devolve oferta, porque o limiar é inclusivo e a fronteira é o próprio número; oitenta e quatro devolve oferta; oitenta e cinco devolve prescrição; cem devolve prescrição.

Casos de limiar configurado, que provam que o segundo nível é derivado e não fixo: com limiar cinquenta, cinquenta devolve oferta, sessenta e quatro devolve oferta e sessenta e cinco devolve prescrição. Com limiar noventa, o segundo nível é aparado em noventa e cinco e não em cento e cinco.

Casos de degradação: limiar ausente na configuração cai no padrão; limiar inválido, isto é, texto, zero, negativo ou acima de cem, cai no padrão em vez de lançar, porque configuração errada não pode derrubar o gancho.

Rodar, confirmar que falha e gravar a saída em `evidencia/005-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/lib/zona-segura.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/005-red.txt 2>&1; grep -qiE "FAIL|failed|Cannot find module" .plano/fases/18-contexto-e-revisao/evidencia/005-red.txt && echo "RED confirmado"</automated></verify>
<done>O arquivo de teste cobre as onze regras de fronteira e de degradação, falha por ausência da biblioteca, e a saída vermelha está gravada.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/zona-segura.cjs (novo)</files>
<action>
Implementar a decisão de zona segura. CommonJS, sem dependência externa, exportação por objeto literal.

Exporta o valor padrão do limiar como constante nomeada, a função de saneamento do limiar configurado e a função de decisão, que recebe o percentual ocupado e o limiar e devolve o nível, entre `silencio`, `oferta` e `prescricao`, mais os dois números usados, para que o texto da mensagem possa citá-los sem recalcular.

A função de decisão é pura: sem leitura de disco, sem data, sem processo. É o que permite testá-la sem simular o gancho inteiro, e é o que mantém o gancho barato.
</action>
<verify><automated>node -e "const z=require('./up/bin/lib/zona-segura.cjs'); const n=(p,l)=>z.decidir(p,l).nivel; if(n(69,70)!=='silencio'||n(70,70)!=='oferta'||n(85,70)!=='prescricao'||n(65,50)!=='prescricao') throw new Error('fronteira errada'); console.log('zona segura ok');"</automated></verify>
<done>A biblioteca devolve os três níveis nas fronteiras corretas, deriva o segundo nível do limiar com teto em noventa e cinco, e cai no padrão diante de limiar inválido.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/core.cjs (editar: valores padrão e objeto devolvido pelo carregamento de configuração), up/templates/config.json (editar)</files>
<action>
Publicar o limiar na configuração do projeto.

Em `up/bin/lib/core.cjs`, acrescentar a chave nova aos valores padrão do carregamento de configuração, com o valor decidido, e ao objeto devolvido, seguindo exatamente o padrão das chaves vizinhas, inclusive o comentário curto que explica a chave, como já existe para as chaves de integração e de teste visual. Nome da chave em português, como as demais deste sistema, expressando o que ela é: percentual de janela ocupada a partir do qual a zona segura acabou.

Acrescentar a mesma chave, com o mesmo valor, ao molde de configuração de projeto, para que projeto novo nasça com o número visível em vez de herdá-lo de um padrão escondido no código.

Conferir que a leitura por linha de comando da configuração devolve a chave nova sem alteração no código de leitura, porque ela é genérica sobre o objeto devolvido. Se não for, ajustar apenas o suficiente para que devolva.

Este arquivo é editado por outra fase em onda anterior: edição por âncora, relendo imediatamente antes.
</action>
<verify><automated>node up/bin/up-tools.cjs config get contexto_zona_segura --raw | grep -qE "^[0-9]+$" && grep -q "contexto_zona_segura" up/templates/config.json && echo "config ok"</automated></verify>
<done>A chave existe nos valores padrão, no objeto devolvido e no molde de projeto novo, e a leitura por linha de comando devolve o número.</done>
</task>

<task id="4" type="auto">
<files>up/hooks/up-context-monitor.js (editar: bloco de limiares, bloco de decisão e as quatro mensagens)</files>
<action>
Trocar aviso por oferta no monitor de contexto.

Preservar o que já funciona: a proteção de tempo limite na leitura da entrada, a saída silenciosa com código zero em qualquer erro, a leitura do arquivo de ponte escrito pela barra de status, o descarte de métrica velha, a supressão por repetição e a detecção de projeto com planejamento.

O que muda. O gancho passa a comparar o percentual ocupado, que já vem calculado na escala descontada dentro do arquivo de ponte, contra o limiar lido da configuração do projeto, usando a biblioteca da tarefa 2. Os dois limiares crus atuais saem. A resolução da biblioteca usa as duas candidaturas de caminho, layout de repositório e layout instalado, como o gancho de início de sessão já faz para achar a skill de bootstrap. Se a biblioteca não for encontrada, o gancho sai em silêncio, como sempre.

O texto das mensagens passa a ser português com acentuação e passa a ser oferta em vez de aviso. No nível de oferta: declarar o percentual ocupado e o limiar, dizer que a zona segura acabou e que não se empurra trabalho degradado, e oferecer duas saídas no formato de pergunta da fase 13, com a recomendada primeiro e o motivo dela. A recomendada é fazer o handoff agora, com o comando pronto e os campos a preencher, mais a instrução de que a sessão seguinte começa lendo o documento gerado. A outra é seguir assumindo a degradação.

No nível de prescrição, a oferta vira instrução: não iniciar trabalho novo, fechar o que está em voo e fazer o handoff agora. O texto continua nomeando o comando.

Sai do texto, nos dois níveis, a instrução atual de não escrever arquivo de handoff. Ela era coerente enquanto handoff não existia como primitiva; agora é a negação exata do comportamento desejado, e deixá-la manteria no produto duas ordens opostas sobre o mesmo assunto.

Quando o projeto não tem planejamento, a oferta continua existindo, com o mesmo comando, porque o handoff não depende de haver diretório de planejamento. Muda só a menção ao estado do projeto.
</action>
<verify><automated>S=$(node -e "console.log(require('crypto').randomUUID())"); node -e "const fs=require('fs'),os=require('os'),path=require('path'); fs.writeFileSync(path.join(os.tmpdir(),'claude-ctx-$S.json'), JSON.stringify({session_id:'$S',remaining_percentage:20,used_pct:78,timestamp:Math.floor(Date.now()/1000)}));" && echo "{\"session_id\":\"$S\",\"cwd\":\"$(pwd)\"}" | node up/hooks/up-context-monitor.js | grep -qi "handoff" && ! grep -qi "Do NOT.*handoff" up/hooks/up-context-monitor.js && echo "monitor ok"</automated></verify>
<done>Com setenta e oito por cento ocupados o gancho emite a oferta em português, citando percentual, limiar, recomendação, motivo e o comando de handoff. A instrução antiga de não escrever handoff não existe mais em nenhum nível.</done>
</task>

<task id="5" type="auto">
<files>up/skills/usando-up/SKILL.md (editar: uma linha canônica mais a consequência prática)</files>
<action>
Escrever a distinção na doutrina, uma vez e num lugar só.

Acrescentar a linha canônica: handoff bifurca, compactar continua. Acompanhada de uma frase curta de consequência prática, dizendo quando usar cada um, e do comando do handoff.

Esta skill é a que o gancho de início de sessão injeta em toda sessão e a que o instalador injeta nos runtimes sem gancho, então escrever aqui é o que faz a distinção chegar aos quatro runtimes sem tocar no instalador. Nenhuma outra superfície redefine a distinção: quem precisar dela aponta para aqui.
</action>
<verify><automated>grep -qi "handoff bifurca" up/skills/usando-up/SKILL.md && test $(grep -rli "handoff bifurca" up/ | wc -l) -eq 1 && echo "doutrina ok"</automated></verify>
<done>A linha canônica existe em exatamente um arquivo do pacote, acompanhada da consequência prática e do comando.</done>
</task>

<task id="6" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/005-green.txt (novo)</files>
<action>
Fechar o verde e rodar os smokes.

Rodar o arquivo de teste até passar inteiro e gravar a saída em `evidencia/005-green.txt`.

Smoke do gancho, exercitando os três níveis: escrever um arquivo de ponte de teste no diretório temporário com carimbo recente e percentual ocupado de sessenta, alimentar o gancho com um payload que carregue o identificador de sessão correspondente, e conferir que ele sai sem emitir nada. Repetir com setenta e cinco e conferir a oferta. Repetir com noventa e conferir a prescrição. Nos três, conferir código de saída zero.

Smoke da configuração: gravar um limiar diferente na configuração de um projeto de teste e conferir que a fronteira de oferta se move junto, o que prova que o número é configurável e não constante escondida.

Smoke de degradação: apagar o arquivo de ponte e conferir que o gancho sai em silêncio; corromper o arquivo de configuração e conferir que o gancho cai no padrão em vez de falhar.
</action>
<verify><automated>node up/bin/lib/zona-segura.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/005-green.txt 2>&1; grep -q "0 failed" .plano/fases/18-contexto-e-revisao/evidencia/005-green.txt && echo '{"session_id":"inexistente","cwd":"'$(pwd)'"}' | node up/hooks/up-context-monitor.js; test $? -eq 0 && npm run test:up && echo "verde e smokes ok"</automated></verify>
<done>O teste passa com zero falhas, os três níveis foram exercitados pelo gancho com código de saída zero, mudar o limiar move a fronteira, e ponte ausente ou configuração corrompida não derrubam o gancho.</done>
</task>

## Critérios de Sucesso

- [ ] O limiar existe como número na configuração do projeto e no molde de projeto novo, com padrão setenta
- [ ] Mudar o número move a fronteira de oferta, e o segundo nível acompanha, aparado em noventa e cinco
- [ ] Abaixo do limiar o gancho não emite nada; do limiar ao segundo nível emite oferta; acima emite prescrição
- [ ] A oferta chega em português, com percentual, limiar, recomendação, motivo e comando de handoff pronto
- [ ] Nos três casos o código de saída é zero, e com ponte ausente ou configuração corrompida o gancho sai em silêncio
- [ ] A instrução antiga de não escrever handoff não existe mais em nenhum nível
- [ ] A distinção entre handoff e compactação aparece escrita em exatamente um arquivo do pacote
- [ ] Par vermelho e verde gravado em `evidencia/005-red.txt` e `evidencia/005-green.txt`

## FORA DE ESCOPO

- **Não implementar a primitiva de handoff.** Vem pronta do plano 001 e aqui é apenas oferecida.
- **Não editar o workflow de construção.** O ponto de chamada da oferta na fronteira entre ondas é do plano 002, que o deixou preparado para degradar em silêncio até esta entrega existir.
- **Não mexer na barra de status.** Ela já calcula a escala descontada e escreve o arquivo de ponte, que é exatamente o que este plano passa a consumir.
- **Não tentar controlar a compactação automática do runtime.** O que o sistema controla é chegar ao ponto de compactar com o fio vivo já gravado fora da janela.
- **Não aplicar o limiar a agentes de execução.** A oferta é para a sessão que orquestra. Subagente nasce com contexto fresco e morre com a tarefa.
