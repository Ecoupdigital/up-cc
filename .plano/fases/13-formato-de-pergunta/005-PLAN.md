---
phase: 13-formato-de-pergunta
plan: 005
type: test
wave: 2
depends_on: [001, 002, 003, 004]
requirements: [PERG-01, PERG-02, PERG-03, PERG-04, PERG-05, PERG-06, REG-01, REG-02, REG-03]
autonomous: true
prova: smoke mais logica vermelho e verde
---

# Fase 13, Plano 005: Prova da fase e regressão zero

## Objetivo

Provar que a fase entregou o que prometeu e que não quebrou nada. Três provas: (a) um verificador
determinístico que compara o inventário do contrato com as tags realmente escritas nas superfícies, visto
falhar contra defeito injetado antes de passar contra o repositório real; (b) o smoke de comportamento, com a
regra de fato exercida num repositório de planejamento populado e o texto literal das sete superfícies
extraído; (c) a regressão zero dos sete comandos, dos quatro runtimes e do projeto com planejamento anterior
ao ciclo.

## Onda

**Onda 2.** Depende dos planos 001, 002, 003 e 004: só faz sentido verificar depois que o contrato existe e
que as superfícies o aplicam.

## Contrato de comportamento dos artefatos tocados

| Artefato | Contrato de comportamento | Arquivo hoje |
|----------|---------------------------|--------------|
| Verificador do contrato de pergunta | Programa determinístico que lê o inventário do contrato, lê as superfícies declaradas e devolve veredito de mão dupla: nenhum identificador declarado sem tag, nenhuma tag sem identificador declarado, nenhum rótulo obrigatório vazio. Roda o próprio caso vermelho contra fixture com defeito injetado a cada execução | `up/bin/lib/perguntas.test.cjs` (novo) |
| Relatório de prova da fase | Documento com as evidências coletadas, legível sem reexecutar nada | `.plano/fases/13-formato-de-pergunta/PROVA.md` (novo) |

Convenção do repositório para teste do lado UP, verificada em 2026-07-25: teste é arquivo `.cjs` com
`assert` nativo, sem framework, executado por `node <arquivo>`. O único exemplo hoje é o teste da biblioteca
de integração com repositório.

## Tarefas

### 1. Escrever o verificador do contrato de pergunta

**Contrato:** dado um diretório raiz, o verificador devolve `{ ok, erros[] }` sem depender de nada além do
sistema de arquivos, e cada erro nomeia o tipo, o identificador e o arquivo.

**Arquivo hoje:** `up/bin/lib/perguntas.test.cjs` (criar).

**O que fazer:** escrever um módulo com a função `verificar(raiz)` que:

1. Lê `<raiz>/up/references/questioning.md` e extrai o inventário com a expressão
   `/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm`, produzindo `{ id, superficie, arquivo }`.
   Erro `inventario_vazio` quando o resultado tem menos de 1 linha. Erro `id_duplicado` quando um
   identificador aparece duas vezes.
2. Para cada arquivo distinto do inventário, lê `<raiz>/<arquivo>` e extrai as tags com
   `/<pergunta id="([^"]+)">([\s\S]*?)<\/pergunta>/g`.
3. Compara nas duas direções: erro `id_declarado_sem_tag` (declarado no inventário, ausente no arquivo) e
   erro `tag_sem_declaracao` (tag no arquivo, ausente do inventário).
4. Para cada tag encontrada, exige as três linhas obrigatórias com conteúdo de pelo menos 3 caracteres depois
   do rótulo: `Pergunta:`, `Recomendo:`, `Porque:`. Faltando ou vazia: erro `rotulo_vazio` nomeando o rótulo.
5. Rejeita placeholder dentro de qualquer tag: `TBD`, `TODO`, `FIXME`. Erro `placeholder`.
6. Exige que cada arquivo do inventário contenha a string `references/questioning.md`, prova de que a
   superfície carrega o contrato. Erro `contrato_nao_carregado`.
7. Nunca lê a própria referência como superfície: se o inventário apontar para ela, erro `inventario_aponta_para_si`.

Estilo obrigatório, seguindo a convenção do repositório: CommonJS, `require` nativo, aspas simples, ponto e
vírgula, indentação de 2 espaços, sem dependência externa, sem escrever em disco fora de diretório temporário.

A raiz padrão é derivada do próprio arquivo (dois níveis acima de `up/bin/lib`), e pode ser sobrescrita pelo
primeiro argumento de linha de comando, para permitir rodar contra fixture.

**Critério de aceite:** `node up/bin/lib/perguntas.test.cjs` executa; a função `verificar` é exportada;
nenhum caminho é embutido além do inventário e da referência.

**Prova:** execução do arquivo.

### 2. Ver o verificador falhar contra defeito injetado e passar contra o real

**Contrato:** o verificador roda o próprio caso vermelho a cada execução. Um verificador que só sabe passar
não é prova; ele precisa demonstrar, na mesma execução, que sabe reprovar.

**Arquivo hoje:** `up/bin/lib/perguntas.test.cjs`, função `main()`.

**O que fazer:** implementar o `main()` em três etapas, com `assert`:

1. **Vermelho.** Montar uma fixture em diretório temporário do sistema: copiar a referência e todos os
   arquivos do inventário preservando os caminhos relativos, e então injetar três defeitos, cada um num
   arquivo diferente quando possível:
   - apagar uma tag de abertura `<pergunta id="...">` (espera `id_declarado_sem_tag`);
   - esvaziar uma linha `Recomendo: ...`, deixando só o rótulo (espera `rotulo_vazio`);
   - acrescentar uma tag `<pergunta id="teste.extra">` com os três rótulos preenchidos (espera
     `tag_sem_declaracao`).
   Rodar `verificar(fixture)` e afirmar `ok === false` e que os três tipos de erro aparecem.
2. **Verde.** Rodar `verificar(raizReal)` e afirmar `ok === true`. Falhando, imprimir a lista de erros
   completa antes de sair com código diferente de zero.
3. Imprimir no fim: `perguntas: vermelho OK (3 defeitos detectados), verde OK (N pontos verificados)`.

Limpar o diretório temporário ao fim, inclusive quando a etapa 2 falha.

**Critério de aceite:** a execução única do arquivo exercita vermelho e verde; a etapa vermelha falha por três
tipos distintos; a etapa verde passa contra o repositório real e reporta 20 pontos verificados.

**Prova:** saída do comando `node up/bin/lib/perguntas.test.cjs` colada no relatório de prova.

### 3. Smoke da regra de fato num repositório com planejamento populado

**Contrato:** num repositório onde o planejamento já responde, o brainstorm não pergunta o que está escrito.
A prova é uma lista de perguntas candidatas com o destino de cada uma: resolvida por leitura, com a fonte
citada, ou escalada como decisão.

**Arquivo hoje:** `.plano/fases/13-formato-de-pergunta/PROVA.md` (criar), seção "Regra de fato".

**O que fazer:** usar como tarefa de teste, fixa e declarada: **"acrescentar uma seção nova ao documento de
estado do projeto"**. Este é o próprio repositório, que tem planejamento populado (estado, requisitos,
roadmap, projeto, desenho do sistema e mapa do codebase). Enumerar no mínimo seis perguntas candidatas que um
agente sem a regra faria, e para cada uma registrar uma linha com três colunas: pergunta candidata, destino
(`fato resolvido` ou `decisão, sobe com recomendação`), e a fonte exata que resolveu (arquivo e trecho) ou a
recomendação emitida.

Cobrir obrigatoriamente estes seis candidatos, porque são os que o planejamento já responde:

1. Qual é a convenção de idioma do texto de interface.
2. Em que fase o projeto está e o que vem depois.
3. Se existe teste automatizado neste repositório e como se roda.
4. Qual é a convenção de nome de arquivo e de função.
5. Quais decisões já foram travadas pelo dono neste ciclo.
6. Qual é o formato do documento de estado hoje.

Fechar a seção com a contagem: quantas candidatas viraram fato resolvido e quantas subiram como decisão. O
aceite é **zero** perguntas emitidas para as seis acima.

**Critério de aceite:** a tabela existe com no mínimo seis linhas; toda linha de fato cita arquivo e trecho;
nenhuma das seis candidatas foi emitida como pergunta.

**Prova:** a própria seção do relatório, com as fontes citadas conferíveis por leitura.

### 4. Smoke das sete superfícies

**Contrato:** as sete superfícies interativas apresentam pergunta com recomendação e motivo. A prova é o texto
literal de cada ponto, extraído do produto, agrupado por superfície.

**Arquivo hoje:** `.plano/fases/13-formato-de-pergunta/PROVA.md`, seção "Sete superfícies".

**O que fazer:** rodar o extrator abaixo e colar a saída na seção, agrupada por superfície:

```bash
node -e "
const fs=require('fs');
const t=fs.readFileSync('up/references/questioning.md','utf-8');
const linhas=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)];
const porSuperficie={};
for(const [,id,sup,arq] of linhas){
  const corpo=(fs.readFileSync(arq,'utf-8').split('<pergunta id=\"'+id+'\">')[1]||'').split('</pergunta>')[0].trim();
  (porSuperficie[sup]=porSuperficie[sup]||[]).push('### '+id+'\n'+corpo);
}
for(const s of Object.keys(porSuperficie)){
  console.log('## '+s+' ('+porSuperficie[s].length+' pontos)');
  console.log(porSuperficie[s].join('\n\n'));
}
"
```

Conferir na saída: sete superfícies distintas, vinte pontos no total, e em cada bloco as linhas `Recomendo:` e
`Porque:` preenchidas com texto e não com reticências.

**Critério de aceite:** a seção lista as sete superfícies pelo nome, com a contagem de pontos de cada uma
somando 20; nenhum bloco com rótulo vazio.

**Prova:** a saída do extrator no relatório.

### 5. Regressão dos sete comandos e dos quatro runtimes

**Contrato:** a instalação continua produzindo os sete comandos nos quatro runtimes, as quatro skills de
doutrina continuam intactas, e a referência do contrato chega aos quatro. Nada disso pode depender de mudança
no instalador, porque a fase não o toca.

**O que fazer:** instalar em diretório temporário, sem tocar na configuração real do dono:

```bash
TMPUP=$(mktemp -d)
CLAUDE_CONFIG_DIR=$TMPUP/claude GEMINI_CONFIG_DIR=$TMPUP/gemini \
OPENCODE_CONFIG_DIR=$TMPUP/opencode CODEX_HOME=$TMPUP/codex \
  node up/bin/install.js --all --global

echo "claude comandos:   $(ls $TMPUP/claude/commands/up/*.md 2>/dev/null | wc -l)"
echo "gemini comandos:   $(ls $TMPUP/gemini/commands/up/*.toml 2>/dev/null | wc -l)"
echo "opencode comandos: $(ls $TMPUP/opencode/command/up-*.md 2>/dev/null | wc -l)"
echo "codex comandos:    $(ls -d $TMPUP/codex/skills/up-*/SKILL.md 2>/dev/null | wc -l)"
echo "claude skills:     $(ls -d $TMPUP/claude/skills/*/ 2>/dev/null | wc -l)"
for r in claude gemini opencode codex; do
  echo "contrato em $r:    $(grep -c contrato_de_pergunta $TMPUP/$r/up/references/questioning.md 2>/dev/null)"
done
```

Valores esperados: 7 comandos em cada um dos quatro runtimes; 11 pastas de skill no alvo Claude (as 4 de
doutrina mais as 7 de comando); contagem maior que zero para o contrato nos quatro runtimes. Conferir também
que as quatro skills de doutrina existem pelo nome:

```bash
ls -d $TMPUP/claude/skills/usando-up $TMPUP/claude/skills/up-brainstorm \
      $TMPUP/claude/skills/up-tdd $TMPUP/claude/skills/up-verificar-antes-de-concluir
rm -rf $TMPUP
```

**Critério de aceite:** todos os valores batem; as quatro skills de doutrina existem; nenhuma escrita fora do
diretório temporário.

**Prova:** saída dos comandos no relatório de prova, seção "Regressão zero".

### 6. Regressão do projeto com planejamento anterior ao ciclo

**Contrato:** projeto cujo diretório de planejamento foi escrito antes deste ciclo continua funcionando sem
migração. Este repositório é o caso de teste: o planejamento dele tem fases do ciclo 1 gravadas em convenção
antiga.

**O que fazer:** primeiro provar por diferença que nenhum executável mudou nesta fase:

```bash
git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs
```

A saída tem que ser **vazia**: a fase não editou nenhuma linha da linha de comando de ferramentas, do
instalador nem dos hooks, e o único arquivo novo em `up/bin` é o verificador.

Depois exercitar os comandos determinísticos contra o planejamento atual:

```bash
for c in "init up" "roadmap analyze" "state-snapshot" "progress bar --raw" "phase-plan-index 3"; do
  node up/bin/up-tools.cjs $c > /dev/null 2>&1 && echo "ok: $c" || echo "FALHOU: $c"
done
```

Todos têm que devolver `ok`. Registrar como observação conhecida, e não como regressão desta fase, que o
índice de planos não enxerga a convenção de nome usada na fase 11 e que o pareamento de resumo falha na fase
3: são falhas anteriores, já cobertas por requisito da fase 17.

**Critério de aceite:** diferença vazia em `up/bin` fora do verificador; cinco comandos com `ok`; a observação
conhecida registrada como pré-existente com o requisito que a cobre.

**Prova:** saída dos comandos no relatório de prova.

### 7. Escrever o relatório de prova e commitar

**Contrato:** a prova da fase é legível sem reexecutar nada, e diz o que foi provado, como, e o que ficou de
fora.

**Arquivo hoje:** `.plano/fases/13-formato-de-pergunta/PROVA.md`.

**O que fazer:** consolidar as seções "Verificador (vermelho e verde)", "Regra de fato", "Sete superfícies",
"Regressão zero" e "Limites da prova". A última declara honestamente o que **não** foi provado: que o
comportamento do modelo em conversa real siga a doutrina em 100% dos casos, porque doutrina é instrução, e o
que se prova aqui é que a instrução existe, é única, é carregada pelas superfícies e cobre os vinte pontos de
pergunta declarados.

Commitar em dois commits atômicos:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "test(pergunta): verificador do contrato com vermelho e verde" --files up/bin/lib/perguntas.test.cjs
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(pergunta): relatorio de prova da fase 13" --files .plano/fases/13-formato-de-pergunta/PROVA.md
```

**Critério de aceite:** o relatório tem as cinco seções; a seção de limites existe e é específica; dois
commits atômicos.

**Prova:** o arquivo e os dois hashes.

## Critérios de aceite do plano

- [ ] O verificador existe, exporta `verificar(raiz)` e aceita raiz por argumento.
- [ ] Uma única execução exercita vermelho (três defeitos injetados detectados) e verde (repositório real).
- [ ] O verde confirma 20 pontos, cobrindo as sete superfícies, sem rótulo vazio e sem placeholder.
- [ ] O smoke da regra de fato mostra as seis candidatas resolvidas por leitura, com fonte citada, e nenhuma
      delas emitida como pergunta.
- [ ] O smoke das sete superfícies traz o texto literal de cada ponto com recomendação e motivo.
- [ ] Os quatro runtimes instalam com sete comandos cada, as quatro skills de doutrina intactas e o contrato
      presente nos quatro.
- [ ] A diferença em `up/bin` fora do verificador é vazia, e os cinco comandos determinísticos passam.
- [ ] O relatório de prova está escrito, com a seção de limites da prova.

## Tipo de prova exigida

**Smoke** para o comportamento das sete superfícies e para a regra de fato (é o que o roadmap exige da fase),
**mais lógica vermelho e verde** para o verificador, que é código e por isso tem que ser visto falhar antes de
passar. A segunda é adição, não substituição: ela protege o formato de pergunta nas fases 14 a 20, que vão
acrescentar pontos novos ao inventário.

<verification>
```bash
node up/bin/lib/perguntas.test.cjs
# esperado: "vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)" e saida 0
git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs
# esperado: vazio
ls .plano/fases/13-formato-de-pergunta/PROVA.md   # esperado: existe
```
</verification>

## Fora de escopo

- **Verificação estática dentro da linha de comando de ferramentas.** O verificador é arquivo de teste do
  repositório, não subcomando novo. Criar subcomando aqui inventaria contrato público que ninguém pediu, e a
  fase 16 já vai mexer na verificação estática por outro motivo.
- **Provar que o modelo obedece à doutrina em conversa real.** Está declarado na seção de limites da prova.
- **Corrigir a leitura das duas convenções de nome de plano e de resumo.** É requisito da fase 17. Aqui só se
  registra como observação pré-existente.
- **Testar as superfícies fora do inventário** (tarefa avulsa, testes, depuração, reset, onboarding,
  governança). Estão fora da fronteira desta fase.
- **Mudar o instalador para acomodar o verificador.** Ele é arquivo de teste dentro de um diretório que já é
  publicado; nada a fazer.
- **Criar runner de teste unificado para o lado UP.** Continua sendo `node <arquivo>`, como o teste que já
  existe.
