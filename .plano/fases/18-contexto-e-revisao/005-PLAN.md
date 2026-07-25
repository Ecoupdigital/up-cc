---
phase: 18-contexto-e-revisao
plan: 005
type: logic
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-03, CTX-09, CTX-10]
objective: "Limiar de zona segura em setenta por cento e monitor de contexto que oferece handoff em vez de so avisar"
prova: logica (vermelho e verde) mais smoke do gancho
files_modified:
  - up/bin/lib/zona-segura.cjs
  - up/bin/lib/zona-segura.test.cjs
  - up/bin/lib/core.cjs
  - up/hooks/up-context-monitor.js
  - up/skills/usando-up/SKILL.md
  - up/templates/config.json
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

**Onda**: 2 (depende do plano 001, porque só se oferece uma ação que já existe)

## Objetivo

Fechar o número que faltava e transformar aviso em oferta.

Hoje o monitor de contexto avisa, em inglês, quando o contexto está quase acabando, e o texto do aviso
chega a mandar explicitamente não escrever handoff. Além disso ele avisa tarde: usa a escala crua de
percentual restante, enquanto a barra que o dono vê usa a escala descontada do espaço reservado para
compactação automática. Quinze por cento restantes na escala crua correspondem à barra já cheia na escala
mostrada. O aviso chega quando a degradação já aconteceu.

Este plano põe as duas pontas na mesma escala, fecha o limiar em número, e troca o aviso por uma oferta
com o comando pronto. E escreve na doutrina, em uma linha, a distinção que impede a confusão mais cara
deste assunto: handoff bifurca, compactar continua.

## Decisão fechada neste planejamento

**Pergunta**: qual o valor padrão do limiar de zona segura, em percentual de janela ocupada?

**Resposta recomendada**: setenta por cento, medido na mesma escala que a barra de status mostra ao dono,
isto é, percentual ocupado da janela utilizável, já descontado o espaço reservado para compactação
automática.

**Motivo**: setenta já é o número que a doutrina de planejamento do próprio sistema usa quando diz que um
plano deve caber na janela sem passar de cerca de setenta por cento. Fixar o mesmo valor faz configuração
e doutrina pararem de discordar. Setenta também é o início da faixa de degradação da curva de qualidade
declarada no sistema (pico até quarenta, bom até sessenta, degradando de sessenta a oitenta, ruim acima
de oitenta), o que deixa dez pontos de margem antes da faixa ruim. Dez pontos são suficientes para
escrever um handoff, porque o handoff é curto por construção: ele referencia em vez de copiar.

**Alternativas rejeitadas**: sessenta por cento, rejeitada porque a oferta apareceria ainda dentro da
faixa boa, e oferta que aparece cedo demais vira papel de parede e deixa de ser lida. Oitenta por cento,
rejeitada porque o handoff seria escrito por um agente já degradado, e o documento vira o prompt da
sessão seguinte, então a degradação se propaga em vez de parar. Manter a escala crua de percentual
restante, rejeitada porque o dono veria um número e o sistema usaria outro, e duas escalas para a mesma
coisa é exatamente o tipo de coisa que este ciclo existe para matar.

**Segundo nível, derivado e não configurável**: limiar mais quinze pontos, com teto em noventa e cinco.
Abaixo do limiar, silêncio. Do limiar até o segundo nível, oferta. Acima do segundo nível, prescrição:
não empurre trabalho degradado, faça o handoff agora. Um único número configurável, o segundo derivado
dele, porque dois botões para a mesma decisão convidam a desregular um sem o outro.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisão D3),
`up/hooks/up-context-monitor.js` (os dois limiares atuais, a supressão por repetição e a detecção de
projeto com planejamento), `up/hooks/up-statusline.js` (onde a escala descontada é calculada e o arquivo
de ponte é escrito), a função de carregamento de configuração em `up/bin/lib/core.cjs` e
`up/skills/usando-up/SKILL.md` (a doutrina que é injetada em todo início de sessão).

O plano 001 entrega o subcomando de handoff. Se ele ainda não estiver concluído no momento da execução,
parar e escalar: oferecer ação inexistente é pior que não oferecer.

## Tarefas

### 1. Escrever os testes da decisão de zona segura e vê-los falhar

Criar `up/bin/lib/zona-segura.test.cjs`, no formato sem framework do repositório.

Casos obrigatórios, todos contra o limiar padrão de setenta: sessenta e nove por cento ocupados devolve
silêncio; setenta devolve oferta, porque o limiar é inclusivo e a fronteira é o próprio número; oitenta e
quatro devolve oferta; oitenta e cinco devolve prescrição; cem devolve prescrição. Com limiar configurado
em cinquenta, cinquenta devolve oferta e sessenta e quatro devolve oferta e sessenta e cinco devolve
prescrição, o que prova que o segundo nível é derivado e não fixo. Com limiar configurado em noventa, o
segundo nível é aparado em noventa e cinco e não em cento e cinco. Limiar ausente na configuração cai no
padrão. Limiar inválido, como texto, zero, negativo ou acima de cem, cai no padrão em vez de lançar,
porque configuração errada não pode derrubar o gancho.

Rodar e registrar a saída vermelha.

### 2. Implementar a decisão de zona segura

Criar `up/bin/lib/zona-segura.cjs`, CommonJS, sem dependência externa, exportando por objeto literal.

Exporta o valor padrão do limiar como constante nomeada, a função de saneamento do limiar configurado e a
função de decisão, que recebe o percentual ocupado e o limiar e devolve o nível, entre silêncio, oferta e
prescrição, mais os dois números usados, para que o texto da mensagem possa citá-los sem recalcular.

A função de decisão é pura: sem leitura de disco, sem data, sem processo. É o que permite testá-la sem
simular o gancho inteiro.

### 3. Publicar o limiar na configuração do projeto

Em `up/bin/lib/core.cjs`, acrescentar a chave nova aos valores padrão do carregamento de configuração,
com o valor decidido, e ao objeto devolvido, seguindo exatamente o padrão das chaves vizinhas, inclusive
o comentário curto que explica a chave, como já existe para as chaves de integração e de teste visual.

Nome da chave em português, como as demais chaves de configuração deste sistema, expressando o que ela é:
percentual de janela ocupada a partir do qual a zona segura acabou.

Acrescentar a mesma chave, com o mesmo valor, ao molde de configuração de projeto em
`up/templates/config.json`, para que projeto novo nasça com o número visível em vez de herdá-lo de um
padrão escondido no código.

Conferir que a leitura por linha de comando da configuração devolve a chave nova sem alteração no código
de leitura, porque ela é genérica sobre o objeto devolvido. Se não for, ajustar apenas o suficiente para
que devolva.

### 4. Trocar aviso por oferta no monitor de contexto

Reescrever a parte de decisão e de mensagem de `up/hooks/up-context-monitor.js`, preservando o que já
funciona: a proteção de tempo limite na leitura da entrada, a saída silenciosa com código zero em
qualquer erro, a leitura do arquivo de ponte escrito pela barra de status, o descarte de métrica velha, a
supressão por repetição e a detecção de projeto com planejamento.

O que muda. O gancho passa a comparar o percentual ocupado, que já vem calculado na escala descontada
dentro do arquivo de ponte, contra o limiar lido da configuração do projeto, usando a biblioteca da
tarefa 2. Os dois limiares crus atuais saem. A resolução da biblioteca usa as duas candidaturas de
caminho, layout de repositório e layout instalado, como o gancho de início de sessão já faz para achar a
skill de bootstrap. Se a biblioteca não for encontrada, o gancho sai em silêncio, como sempre.

O texto das mensagens passa a ser português com acentuação, alinhado à convenção do produto, e passa a
ser oferta em vez de aviso. No nível de oferta: declarar o percentual ocupado e o limiar, dizer que a
zona segura acabou e que não se empurra trabalho degradado, e oferecer duas saídas no formato de pergunta
da fase 13, com a recomendada primeiro e o motivo dela. A recomendada é fazer o handoff agora, com o
comando pronto e os campos que precisam ser preenchidos, mais a instrução de que a sessão seguinte começa
lendo o documento gerado. A outra é seguir assumindo a degradação.

No nível de prescrição, a oferta vira instrução: não iniciar trabalho novo, fechar o que está em voo e
fazer o handoff agora. O texto continua nomeando o comando.

Sai do texto, nos dois níveis, a instrução atual de não escrever arquivo de handoff. Ela era coerente
enquanto handoff não existia como primitiva; agora ela é a negação exata do comportamento desejado, e
deixá-la seria manter no produto duas ordens opostas sobre o mesmo assunto.

Quando o projeto não tem planejamento, a oferta continua existindo, com o mesmo comando, porque o handoff
não depende de haver diretório de planejamento. O que muda é só a menção ao estado do projeto.

### 5. Escrever a distinção na doutrina

Em `up/skills/usando-up/SKILL.md`, acrescentar a linha canônica: handoff bifurca, compactar continua. A
linha vem acompanhada de uma frase curta de consequência prática, dizendo quando usar cada um, e do
comando do handoff. Uma linha, um lugar. Nenhuma outra superfície redefine a distinção: quem precisar
dela aponta para aqui.

Esta skill é a que o gancho de início de sessão injeta em toda sessão e a que o instalador injeta nos
runtimes sem gancho, então escrever aqui é o que faz a distinção chegar aos quatro runtimes sem tocar no
instalador.

### 6. Ver os testes passarem e rodar o smoke do gancho

Rodar o arquivo de teste e registrar a saída verde.

Smoke do gancho, exercitando os três níveis: escrever um arquivo de ponte de teste no diretório
temporário com carimbo recente e percentual ocupado de sessenta, alimentar o gancho com um payload de
teste que carregue o identificador de sessão correspondente, e conferir que ele sai sem emitir nada.
Repetir com setenta e cinco e conferir que a saída traz a oferta, com o percentual, o limiar e o comando
de handoff. Repetir com noventa e conferir que a saída traz a prescrição. Conferir nos três casos que o
código de saída é zero.

Smoke da configuração: gravar um limiar diferente na configuração de um projeto de teste e conferir que a
fronteira de oferta se move junto, o que prova que o número é configurável e não constante escondida.

Smoke de degradação: apagar o arquivo de ponte e conferir que o gancho sai em silêncio, e corromper o
arquivo de configuração e conferir que o gancho cai no padrão em vez de falhar.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/bin/lib/zona-segura.cjs` | Novo. Função pura de decisão de nível contra o limiar, mais o padrão e o saneamento. Sem disco, sem data, sem processo |
| `up/bin/lib/zona-segura.test.cjs` | Novo. Testes sem framework das onze regras de fronteira e de degradação |
| `up/bin/lib/core.cjs` | Editado. Chave nova nos valores padrão e no objeto devolvido pelo carregamento de configuração, no padrão das vizinhas |
| `up/hooks/up-context-monitor.js` | Editado. Passa a decidir pela escala ocupada contra o limiar configurado, e a oferecer o handoff em português. Preserva tempo limite, saída silenciosa, descarte de métrica velha e supressão por repetição |
| `up/templates/config.json` | Editado. Chave nova com o valor decidido, para projeto novo nascer com o número visível |
| `up/skills/usando-up/SKILL.md` | Editado. Linha canônica da distinção entre handoff e compactação, com a consequência prática e o comando |

## Critério de aceite

O limiar existe como número no arquivo de configuração do projeto e no molde de projeto novo, com valor
padrão setenta, e a leitura por linha de comando o devolve. Mudar o número na configuração move a
fronteira de oferta, e o segundo nível acompanha, aparado em noventa e cinco.

Abaixo do limiar o gancho não emite nada. Do limiar ao segundo nível ele emite oferta, em português, com
percentual ocupado, limiar, recomendação, motivo e o comando de handoff pronto. Acima do segundo nível
ele emite prescrição. Nos três casos o código de saída é zero, e com arquivo de ponte ausente ou
configuração corrompida ele sai em silêncio.

A instrução antiga de não escrever handoff não existe mais em nenhum dos dois níveis. A distinção entre
handoff e compactação aparece escrita em um único lugar da doutrina.

Os testes rodam verdes e foram vistos vermelhos antes.

## Tipo de prova

Lógica, vermelho e verde, para a decisão de nível, com as fronteiras exatas testadas. Smoke para o gancho
e para a configuração, conforme a tarefa 6.

## FORA DE ESCOPO

A primitiva de handoff. Vem pronta do plano 001 e aqui é apenas oferecida.

O ponto de chamada da oferta na fronteira entre ondas do workflow de construção. É do plano 002, que o
deixou preparado para degradar em silêncio até esta entrega existir.

A barra de status. Ela já calcula a escala descontada e escreve o arquivo de ponte, que é exatamente o
que este plano passa a consumir. Mudar a barra não é necessário e não entra.

Compactação automática do runtime. O sistema não a controla; o que ele controla é chegar ao ponto de
compactar com o fio vivo já gravado fora da janela.

Aplicar o limiar a agentes de execução. A oferta é para a sessão que orquestra. Subagente nasce com
contexto fresco e morre com a tarefa.
