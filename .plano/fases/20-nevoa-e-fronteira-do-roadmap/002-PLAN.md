---
phase: 20-nevoa-e-fronteira-do-roadmap
plan: "002"
type: feature
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [WAY-05, WAY-06]
prova: smoke
must_haves:
  truths:
    - "O roadmap tem seção de fora de escopo separada do que foi feito e do que está por fazer, com uma linha de motivo por item"
    - "Item de fora de escopo sem motivo é reprovado por comando, e não por opinião"
    - "Item de fora de escopo que repete texto do histórico de decisões é sinalizado como colisão, e a referência cruzada por número não é colisão"
    - "Roadmap sem a seção devolve veredito neutro, sem reprovar projeto anterior ao ciclo"
  artifacts:
    - path: "up/bin/lib/roadmap-sections.cjs"
      provides: "Leitura da seção de fora de escopo, leitura do histórico de decisões e veredito de higiene da fronteira"
    - path: "up/templates/roadmap.md"
      provides: "Formato canônico da seção de fora de escopo, com a regra de referência cruzada escrita inline"
    - path: "up/references/nevoa-e-fronteira.md"
      provides: "Doutrina de onde cada coisa é escrita: névoa, fora de escopo e histórico de decisões"
  key_links:
    - from: "up/bin/up-tools.cjs (case roadmap)"
      to: "up/bin/lib/roadmap-sections.cjs"
      via: "subcomando novo scope-check"
    - from: "up/bin/lib/roadmap-sections.cjs"
      to: ".plano/STATE.md e .plano/decisoes/"
      via: "leitura do histórico de decisões para detectar duplicação de fronteira"
---

# Fase 20 Plano 002: Fora de escopo como seção separada e fora do histórico de decisões

**Onda:** 2 (roda depois do plano 001, em paralelo com o plano 003)
**Depende de:** plano 001 (usa `findSection`, `sectionPurity`, `normalizeLabel` e `sectionOrder`)
**Tipo de prova:** smoke (leitura do roadmap real deste repositório) somada a teste vermelho e verde sobre a higiene
**Requisitos cobertos:** WAY-05, WAY-06

## Posição no grafo

A fase 20 é a última do ciclo e nada depende dela, o que a torna o corte mais barato se o escopo apertar. Dentro da fase, este plano depende só do núcleo de leitura entregue no plano 001.

## Objetivo

Dar à fronteira do projeto um lugar próprio, separado do que foi feito e do que está por fazer, com uma linha de motivo por item, e garantir por comando que essa fronteira não vaza para o histórico de decisões. O histórico registra a rota efetivamente andada; a fronteira registra as estradas recusadas. Misturar as duas coisas faz o histórico crescer com o que nunca aconteceu, e é exatamente isso que este plano impede.

## Convenção deste plano sobre caminhos

Cada superfície aparece primeiro como contrato público (nome de subcomando, nome de função exportada, nome de seção) e o caminho vem em seguida como localização conferida em 2026-07-25. Se a regra de durabilidade de plano da fase 17 já estiver valendo na execução, o contrato manda e o caminho é conferência.

## Contexto

@up/bin/lib/roadmap-sections.cjs - módulo criado no plano 001, com `findSection`, `sectionPurity`, `normalizeLabel`, `sectionOrder` e a constante `SCOPE_HEADING` já definida
@up/bin/up-tools.cjs - despacho, `case 'roadmap'` por volta da linha 281, seção ROADMAP COMMANDS por volta da linha 1375
@.plano/STATE.md - histórico de decisões real deste repositório: tabela sob `### Decisoes`, linhas soltas no formato `- [Phase N]: texto`, e mais abaixo a tabela de tarefas rápidas, que **não** é histórico de decisões
@.plano/REQUIREMENTS.md - hoje guarda a lista de fora do escopo do ciclo em prosa, que é a origem do conteúdo real da tarefa 5
@up/templates/roadmap.md - template já estendido pelo plano 001 com a seção de névoa

## Regra de não colisão

Este plano roda em paralelo com o plano 003. Os dois editam o arquivo de despacho da linha de comando, em pontos distintos e declarados: **este plano só toca no `case 'roadmap'` e na seção ROADMAP COMMANDS**; o plano 003 abre um `case` novo perto de `classify-task` e não entra no `case 'roadmap'`. Regra dura para os dois: substituição cirúrgica de trecho único, jamais reescrita do arquivo inteiro. Ao terminar, rodar a checagem de sintaxe do arquivo antes de commitar.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/roadmap-sections.cjs (estender o módulo do plano 001)</files>
<action>
Acrescentar a gramática e a leitura da seção de fora de escopo.

Constantes novas no topo, junto das do plano 001:

```javascript
// Gramática de item do fora de escopo: rótulo em negrito, dois pontos, motivo em uma linha.
const SCOPE_ITEM = /^-\s+\*\*([^*]+?)\*\*\s*:\s*(.+?)\s*$/;
// Referência cruzada opcional para um registro de decisão, dentro do motivo.
const SCOPE_DECISION_REF = /\b(?:decis[aã]o|decision)\s+(\d{1,4})\b/i;
```

`parseScope(content)` devolve:
```javascript
{
  section_present: true,
  items: [ { label: '...', reason: '...', decision_ref: null, line: 300 } ],
  count: 3,
  items_without_reason: [ { raw: '- item solto', line: 305 } ],
  purity: { pure: true, problems: [] }
}
```
Regras: dentro da seção recortada por `findSection(content, 'scope')`, toda linha que começa com `- ` é candidata a item. Casou SCOPE_ITEM, vira item com `label`, `reason` e `decision_ref` (o número capturado por SCOPE_DECISION_REF dentro do motivo, ou null). Não casou, entra em `items_without_reason` com a linha crua e o número da linha. Linhas de citação (começando por `>`), linhas em branco e parágrafos comuns são ignorados sem virar problema, porque o bloco de explicação da seção é texto legítimo. `purity` vem de `sectionPurity` sobre o corpo da seção.

Acrescentar `parseScope` e as duas constantes ao objeto de exports, sem remover nada do que o plano 001 exportou.
</action>
<verify><automated>node --check up/bin/lib/roadmap-sections.cjs && node -e "const m=require('./up/bin/lib/roadmap-sections.cjs'); const c='## Fora de escopo\n\n> nota\n\n- **Item A**: motivo A\n- **Item B**: motivo B (ver decisão 0007)\n- item solto\n'; const r=m.parseScope(c); if(r.count!==2) throw new Error('esperado 2 itens, veio '+r.count); if(r.items[1].decision_ref!=='0007') throw new Error('referência não capturada: '+r.items[1].decision_ref); if(r.items_without_reason.length!==1) throw new Error('item sem motivo não detectado'); console.log('parseScope ok');"</automated></verify>
<done>`parseScope` separa item com motivo de item sem motivo, captura a referência a registro de decisão e ignora bloco de citação sem chamar de problema. Nenhum export do plano 001 foi perdido.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/roadmap-sections.cjs (leitura do histórico de decisões e veredito de higiene)</files>
<action>
Acrescentar ao mesmo módulo a leitura do histórico de decisões e o veredito consolidado, que é o que fecha WAY-06.

`readDecisionHistory(cwd)` devolve `{ entries: [ { text, source, file } ] }`, juntando três fontes, todas opcionais:

1. Tabela de decisões do documento de estado. Abrir `.plano/STATE.md`. Localizar o cabeçalho que casa `/^#{2,3}\s+(?:Decis[õo]es|Decisions|Hist[óo]rico de decis[õo]es)\s*$/im` e recortar até o próximo cabeçalho de nível igual ou superior. **Só dentro desse recorte**, cada linha que casa `/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/` vira entrada com `source: 'state-table'`. O recorte é obrigatório e não é detalhe: sem ele, a tabela de tarefas rápidas e a de métricas entrariam como decisão e produziriam colisão falsa, que é o pior desfecho possível para uma checagem que quer ser obedecida.
2. Linhas soltas do mesmo recorte no formato `/^-\s*\[[^\]]*\]:\s*(.+)$/`, com `source: 'state-bullet'`.
3. Registros de decisão em arquivo, quando o diretório `.plano/decisoes/` existir (ele nasce na fase 14 e pode não existir ainda). Para cada arquivo terminado em `.md`, o título é a primeira linha que casa `/^#\s+(.+)$/m`; sem título, usa o nome do arquivo sem extensão. `source: 'decision-record'`, com o nome do arquivo em `file`.

Ausência de qualquer fonte devolve lista vazia, nunca erro.

`scopeCheck(cwd)` é o veredito consolidado:
```javascript
{
  verdict: 'pass' | 'fail' | 'skip',
  section_present: true,
  count: 4,
  items_without_reason: [],
  purity: { pure: true, problems: [] },
  scope_after_phases: true,
  decision_history_collisions: [ { label: '...', entry_text: '...', entry_source: 'state-table' } ],
  problems: [],
  hint: ''
}
```
Regras do veredito:
- Seção ausente devolve `verdict: 'skip'` com `problems: ['secao_ausente']`. **Skip nunca reprova.** Roadmap escrito antes deste ciclo não tem a seção e não pode quebrar por causa disso.
- Seção presente reprova (`fail`) quando existe item sem motivo (`item_sem_motivo`), ou quando a pureza falha (repassar os códigos de `sectionPurity`), ou quando `scope_after_phases` é falso (`fora_de_escopo_antes_das_fases`), ou quando há colisão (`colisao_com_historico_de_decisoes`).
- Colisão é declarada quando `normalizeLabel(item.label) === normalizeLabel(entry.text)` **e** `item.decision_ref` é null. A comparação é igualdade total da chave normalizada, jamais busca por trecho: o objetivo declarado é zero falso positivo, porque checagem que grita à toa é desligada.
- Item que aponta para um registro pelo número é referência cruzada legítima e não colide.
- `hint` traz uma frase em português por problema encontrado, e sempre inclui, no caso de colisão, a regra: o fora de escopo declara a fronteira, o histórico de decisões registra a rota andada, e quando os dois falam do mesmo item a linha do roadmap aponta para o registro pelo número em vez de repetir o motivo.

Acrescentar `readDecisionHistory` e `scopeCheck` ao objeto de exports.
</action>
<verify><automated>node --check up/bin/lib/roadmap-sections.cjs && node -e "const m=require('./up/bin/lib/roadmap-sections.cjs'); const h=m.readDecisionHistory(process.cwd()); if(!Array.isArray(h.entries)) throw new Error('entries deve ser lista'); const t=h.entries.filter(e=>/Adicionar checkpoint de fechamento/i.test(e.text)); if(t.length) throw new Error('tarefa rápida entrou como decisão: recorte falhou'); const r=m.scopeCheck(process.cwd()); if(!['pass','fail','skip'].includes(r.verdict)) throw new Error('veredito inválido'); console.log('historico',h.entries.length,'veredito',r.verdict);"</automated></verify>
<done>`readDecisionHistory` devolve as decisões do recorte correto e não inclui linha da tabela de tarefas rápidas. `scopeCheck` roda contra este repositório sem lançar e devolve `skip` enquanto a seção não existir.</done>
</task>

<task id="3" type="auto">
<files>up/bin/up-tools.cjs (apenas o `case 'roadmap'` e a seção ROADMAP COMMANDS)</files>
<action>
Abrir o subcomando de higiene da fronteira.

Dentro do `case 'roadmap'`, acrescentar um ramo depois do `fog-list` criado no plano 001 e atualizar a mensagem de erro para listar os cinco subcomandos:

```javascript
} else if (sub === 'scope-check') {
  cmdRoadmapScopeCheck(cwd, raw);
} else {
  error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress, fog-list, scope-check');
}
```

Na seção ROADMAP COMMANDS, acrescentar `cmdRoadmapScopeCheck(cwd, raw)` logo depois de `cmdRoadmapFogList`. Ele devolve o objeto de `scopeCheck` acrescido de `roadmap_path`. Saída crua (`--raw`): `"<verdict> (<n> problema(s))"`. Termina em `output(result, raw, rawValue)`, ou seja, **sai sempre com código 0**: quem decide o que fazer com `fail` é o workflow que chamou, igual ao resto da linha de comando.

Não tocar em nenhum outro ramo do despacho. O plano 003 está editando outro ponto do mesmo arquivo em paralelo.
</action>
<verify><automated>node --check up/bin/up-tools.cjs && node up/bin/up-tools.cjs roadmap scope-check --raw && node up/bin/up-tools.cjs roadmap fog-list --raw > /dev/null && node up/bin/up-tools.cjs roadmap analyze --raw > /dev/null && echo "despacho intacto"</automated></verify>
<done>`roadmap scope-check` responde com JSON válido e saída crua legível. O subcomando aberto no plano 001 e os três antigos continuam respondendo.</done>
</task>

<task id="4" type="auto">
<files>up/templates/roadmap.md, up/references/nevoa-e-fronteira.md (arquivo novo)</files>
<action>
**Parte A, template.** Acrescentar a seção de fora de escopo logo depois da seção de névoa (que o plano 001 já colocou depois do progresso), dentro do exemplo de markdown:

```markdown
## Fora de escopo

> O que foi decidido não fazer, e por quê, em uma linha por item. Fica separado do que foi feito e
> do que está por fazer. Esta seção declara fronteira; o histórico de decisões registra a rota
> efetivamente andada. Quando os dois falam do mesmo item, a linha aqui aponta para o registro pelo
> número (ver decisão 0007) em vez de repetir o motivo.

- **Nome do item recusado**: motivo em uma linha
```

Acrescentar às diretrizes do template:
- Cabeçalhos aceitos pela leitura: `## Fora de escopo`, `## Fora do escopo` ou `## Out of scope`.
- Um item por linha, com rótulo em negrito e motivo depois dos dois pontos. Sem motivo, a leitura reprova.
- Adiamento por falta de tempo não é fronteira e não entra aqui.
- Proibido dentro da seção: cabeçalho de detalhe de fase, checkbox de fase e linha da tabela de progresso.

**Parte B, reference de doutrina.** Criar `up/references/nevoa-e-fronteira.md`, curta (alvo de 60 a 90 linhas), respondendo a uma única pergunta: onde cada coisa é escrita. Estrutura obrigatória:

Seção "Três lugares, três funções", com a tabela:

| Lugar | Registra | Não registra |
|-------|----------|--------------|
| Ainda não especificado | O que se pressente e ainda não dá para especificar | O que já dá para enunciar com precisão, que vira fase |
| Fora de escopo | A fronteira: o que foi decidido não fazer, com uma linha de motivo | Adiamento por falta de tempo, que não é fronteira |
| Histórico de decisões | A rota efetivamente andada, com alternativas rejeitadas | Item de fora de escopo repetido, que polui a rota |

Seção "O teste de graduação", com a formulação exata: a pergunta pode ser enunciada com precisão agora, e não a pergunta pode ser respondida agora. Explicar por que essa é a fronteira certa (exigir a resposta trava o item na névoa para sempre; exigir só o enunciado gradua no instante em que o trabalho vira especificável) e trazer um par bom e ruim no mesmo cenário:
- Ruim: uma fase distante escrita no dia um, com critérios de sucesso inventados e detalhe falso.
- Bom: um item de névoa dizendo que em algum momento o usuário vai precisar saber que algo mudou sem abrir o aplicativo, e que ainda não se sabe se o gatilho é evento do servidor ou consulta periódica.
- Graduação: quando dá para escrever a pergunta ("o gatilho é evento do servidor ou consulta periódica?"), o item vira fase, mesmo sem a resposta.

Seção "Quem escreve": quem descobre a névoa durante o questionamento escreve na hora, nunca em lote no fim; quem recebe uma recusa do dono escreve a fronteira no roadmap; o registro de decisão só nasce quando as três condições dele valem.

Seção "Regra de referência cruzada": quando um item de fora de escopo também tem registro de decisão, a linha do roadmap aponta pelo número e não repete o motivo. Justificativa em uma frase: dois textos com o mesmo conteúdo divergem com o tempo, e o que diverge cala.

Seção "Como conferir": os dois comandos de leitura, o que cada veredito significa, e o aviso de que `skip` não reprova.
</action>
<verify><automated>grep -q "Fora de escopo" up/templates/roadmap.md && grep -q "ver decisão" up/templates/roadmap.md && test -f up/references/nevoa-e-fronteira.md && grep -q "enunciada" up/references/nevoa-e-fronteira.md && grep -q "respondida" up/references/nevoa-e-fronteira.md && ! grep -qP "[\x{2014}\x{2013}]" up/templates/roadmap.md up/references/nevoa-e-fronteira.md && echo "template e doutrina ok"</automated></verify>
<done>O template traz a seção de fora de escopo com a gramática que o leitor reconhece e a regra de referência cruzada escrita. A reference existe, declara os três lugares com o que cada um não registra e traz o par bom e ruim no mesmo cenário. Nenhum dos dois arquivos contém travessão.</done>
</task>

<task id="5" type="auto">
<files>up/bin/lib/roadmap-sections.test.cjs (estender o teste do plano 001)</files>
<action>
Acrescentar os casos de fora de escopo ao teste existente, no mesmo estilo (helper `t`, `assert`, saída com código 1 quando falha). **Ver o vermelho antes do verde**: escrever os casos, rodar, registrar a saída vermelha no resumo, então implementar ou corrigir.

Fixtures novas, como constantes de string:
- `SCOPE_BOM`: roadmap com fases, progresso, e seção de fora de escopo com três itens, um deles terminando em `(ver decisão 0007)`.
- `SCOPE_RUIM`: seção com um item sem motivo, um cabeçalho `### Fase 9` dentro da seção e uma linha de tabela de progresso dentro da seção.
- `SCOPE_FORA_DE_ORDEM`: seção de fora de escopo posicionada antes da seção de fases.
- `STATE_COM_DECISOES`: documento de estado com o cabeçalho `### Decisoes`, uma tabela de três linhas (uma delas com texto igual ao rótulo de um item de fora de escopo), duas linhas soltas no formato `- [Phase 11]: texto`, e mais abaixo, fora do recorte, uma tabela de tarefas rápidas cuja linha tem texto igual ao rótulo de outro item de fora de escopo.

Casos:
1. Fora de escopo bom: três itens com motivo, `items_without_reason` vazio, pureza verdadeira, referência capturada no item que a tem.
2. Fora de escopo ruim: `items_without_reason` com um item e `purity.problems` com `fase_dentro_da_secao` e `linha_de_progresso_dentro_da_secao`.
3. Fora de ordem: `scope_after_phases` falso e `verdict: 'fail'` com `fora_de_escopo_antes_das_fases`.
4. Roadmap legado (a fixture do plano 001, sem a seção): `scopeCheck` devolve `verdict: 'skip'` e não reprova.
5. Colisão: com `STATE_COM_DECISOES` em disco, o item cujo rótulo bate com a linha da tabela de decisões produz `fail` com `colisao_com_historico_de_decisoes`.
6. Referência cruzada não colide: o mesmo item, agora com `(ver decisão 0007)` no motivo, produz `pass`.
7. Falso positivo travado: o item cujo rótulo bate com a linha da tabela de tarefas rápidas **não** gera colisão, porque a linha está fora do recorte de decisões. Este caso é o que protege a checagem de virar ruído.
8. Igualdade total, não trecho: um item chamado "migração de storage" não colide com uma decisão chamada "migração de storage do usuário".
9. Registro de decisão em arquivo: com `.plano/decisoes/0007-titulo.md` contendo `# Título da decisão`, um item de fora de escopo com esse mesmo rótulo e sem referência produz colisão com `entry_source: 'decision-record'`.

Os casos que precisam de disco criam repositório temporário com `fs.mkdtempSync` e `.plano/` dentro, e apagam a árvore ao final.
</action>
<verify><automated>node up/bin/lib/roadmap-sections.test.cjs</automated></verify>
<done>Os casos do plano 001 continuam passando e os nove casos novos passam, com o vermelho de pelo menos um registrado antes do verde. Nenhum caso depende de rede.</done>
</task>

<task id="6" type="auto">
<files>.plano/ROADMAP.md (roadmap deste repositório, uso real e não fixture)</files>
<action>
Aplicar a seção de fora de escopo ao roadmap deste próprio repositório, com conteúdo real, logo depois da seção de névoa criada no plano 001. É a prova smoke deste plano.

O conteúdo já existe em prosa nos requisitos, sob a lista de fora do escopo do ciclo. Transcrever como itens, cada um com uma linha de motivo:

- **Doutrina de desabilitar invocação por modelo**: o sistema de origem precisa disso porque não tem orquestrador, e o UP aposta no oposto.
- **Migração de armazenamento para issue tracker**: o diretório de planejamento sobrevive à limpeza de contexto, funciona sem a linha de comando do GitHub e atravessa os quatro runtimes.
- **Port de skill inteira do sistema de origem e comando novo de protótipo**: sobrepõe o brainstorm e o planejamento que já existem, e é inchaço.
- **Corte de sedimento dentro deste ciclo**: é passe de refatoração com briefing próprio, e as fases que tocam template apenas acrescentam campo.
- **Auditoria do eixo de invocação das quatro skills**: fica para passe separado, e o pressentimento correspondente já está registrado na névoa como NEV-02.

Não remover a lista dos requisitos: ela continua sendo o registro do ciclo. A seção do roadmap é a fronteira visível para quem lê o roadmap, que é onde a decisão de escopo é consultada na prática.

Depois de escrever, rodar a higiene e conferir `pass`. Se vier `fail` por colisão com o histórico de decisões, a correção é apontar o número do registro na linha do roadmap, ou reescrever o rótulo para o que ele realmente é. **Proibido corrigir mexendo no leitor**: se o leitor está certo, o texto é que está duplicando.

Commit atômico separado, mensagem `docs(20-002): seção de fora de escopo no roadmap do repositório`.
</action>
<verify><automated>node up/bin/up-tools.cjs roadmap scope-check --raw | grep -q "^pass" && node up/bin/up-tools.cjs roadmap scope-check | grep -q '"count": 5' && node up/bin/up-tools.cjs roadmap analyze --raw | grep -q '"phase_count": 20' && node up/bin/up-tools.cjs roadmap fog-list --raw | grep -q "2 item" && echo "smoke ok"</automated></verify>
<done>O roadmap deste repositório tem a seção de fora de escopo com cinco itens reais, cada um com motivo. A higiene devolve `pass`. A análise do roadmap continua devolvendo 20 fases e a névoa continua com os dois itens do plano 001, ou seja, as duas seções convivem sem se contaminar.</done>
</task>

## Critérios de aceite do plano

Verdadeiro ao fim, conferível por comando:

O roadmap deste repositório tem seção de fora de escopo depois das fases e do progresso, com uma linha de motivo por item, e o template distribuído pelo UP traz o mesmo formato (WAY-05).

A higiene devolve `fail` quando um item de fora de escopo repete texto do histórico de decisões sem apontar o registro pelo número, e devolve `pass` quando a referência cruzada existe (WAY-06).

A checagem não produz colisão falsa a partir da tabela de tarefas rápidas nem a partir de igualdade parcial de texto, o que é provado por dois casos dedicados.

Roadmap sem a seção devolve `skip`, o que preserva projeto anterior a este ciclo.

O despacho da linha de comando continua íntegro depois da edição paralela com o plano 003, conferido por checagem de sintaxe e pelos subcomandos antigos respondendo.

## Tipo de prova

Smoke como prova principal, exercida na tarefa 6 contra o roadmap real deste repositório. Somada a ela, prova de lógica vermelho e verde na tarefa 5 sobre a higiene, incluindo os dois casos que travam falso positivo, que são o que decide se a checagem vai ser obedecida ou desligada.

Registro esperado no log de aprovações, no formato de seis colunas, com escopo `fase=20 plano=002` e evidência `smoke:pass`.

## Fora de escopo

Escrita automática de item de fora de escopo a partir de uma recusa do dono na auditoria: a recusa estrutural vira registro de decisão na fase 19, e este plano apenas garante que os dois lugares não se dupliquem.

Criação do diretório de registros de decisão: nasce na fase 14. Este plano apenas lê o diretório se ele existir, e funciona sem ele.

Migração de conteúdo dos requisitos para o roadmap: a lista dos requisitos permanece onde está, sem remoção.

Graduação de névoa e auto-aborto do planejamento: são os planos 004 e 003 desta fase.

Poda de sedimento no template do roadmap: o template ganha seção nova e nada é removido dele.
