---
phase: 10-integracao-roadmap
plan: 10-002
type: feature
autonomous: true
wave: 1
depends_on: [10-001]
requirements: [INTEG-02]
must_haves:
  truths:
    - "Apos /up:melhorias, usuario ve lista de sugestoes e pode aprovar/rejeitar cada uma via multiSelect"
    - "Apos /up:ideias, usuario ve lista de sugestoes e pode aprovar/rejeitar cada uma via multiSelect"
    - "Sugestoes aprovadas sao enviadas ao CLI que gera fases no ROADMAP.md"
    - "Usuario ve resumo das fases geradas com proximos passos"
  artifacts:
    - path: "up/workflows/melhorias.md"
      provides: "Passo 8 com aprovacao interativa e chamada ao CLI generate-from-report"
    - path: "up/workflows/ideias.md"
      provides: "Passo 8 com aprovacao interativa e chamada ao CLI generate-from-report"
    - path: "up/commands/melhorias.md"
      provides: "AskUserQuestion na lista de allowed-tools (ja esta)"
    - path: "up/commands/ideias.md"
      provides: "AskUserQuestion na lista de allowed-tools (ja esta)"
  key_links:
    - from: "workflows/melhorias.md Passo 8"
      to: "up-tools.cjs phase generate-from-report"
      via: "Chamada CLI com IDs aprovados"
    - from: "workflows/ideias.md Passo 8"
      to: "up-tools.cjs phase generate-from-report"
      via: "Chamada CLI com IDs aprovados"
---

# Fase 10 Plano 002: Apresentacao interativa e integracao nos workflows

**Objetivo:** Adicionar passo de aprovacao interativa (Passo 8) aos workflows de melhorias e ideias, permitindo que o usuario selecione sugestoes para converter em fases do ROADMAP via o CLI `phase generate-from-report` criado no plano 001.

## Pesquisa Inline (achados)

1. **Workflows melhorias.md e ideias.md:** Ambos terminam no Passo 7 (Apresentar relatorio e concluir) com instrucao explicita "NAO committar automaticamente". O Passo 8 sera adicionado APOS o Passo 7, como etapa opcional gatilhada por pergunta ao usuario.

2. **AskUserQuestion multiSelect:** Confirmado suporte em discutir-fase.md (linha 148) e novo-projeto.md (linha 551). Formato:
   ```
   AskUserQuestion(
     header: "Titulo",
     question: "Pergunta",
     multiSelect: true,
     options: [
       { label: "MELH-001: Titulo", description: "Esforco P, Impacto G - Quick Win" },
       ...
     ]
   )
   ```

3. **Ambos commands ja incluem AskUserQuestion** no allowed-tools -- melhorias.md (linha 13) e ideias.md (linha 15). Nao precisa alterar commands.

4. **Formato de apresentacao:** As sugestoes no Passo 7 ja foram apresentadas. O Passo 8 deve apresentar uma lista compacta (ID + titulo + quadrante) para selecao rapida, sem repetir todos os detalhes.

5. **Fluxo gatilhado:** O Passo 8 so executa se o usuario tiver um ROADMAP.md (standalone com .plano/) ou se quiser criar um. Se nao existir .plano/ROADMAP.md, oferecer criar estrutura minima ou pular.

## Contexto

@up/workflows/melhorias.md -- Workflow de auditoria, adicionar Passo 8
@up/workflows/ideias.md -- Workflow de ideacao, adicionar Passo 8
@up/commands/melhorias.md -- Command de melhorias (verificar allowed-tools)
@up/commands/ideias.md -- Command de ideias (verificar allowed-tools)
@up/references/ui-brand.md -- Padrao visual para banners e formatacao

## Tarefas

<task id="1" type="auto">
<files>up/workflows/melhorias.md</files>
<action>
Adicionar "Passo 8: Aprovacao interativa e integracao com roadmap" ao workflow melhorias.md, APOS o Passo 7 existente e ANTES da tag `</process>`.

**Conteudo exato do Passo 8 a inserir:**

```markdown
---

**Passo 8: Aprovacao interativa e integracao com roadmap (opcional)**

Este passo permite converter sugestoes aprovadas em fases executaveis no ROADMAP.md.

1. Perguntar ao usuario se quer integrar sugestoes ao roadmap:

```
AskUserQuestion(
  header: "Integrar ao Roadmap",
  question: "Deseja converter sugestoes aprovadas em fases no ROADMAP.md?",
  multiSelect: false,
  options: [
    { label: "Sim, selecionar sugestoes", description: "Escolher quais sugestoes viram fases executaveis" },
    { label: "Nao, apenas o relatorio", description: "Manter apenas o relatorio como referencia" }
  ]
)
```

Se usuario escolher "Nao": sair com mensagem "Relatorio salvo em .plano/melhorias/RELATORIO.md. Use /up:melhorias novamente para integrar ao roadmap quando quiser."

2. Se sim, ler `.plano/melhorias/RELATORIO.md` e extrair todas as sugestoes (ID + titulo + quadrante).

3. Apresentar sugestoes agrupadas por quadrante para selecao:

```
AskUserQuestion(
  header: "Selecionar Sugestoes",
  question: "Quais sugestoes devem virar fases no roadmap? (Quick Wins recomendados primeiro)",
  multiSelect: true,
  options: [
    // Quick Wins primeiro (recomendados)
    { label: "MELH-001: [titulo]", description: "Quick Win | Esforco P, Impacto G | [dimensao]" },
    { label: "MELH-003: [titulo]", description: "Quick Win | Esforco P, Impacto M | [dimensao]" },
    // Depois Projetos Estrategicos
    { label: "MELH-005: [titulo]", description: "Estrategico | Esforco M, Impacto G | [dimensao]" },
    // Depois Preenchimentos
    { label: "MELH-008: [titulo]", description: "Preenchimento | Esforco P, Impacto P | [dimensao]" },
    // Nunca incluir quadrante "Evitar" na lista
  ]
)
```

**IMPORTANTE:** NAO incluir sugestoes do quadrante "Evitar" na lista de opcoes. Se o usuario perguntar, explicar que sugestoes com alto esforco e baixo impacto nao sao recomendadas para o roadmap.

4. Verificar se existe `.plano/ROADMAP.md`:
   - Se existe: usar diretamente
   - Se NAO existe: perguntar ao usuario:
     ```
     AskUserQuestion(
       header: "Criar Roadmap",
       question: "Nao existe ROADMAP.md. Deseja criar um para adicionar as fases?",
       multiSelect: false,
       options: [
         { label: "Sim, criar roadmap", description: "Cria .plano/ROADMAP.md com as fases selecionadas" },
         { label: "Nao, cancelar", description: "Manter apenas o relatorio" }
       ]
     )
     ```
     Se sim, criar ROADMAP.md minimo:
     ```bash
     mkdir -p .plano
     ```
     Escrever `.plano/ROADMAP.md` com:
     ```markdown
     # Roadmap: [nome do projeto de package.json ou diretorio]

     ## Fases

     ## Detalhes das Fases

     ## Tabela de Progresso

     | Fase | Planos Completos | Status | Completado |
     |------|-----------------|--------|------------|
     ```

5. Chamar CLI para gerar fases:

```bash
echo '{"source":"melhorias","report_path":".plano/melhorias/RELATORIO.md","approved_ids":["MELH-001","MELH-003","MELH-005"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
```

Substituir approved_ids pela lista real selecionada pelo usuario.

6. Parsear resultado JSON e apresentar resumo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > FASES GERADAS NO ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Para cada fase criada:]
Fase [N]: [Nome]
  Sugestoes: [IDs listados]
  Diretorio: [caminho]

Total: [N] fases criadas com [M] sugestoes

───────────────────────────────────────────────────────────────

## Proximos Passos

Para cada fase gerada:
1. `/up:discutir-fase [N]` — Refinar escopo e decisoes
2. `/up:planejar-fase [N]` — Criar planos de execucao
3. `/up:executar-fase [N]` — Implementar

<sub>/clear primeiro — janela de contexto limpa</sub>

───────────────────────────────────────────────────────────────
```
```

**Detalhes de implementacao:**
- Inserir APOS a linha que contem "NAO committar automaticamente" no Passo 7 e ANTES de `</process>`
- Manter separador `---` entre passos
- O Passo 8 e claramente marcado como "(opcional)" no titulo
- Usar exatamente o padrao de `AskUserQuestion` ja usado no Passo 2 (com `header`, `question`, `multiSelect`, `options`)
- Para extrair sugestoes do RELATORIO.md: usar regex `### (MELH-\d+): (.+)` para capturar ID e titulo; parsear a tabela de campos logo abaixo para Esforco/Impacto/Dimensao; determinar quadrante pelo cabecalho da secao onde a sugestao aparece (Quick Wins, Projetos Estrategicos, Preenchimentos, Evitar)
- Labels no multiSelect devem ser curtos: "MELH-001: Titulo curto" (max ~60 chars)
- Description complementa: "Quick Win | Esforco P, Impacto G | Performance"
</action>
<verify>
<automated>cd /home/projects/up-dev-code && node -e "
const fs = require('fs');
const content = fs.readFileSync('up/workflows/melhorias.md', 'utf-8');

// Verificar que Passo 8 existe
if (!content.includes('Passo 8')) {
  console.error('FALHOU: Passo 8 nao encontrado em melhorias.md');
  process.exit(1);
}

// Verificar que menciona generate-from-report
if (!content.includes('generate-from-report')) {
  console.error('FALHOU: Referencia ao CLI generate-from-report nao encontrada');
  process.exit(1);
}

// Verificar que tem AskUserQuestion com multiSelect
if (!content.includes('multiSelect: true')) {
  console.error('FALHOU: AskUserQuestion multiSelect nao encontrado');
  process.exit(1);
}

// Verificar que Passo 7 ainda existe
if (!content.includes('Passo 7')) {
  console.error('FALHOU: Passo 7 foi removido acidentalmente');
  process.exit(1);
}

// Verificar que exclui quadrante Evitar
if (!content.includes('Evitar')) {
  console.error('FALHOU: Nao menciona exclusao do quadrante Evitar');
  process.exit(1);
}

console.log('PASSOU: melhorias.md tem Passo 8 com aprovacao interativa');
"
</automated>
</verify>
<done>Workflow melhorias.md tem Passo 8 opcional que: pergunta se quer integrar ao roadmap, apresenta sugestoes via multiSelect agrupadas por quadrante (excluindo Evitar), chama CLI generate-from-report, e apresenta resumo das fases geradas com proximos passos.</done>
</task>

<task id="2" type="auto">
<files>up/workflows/ideias.md</files>
<action>
Adicionar "Passo 8: Aprovacao interativa e integracao com roadmap (opcional)" ao workflow ideias.md, APOS o Passo 7 existente e ANTES da tag `</process>`.

O Passo 8 de ideias.md e IDENTICO em estrutura ao de melhorias.md (tarefa 1), com estas diferencas:

**Diferencas de melhorias -> ideias:**

1. **IDs:** `IDEA-NNN` em vez de `MELH-NNN`
   - Regex de extracao: `### (IDEA-\d+): (.+)`

2. **Source no JSON:** `"source":"ideias"` em vez de `"source":"melhorias"`

3. **Report path:** `".plano/ideias/RELATORIO.md"` em vez de `".plano/melhorias/RELATORIO.md"`

4. **Organizacao por ICE score em vez de quadrantes:**
   O RELATORIO.md de ideias usa ICE scoring (Impact x Confidence x Ease), nao quadrantes esforco x impacto.

   A lista de selecao deve ser ordenada por ICE score decrescente:
   ```
   AskUserQuestion(
     header: "Selecionar Ideias",
     question: "Quais ideias devem virar fases no roadmap? (Maior ICE score = maior retorno)",
     multiSelect: true,
     options: [
       // Ordenadas por ICE decrescente
       { label: "IDEA-001: [titulo]", description: "ICE: 648 | must-have | I:9 C:9 E:8" },
       { label: "IDEA-003: [titulo]", description: "ICE: 480 | performance | I:8 C:8 E:7.5" },
       { label: "IDEA-007: [titulo]", description: "ICE: 280 | delighter | I:7 C:5 E:8" },
     ]
   )
   ```

5. **Excluir anti-features:** NAO incluir sugestoes da secao "Anti-Features" na lista de selecao. Se o usuario perguntar, explicar que anti-features sao features que NAO devem ser implementadas.

6. **Mensagem de saida se usuario escolher nao:** "Relatorio salvo em .plano/ideias/RELATORIO.md. Use /up:ideias novamente para integrar ao roadmap quando quiser."

7. **Texto dos banners:** "UP > FASES GERADAS NO ROADMAP" (igual)

**Restante identico:** Mesma logica de verificar ROADMAP.md, criar se nao existe, chamar CLI, apresentar resumo com proximos passos.

**Para extrair sugestoes do RELATORIO.md de ideias:** Usar regex `### (IDEA-\d+): (.+)` para ID e titulo. Extrair ICE score da tabela de campos ou da secao de ranking. Extrair categoria (must-have, performance, delighter) da mesma tabela.

**Detalhes de implementacao:**
- Inserir APOS a linha "NAO committar automaticamente" no Passo 7 e ANTES de `</process>`
- Manter separador `---` entre passos
- Passo 8 marcado como "(opcional)"
- Detectar anti-features pela secao "## Anti-Features" no RELATORIO e excluir da lista
</action>
<verify>
<automated>cd /home/projects/up-dev-code && node -e "
const fs = require('fs');
const content = fs.readFileSync('up/workflows/ideias.md', 'utf-8');

// Verificar que Passo 8 existe
if (!content.includes('Passo 8')) {
  console.error('FALHOU: Passo 8 nao encontrado em ideias.md');
  process.exit(1);
}

// Verificar que menciona generate-from-report
if (!content.includes('generate-from-report')) {
  console.error('FALHOU: Referencia ao CLI generate-from-report nao encontrada');
  process.exit(1);
}

// Verificar que tem AskUserQuestion com multiSelect
if (!content.includes('multiSelect: true')) {
  console.error('FALHOU: AskUserQuestion multiSelect nao encontrado');
  process.exit(1);
}

// Verificar que usa IDEA- (nao MELH-)
if (!content.includes('IDEA-')) {
  console.error('FALHOU: Nao referencia IDs IDEA-');
  process.exit(1);
}

// Verificar que menciona source ideias
if (!content.includes('ideias')) {
  console.error('FALHOU: Source ideias nao mencionado');
  process.exit(1);
}

// Verificar que Passo 7 ainda existe
if (!content.includes('Passo 7')) {
  console.error('FALHOU: Passo 7 foi removido acidentalmente');
  process.exit(1);
}

// Verificar que exclui anti-features
if (!content.includes('anti-feature') && !content.includes('Anti-Feature') && !content.includes('anti-features') && !content.includes('Anti-Features')) {
  console.error('FALHOU: Nao menciona exclusao de anti-features');
  process.exit(1);
}

console.log('PASSOU: ideias.md tem Passo 8 com aprovacao interativa e ICE scoring');
"
</automated>
</verify>
<done>Workflow ideias.md tem Passo 8 opcional que: pergunta se quer integrar ao roadmap, apresenta ideias via multiSelect ordenadas por ICE score (excluindo anti-features), chama CLI generate-from-report com source=ideias, e apresenta resumo das fases geradas com proximos passos.</done>
</task>

<task id="3" type="auto">
<files>up/commands/melhorias.md</files>
<files>up/commands/ideias.md</files>
<files>commands/up/melhorias.md</files>
<files>commands/up/ideias.md</files>
<action>
Sincronizar as copias dos commands na raiz com as fontes canonicas em up/commands/.

1. **Verificar se `commands/up/melhorias.md` e `commands/up/ideias.md` existem na raiz.** Se existirem, copiar o conteudo atualizado de `up/commands/melhorias.md` e `up/commands/ideias.md` para eles. Se nao existirem, criar com conteudo identico.

2. **Verificar allowed-tools:** Ambos commands ja incluem `AskUserQuestion` e `Bash` no allowed-tools (confirmado na pesquisa). Nao precisa adicionar tools extras.

3. **Atualizar objective/description dos commands para mencionar integracao com roadmap:**

Em `up/commands/melhorias.md`, adicionar ao final do `<objective>`:
```
Optionally, after reviewing results, user can select suggestions to convert into executable phases in ROADMAP.md.
```

Em `up/commands/ideias.md`, adicionar ao final do `<objective>`:
```
Optionally, after reviewing results, user can select ideas to convert into executable phases in ROADMAP.md.
```

Em `up/commands/melhorias.md`, adicionar ao `<context>`:
```
**Integration with roadmap:** After the audit completes, the user can optionally select suggestions to convert into ROADMAP.md phases. Requires the `phase generate-from-report` CLI subcommand.
```

Em `up/commands/ideias.md`, adicionar ao `<context>`:
```
**Integration with roadmap:** After ideation completes, the user can optionally select ideas to convert into ROADMAP.md phases. Requires the `phase generate-from-report` CLI subcommand.
```

4. **Copiar atualizados para raiz:**
- `up/commands/melhorias.md` -> `commands/up/melhorias.md`
- `up/commands/ideias.md` -> `commands/up/ideias.md`

Usar conteudo identico (copiar byte-a-byte). Fonte canonica e sempre `up/commands/`.
</action>
<verify>
<automated>cd /home/projects/up-dev-code && node -e "
const fs = require('fs');

// Verificar que commands existem em ambos locais
const pairs = [
  ['up/commands/melhorias.md', 'commands/up/melhorias.md'],
  ['up/commands/ideias.md', 'commands/up/ideias.md']
];

for (const [src, dst] of pairs) {
  if (!fs.existsSync(src)) {
    console.error('FALHOU: ' + src + ' nao existe');
    process.exit(1);
  }
  if (!fs.existsSync(dst)) {
    console.error('FALHOU: ' + dst + ' nao existe (copia raiz)');
    process.exit(1);
  }
  const srcContent = fs.readFileSync(src, 'utf-8');
  const dstContent = fs.readFileSync(dst, 'utf-8');
  if (srcContent !== dstContent) {
    console.error('FALHOU: ' + src + ' e ' + dst + ' divergem');
    process.exit(1);
  }
  // Verificar que menciona roadmap
  if (!srcContent.includes('roadmap') && !srcContent.includes('ROADMAP')) {
    console.error('FALHOU: ' + src + ' nao menciona integracao com roadmap');
    process.exit(1);
  }
}

console.log('PASSOU: Commands sincronizados e atualizados com mencao a roadmap');
"
</automated>
</verify>
<done>Commands melhorias e ideias atualizados com mencao a integracao com roadmap no objective e context. Copias na raiz sincronizadas com fontes canonicas.</done>
</task>

## Criterios de Sucesso

- [ ] Workflow melhorias.md tem Passo 8 com aprovacao interativa via multiSelect
- [ ] Workflow ideias.md tem Passo 8 com aprovacao interativa via multiSelect (ICE scoring)
- [ ] Sugestoes do quadrante "Evitar" excluidas da selecao em melhorias
- [ ] Anti-features excluidas da selecao em ideias
- [ ] Fluxo gatilhado: usuario escolhe se quer integrar ou apenas manter relatorio
- [ ] ROADMAP.md criado automaticamente se nao existir
- [ ] CLI generate-from-report chamado com IDs aprovados
- [ ] Resumo das fases geradas apresentado com proximos passos
- [ ] Commands sincronizados entre up/commands/ e commands/up/
