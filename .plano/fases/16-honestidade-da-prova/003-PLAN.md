---
phase: 16-honestidade-da-prova
plan: "003"
type: chore
wave: 3
depends_on: ["002"]
autonomous: true
requirements: [PROVA-02, PROVA-03, PROVA-05]
files_modified:
  - up/references/seams.md
  - up/templates/plan-ready.md
  - up/bin/lib/gate.cjs
  - up/bin/up-tools.cjs
  - up/bin/lib/gate.test.cjs
  - up/agents/up-planejador.md
  - up/agents/up-executor.md
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superfície pública mais alta do sistema que um teste consegue executar"
    justificativa: ""
prova: "logic:test_pass (vermelho e verde sobre a validação do campo de fronteiras)"
must_haves:
  truths:
    - "Plano pronto gerado a partir deste ciclo sem o campo de fronteiras não passa na validação"
    - "Plano pronto anterior ao ciclo passa e registra a ausência como aviso"
    - "Fronteira nomeada como caminho de arquivo é recusada, e rota de rede continua aceita"
    - "Mais de uma fronteira exige justificativa na própria entrada"
    - "A execução escala em vez de inventar fronteira não prevista"
  artifacts:
    - path: "up/references/seams.md"
      provides: "Doutrina do esboço de fronteiras, com as três regras e a proibição de nomear por caminho"
    - path: "up/templates/plan-ready.md"
      provides: "Campo de fronteiras confirmadas e marcador de versão do esquema"
  key_links:
    - from: "subcomando gate plan-ready"
      to: "up/templates/plan-ready.md"
      via: "validação do campo de fronteiras com cláusula de compatibilidade por marcador de esquema"
---

# Fase 16 Plano 003: Fronteiras pré-acordadas, doutrina e validação

<objective>
Fazer o lugar onde o teste encosta virar campo obrigatório do plano pronto, com doutrina escrita, regra de nomeação por contrato público, cláusula de compatibilidade para plano antigo e validação determinística na CLI.
</objective>

**Onda:** 3. **Depende de:** plano 002 (o leitor único já religado, e o rótulo `seams` já reconhecido no vocabulário de leitura).
**Tipo de prova:** lógica, vermelho e verde. A prova de fumaça contra artefatos reais é o plano 004.

## Por que este plano existe

O UP tem TDD por tipo e não tem TDD por lugar. A reference de evidência define QUAL prova, nunca ONDE o teste encosta. Sem lugar acordado, o teste nasce grudado no detalhe interno, morre no primeiro refactor e o gate de evidência vira teatro.

Três regras fecham o buraco, e todas são número, não adjetivo: preferir fronteira existente a nova; usar a mais alta possível; o número ideal é UM, e qualquer número maior carrega justificativa na própria entrada.

E uma regra de nomeação, sem a qual esta fase se anula com a fase 17: a fronteira é nomeada por CONTRATO PÚBLICO (módulo exportado, interface, comando ou rota), nunca por caminho de arquivo.

**Cláusula de compatibilidade, obrigatória:** a exigência vale para plano pronto gerado a partir deste ciclo. Plano pronto pré-existente passa no gate e registra a ausência do campo como aviso, sem bloquear e sem reescrita retroativa.

## Contexto

@up/templates/plan-ready.md - template a estender. Ele ainda descreve aprovações de CEO, chiefs e supervisores: é sedimento conhecido, está fora de escopo, não mexer
@.plano/PLAN-READY.md - exemplo real de plano pronto ANTERIOR a este ciclo, sem frontmatter nenhum. É a fixture do caso legado
@up/bin/lib/gate.cjs - módulo criado no plano 001, que recebe a checagem nova
@up/references/tdd-evidence-types.md - reference irmã, que define o TIPO da prova enquanto esta define o LUGAR

## Tarefas

<task id="1" type="auto">
<files>up/references/seams.md (novo)</files>
<action>
Escrever a doutrina do esboço de fronteiras. Arquivo novo, em português acentuado, sem travessão, no tom operacional de `tdd-evidence-types.md` (referência curta carregada sob demanda, não ensaio).

Seções obrigatórias:

1. **O que é uma fronteira de teste.** Uma frase: é o contrato público onde o teste encosta no sistema. A reference irmã diz QUAL prova; esta diz ONDE.
2. **Como nomear.** Sempre por contrato público, nunca por caminho de arquivo. Os quatro tipos aceitos, com um exemplo cada: `modulo` (módulo exportado e suas funções públicas), `interface` (contrato de tipo ou de formato, por exemplo o frontmatter do plano pronto), `comando` (comando de linha de comando invocado como subprocesso), `rota` (rota de rede, por exemplo `POST /api/auth/login`). Frase explícita: caminho de arquivo não é contrato público, envelhece no primeiro refactor e por isso é recusado pela verificação.
3. **As três regras.** Existente vence nova. Mais alta vence mais baixa. O número ideal é UM, e mais de uma exige justificativa na própria entrada. Uma linha de motivo por regra.
4. **Formato do campo.** Bloco YAML no frontmatter do plano pronto, com as chaves `contrato`, `tipo`, `estado` (`existente` ou `nova`), `nivel` e `justificativa`. Mostrar o bloco preenchido de exemplo.
5. **Exemplo bom e exemplo ruim, lado a lado, no MESMO cenário.** Cenário: testar a leitura do histórico do log de aprovações.
   - Bom: uma entrada, `tipo: comando`, `estado: existente`, nível descrito como a superfície pública mais alta executável por teste.
   - Ruim: três entradas nomeando caminhos de arquivo e função interna, sem justificativa. Anotar, linha a linha, por que cada uma é ruim: nomeia caminho (morre no refactor), desce abaixo do contrato público (testa detalhe) e passa de uma sem justificar (espalha o teste).
6. **Regra de execução (escalada).** A execução fica proibida de criar fronteira de teste não prevista no plano. Ao precisar de uma, para e escala ao dono com a pergunta no formato do ciclo (pergunta, recomendação e motivo), em vez de inventar. Inventar fronteira em tempo de execução devolve o sistema ao estado anterior, com teste grudado no detalhe.
7. **Onde isto é verificado.** Uma linha citando o subcomando `gate plan-ready` e a entrada `evidence=seams:confirmed` no log de aprovações.
</action>
<verify><automated>test -f up/references/seams.md && grep -q "contrato p" up/references/seams.md && grep -qi "ideal" up/references/seams.md && grep -q "seams:confirmed" up/references/seams.md && echo "seams.md ok"</automated></verify>
<done>A reference existe, tem as sete seções, traz o par bom e ruim no mesmo cenário com anotação por linha ruim, e não contém travessão. Imprime `seams.md ok`.</done>
</task>

<task id="2" type="auto">
<files>up/templates/plan-ready.md (editar)</files>
<action>
Acrescentar ao template do plano pronto os dois campos novos. Edição cirúrgica: acrescentar campo, não reorganizar o arquivo.

No bloco de frontmatter YAML do template, depois de `version`, acrescentar:

```yaml
plan_schema: 2         # marcador de esquema. 2 = ciclo com fronteiras confirmadas obrigatorias
seams:                 # fronteiras confirmadas com o dono ANTES do planejamento
  - contrato: ""       # nome do contrato publico. NUNCA caminho de arquivo
    tipo: ""           # modulo | interface | comando | rota
    estado: ""         # existente | nova
    nivel: ""          # quao alto esta a fronteira, em uma frase
    justificativa: ""  # obrigatoria quando ha mais de uma fronteira
fora_de_escopo: []     # o que este plano deliberadamente NAO faz, uma linha por item
```

No corpo do template, depois da seção "Fases Planejadas", acrescentar duas seções:
- `## Fronteiras Confirmadas`, com tabela de quatro colunas (contrato, tipo, estado, nível) e, abaixo, a frase: "Confirmadas com o dono antes do planejamento. A execução está proibida de criar fronteira não listada aqui: ao precisar de uma, escala. Regras em `seams.md`."
- `## Fora de Escopo`, com lista de itens e uma linha de motivo por item.

Nas `<guidelines>`, na parte que descreve como o `/up:build` usa o arquivo, acrescentar um item: antes de executar, o build roda `gate plan-ready`, que bloqueia quando `plan_schema` é 2 ou maior e o campo de fronteiras está ausente, e apenas avisa quando o marcador de esquema está ausente (plano anterior ao ciclo).

NÃO tocar na seção "Aprovacoes Obtidas", que lista CEO, chiefs e supervisores. É sedimento conhecido, com passe próprio, e removê-lo aqui estoura o escopo desta fase.
</action>
<verify><automated>grep -q "plan_schema: 2" up/templates/plan-ready.md && grep -q "Fronteiras Confirmadas" up/templates/plan-ready.md && grep -q "fora_de_escopo" up/templates/plan-ready.md && grep -q "CEO" up/templates/plan-ready.md && echo "template ok"</automated></verify>
<done>O template tem o marcador de esquema, o bloco de fronteiras, o campo de fora de escopo, as duas seções novas no corpo e a nota nas diretrizes. A seção de aprovações antiga continua intacta. Imprime `template ok`.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/gate.test.cjs (editar), .plano/fases/16-honestidade-da-prova/evidencia/003-red.txt (novo)</files>
<action>
Escrever os casos ANTES da implementação e VER FALHAR. Mesma fronteira dos planos anteriores: tudo pela CLI como subprocesso, via `runUpToolsJson`.

Acrescentar um bloco de casos `gate plan-ready` ao arquivo de teste existente. Fixtures escritas pelo teste em projetos temporários, em `.plano/PLAN-READY.md`:

- `legado`: SEM frontmatter, começando direto com `# PLAN-READY`, copiando a forma real que existe hoje neste repositório.
- `novo_ok`: frontmatter com `plan_schema: 2` e uma fronteira completa (`contrato`, `tipo: comando`, `estado: existente`, `nivel` preenchido, `justificativa` vazia).
- `novo_sem_seams`: `plan_schema: 2` e nenhum bloco `seams:`.
- `novo_caminho`: `plan_schema: 2` com uma fronteira cujo contrato é `up/bin/lib/gate.cjs`.
- `novo_rota`: `plan_schema: 2` com uma fronteira cujo contrato é `POST /api/auth/login` e `tipo: rota`.
- `novo_duas_sem_justificativa`: `plan_schema: 2` com duas fronteiras completas e `justificativa` vazia nas duas.
- `novo_tipo_invalido`: `plan_schema: 2` com uma fronteira de `tipo: arquivo`.

Casos e asserções:

1. `legado passa e avisa` - `pass === true`, `legacy === true`, `warnings` contendo `seams_field_missing_legacy` e `errors` vazio.
2. `esquema 2 sem fronteira bloqueia` - `pass === false` e `errors` contendo `seams_field_missing`.
3. `esquema 2 com uma fronteira passa` - `pass === true`, `seam_count === 1`, `errors` vazio.
4. `contrato que parece caminho de arquivo bloqueia` - `errors` contendo `seam_parece_caminho`, `pass === false`.
5. `rota não é confundida com caminho` - `pass === true` e `errors` vazio, apesar das barras no nome.
6. `duas fronteiras sem justificativa bloqueiam` - `errors` contendo `seam_sem_justificativa`.
7. `tipo fora da lista fechada bloqueia` - `errors` contendo `seam_tipo_invalido`.
8. `campo escalar` - `gate plan-ready --field pass` imprime `true` ou `false` sem chaves de JSON.
9. `arquivo ausente não explode` - projeto sem plano pronto: `exists === false`, `pass === false`, `errors` contendo `plan_ready_missing`, e o subprocesso sai com código 0.

Rodar, confirmar RED e gravar em `evidencia/003-red.txt`. Os casos dos planos 001 e 002 continuam no mesmo arquivo e continuam verdes.
</action>
<verify><automated>node up/bin/lib/gate.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/003-red.txt 2>&1; grep -qE "FAIL" .plano/fases/16-honestidade-da-prova/evidencia/003-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 9 casos existem, foram executados e falharam por ausência do subverbo `plan-ready`, com a saída vermelha gravada.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/gate.cjs (editar), up/bin/up-tools.cjs (editar), .plano/fases/16-honestidade-da-prova/evidencia/003-green.txt (novo)</files>
<action>
Implementar a validação e expô-la na mesma fronteira já acordada.

**Em `up/bin/lib/gate.cjs`,** acrescentar e exportar:

`SEAM_TIPOS = ['modulo', 'interface', 'comando', 'rota']` (lista fechada, com comentário dizendo isso).

`pareceCaminho(texto)`, heurística fechada e declarada. Devolve verdadeiro quando qualquer uma vale:
   (a) casa `/(^|\s)(\.{1,2}\/|\/(home|usr|etc|var|opt|tmp)\/)/` (prefixo de sistema de arquivos, relativo ou absoluto);
   (b) casa `/[\w-]+\/[\w./-]*\.(md|js|cjs|mjs|ts|tsx|jsx|py|json|ya?ml|toml|sh|css|html)\b/` (caminho com extensão de arquivo fonte);
   (c) começa com um destes prefixos: `src/`, `lib/`, `app/`, `up/`, `bin/`, `tests/`, `scripts/`, `components/`, `pages/`.
   Comentário obrigatório no código: rota como `POST /api/auth/login` NÃO casa nenhuma das três, e isso é intencional.

`parseSeamsBlock(frontmatterText)`, analisador dedicado. O analisador de frontmatter genérico do up-tools não entende lista de mapeamentos e não deve ser usado aqui.
   1. Achar a linha cujo conteúdo aparado é exatamente `seams:`. Ausente devolve `null`.
   2. Guardar a indentação dessa linha.
   3. Percorrer as linhas seguintes enquanto forem vazias ou tiverem indentação maior que a de `seams:`. Parar na primeira linha não vazia com indentação menor ou igual.
   4. Linha cujo conteúdo aparado começa com `- ` abre entrada nova; o resto dessa linha, se casar `chave: valor`, vira a primeira chave.
   5. Linha que casa `/^\s*([a-z_]+):\s*(.*)$/` e não abre entrada acrescenta chave à entrada corrente; sem entrada corrente, ignora.
   6. Valor tem aspas externas removidas e espaços aparados.
   Devolve array (vazio quando `seams:` existe sem item).

`checkPlanReadySeams({ cwd, planPath })`:
   - Caminho padrão `.plano/PLAN-READY.md` relativo a `cwd`. Leitura em try/catch silencioso.
   - Arquivo ausente: `{ path, exists: false, pass: false, errors: ['plan_ready_missing'], warnings: [], seams: [], seam_count: 0, schema: null, legacy: true }`.
   - `schema`: inteiro de `/^plan_schema:\s*(\d+)/m` dentro do bloco de frontmatter; `null` quando ausente. `legacy = schema === null || schema < 2`.
   - Achados: `seams_field_missing` quando `parseSeamsBlock` devolve `null`; `seams_field_empty` quando devolve array vazio; e por entrada, nesta ordem: `seam_sem_contrato`, `seam_parece_caminho` (citando o contrato no texto do achado), `seam_tipo_invalido`, `seam_estado_invalido`, `seam_sem_nivel`; e `seam_sem_justificativa` quando há mais de uma entrada e alguma tem `justificativa` vazia.
   - **Regra única de compatibilidade:** quando `legacy` é verdadeiro, TODO achado entra em `warnings` com o sufixo `_legacy` e `errors` fica vazio, então `pass` é verdadeiro. Quando `legacy` é falso, os achados entram em `errors` e `pass` é falso. A única exceção é `plan_ready_missing`, que é erro nos dois casos.
   - Devolve `{ path, exists, schema, legacy, seams, seam_count, errors, warnings, pass }`.

**Em `up/bin/up-tools.cjs`,** dentro do `cmdGate` criado no plano 001, acrescentar o subverbo `plan-ready` com as flags `--path <caminho>` e `--field <campo>`, saindo sempre com código 0 (fail-open) e usando `output()` como os demais. Resumo de uma linha para o modo `--raw`: `gate plan-ready: pass=true schema=2 seams=1 avisos=0`. Atualizar o bloco de comentário de uso no topo do arquivo.

Rodar o teste até ficar verde e gravar em `evidencia/003-green.txt`.
</action>
<verify><automated>node up/bin/lib/gate.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/003-green.txt 2>&1; grep -q "0 failed" .plano/fases/16-honestidade-da-prova/evidencia/003-green.txt && node up/bin/up-tools.cjs gate plan-ready --raw</automated></verify>
<done>Todos os casos dos planos 001, 002 e 003 passam. `gate plan-ready` rodado contra o `.plano/PLAN-READY.md` real deste repositório (que não tem frontmatter) devolve `pass=true` com aviso, provando a cláusula de compatibilidade contra artefato real.</done>
</task>

<task id="5" type="auto">
<files>up/agents/up-planejador.md (editar), up/agents/up-executor.md (editar)</files>
<action>
Levar a doutrina aos dois agentes que a exercem, em bloco curto e com ponteiro para a reference (fonte única, sem reexplicar).

**`up/agents/up-planejador.md`**: acrescentar um bloco `<seams>` logo depois do bloco de responsabilidades principais:
- Antes de decompor a fase em tarefas, declarar a fronteira de teste no frontmatter do plano, no bloco `seams:`, com `contrato`, `tipo`, `estado`, `nivel` e `justificativa`.
- As três regras, uma linha cada.
- A proibição de nomear por caminho de arquivo, com a alternativa: nomear pelo contrato público.
- Ponteiro de uma linha: regras completas e o par bom e ruim em `$HOME/.claude/up/references/seams.md`.
- Item novo no self-check interno do agente: "toda tarefa encosta na fronteira declarada, e nenhuma tarefa introduz fronteira nova".

**`up/agents/up-executor.md`**: acrescentar a regra de escalada junto das regras de desvio existentes (regras 1 a 4), como extensão explícita da regra 4 (parar e perguntar):
- Precisar de fronteira de teste não prevista no plano NÃO é desvio auto-corrigível. É parada com escalada.
- O que fazer: parar, retornar mensagem estruturada com a fronteira que faltou, a fronteira declarada no plano e a recomendação com motivo. Não criar a fronteira.
- Ponteiro de uma linha para a reference.
</action>
<verify><automated>grep -q "seams.md" up/agents/up-planejador.md && grep -q "seams.md" up/agents/up-executor.md && grep -qi "fronteira" up/agents/up-executor.md && echo "agentes ok"</automated></verify>
<done>Os dois agentes citam a reference como fonte única, o planejador declara a fronteira no frontmatter e checa isso no self-check, e o executor escala em vez de inventar fronteira. Imprime `agentes ok`.</done>
</task>

## Critérios de Sucesso

- [ ] Cada fronteira é nomeada por contrato público, declara `estado` e `nivel`, e mais de uma exige justificativa na própria entrada
- [ ] Plano pronto com `plan_schema: 2` e sem fronteiras não passa em `gate plan-ready`
- [ ] Plano pronto anterior ao ciclo passa e registra a ausência como aviso, sem bloquear e sem reescrita
- [ ] Contrato que parece caminho de arquivo é recusado, e rota de rede continua aceita
- [ ] A doutrina traz o par bom e ruim no mesmo cenário, com anotação por linha ruim
- [ ] O executor escala ao precisar de fronteira não prevista, em vez de inventar
- [ ] Par vermelho e verde gravado em `evidencia/003-red.txt` e `evidencia/003-green.txt`

## FORA DE ESCOPO

- **Não remover o sedimento do template do plano pronto.** A seção de aprovações de CEO, chiefs e supervisores continua exatamente como está. Este plano só ACRESCENTA campo. O corte de sedimento tem briefing próprio.
- **O campo `fora_de_escopo` entra como campo, sem validação.** Torná-lo obrigatório, verificar o preenchimento e acrescentar o exemplo ruim anotado nos templates de plano é a fase 17. Aqui ele só ganha o lugar no template, para que a fase 17 não precise reabrir este arquivo por causa de um campo.
- **Não reescrever plano pronto existente.** Nenhuma migração, nenhum acréscimo retroativo de `plan_schema` em artefato antigo.
- **Não ligar a validação nos workflows.** O esboço no planejamento, a escrita da entrada no log e o gate de entrada do build são o plano 004.
- **Não implementar a heurística anti-tautologia.** É o plano 005.
- **Não criar comando novo nem flag nova de instalação.** As fronteiras entram pela CLI que já existe.
