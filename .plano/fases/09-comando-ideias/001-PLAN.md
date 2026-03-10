---
phase: 09-comando-ideias
plan: 09-001
type: feature
autonomous: true
wave: 0
depends_on: []
requirements: [IDEIA-01, INFRA-04]
must_haves:
  truths:
    - "up-tools.cjs responde a 'init ideias' retornando JSON com planning_exists, ideias_dir, ideias_exists, date, stack_hints"
    - "Arquivo up/commands/ideias.md existe com frontmatter valido e referencia ao workflow ideias.md"
    - "Copia raiz existe em commands/up/ideias.md e e identica a fonte canonica"
    - "/up:ajuda lista o comando /up:ideias na secao Auditoria"
  artifacts:
    - path: "up/bin/up-tools.cjs"
      provides: "cmdInitIdeias com deteccao standalone e stack hints (espelha cmdInitMelhorias)"
    - path: "up/commands/ideias.md"
      provides: "Slash command /up:ideias com frontmatter e estrutura XML"
    - path: "commands/up/ideias.md"
      provides: "Copia raiz do command para instalacao local"
    - path: "up/commands/ajuda.md"
      provides: "/up:ideias listado na secao Auditoria e nos fluxos de trabalho comuns"
  key_links:
    - from: "up/commands/ideias.md"
      to: "up/workflows/ideias.md"
      via: "@~/.claude/up/workflows/ideias.md no execution_context"
    - from: "up/workflows/ideias.md (futuro, plano 002)"
      to: "up/bin/up-tools.cjs"
      via: "node $HOME/.claude/up/bin/up-tools.cjs init ideias"
---

# Fase 9 Plano 1: Infraestrutura do comando /up:ideias

**Objetivo:** Criar o command file, a funcao CLI init, a copia raiz e a entrada na ajuda necessarios para que o workflow (plano 002) possa ser executado. Este plano entrega a camada de entry point e infraestrutura CLI, espelhando exatamente o padrao da Fase 7 (melhorias).

## Pesquisa Inline -- Achados

**Padrao init melhorias (up-tools.cjs linhas 699-735) -- reusar para ideias:**
- Funcao `cmdInitMelhorias(cwd, raw)` retorna JSON com: `planning_exists`, `melhorias_dir`, `melhorias_exists`, `has_claude_md`, `has_package_json`, `date`, `timestamp`, `commit_docs`, `stack_hints`
- Stack hints detectados via leitura de `package.json` (react, next, vue, nuxt, svelte, tailwind, prisma, typescript, type_module)
- NAO exige `.plano/` existir (standalone INFRA-04)
- Para ideias: renomear campos de `melhorias_*` para `ideias_*`, manter mesma logica

**Padrao command file (de melhorias.md):**
- Frontmatter: `name: up:melhorias`, `allowed-tools` com Task e AskUserQuestion
- Corpo XML: `<objective>`, `<execution_context>` com `@~/.claude/up/workflows/melhorias.md`, `<context>`, `<process>`
- Para ideias: espelhar estrutura, trocar melhorias->ideias, 3 auditores->2 agentes+consolidador

**Padrao ajuda.md (linhas 53-58):**
- Secao "Auditoria" ja existe com /up:melhorias
- Adicionar /up:ideias na mesma secao
- Adicionar workflow de ideacao nos fluxos de trabalho comuns

**Switch init em main() (linha 203):**
- Case 'melhorias' ja existe antes do default
- Adicionar case 'ideias' no mesmo bloco
- Atualizar mensagem de erro do default para incluir 'ideias'

## Contexto

@up/bin/up-tools.cjs -- CLI tools, adicionar cmdInitIdeias e case no switch init
@up/commands/melhorias.md -- referencia de padrao de command file standalone
@up/commands/ajuda.md -- referencia de comandos, adicionar /up:ideias
@up/bin/lib/core.cjs -- utilitarios compartilhados (loadConfig, pathExistsInternal, output, error)

## Tarefas

<task id="1" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Adicionar suporte ao subcomando `init ideias` no CLI tools. Duas mudancas necessarias:

**1. No switch `init` dentro de `main()` (~linha 203, apos o case 'melhorias' e antes do `default`):**
Adicionar case:
```javascript
case 'ideias':
  cmdInitIdeias(cwd, raw);
  break;
```

Atualizar a mensagem de erro do `default` para incluir 'ideias' na lista de workflows disponiveis. A lista atualizada deve ser:
`planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso, verificar-trabalho, melhorias, ideias`

**2. Criar funcao `cmdInitIdeias(cwd, raw)` (adicionar IMEDIATAMENTE apos `cmdInitMelhorias`, ~linha 735):**

A funcao e quase identica a `cmdInitMelhorias` (linhas 699-735), com as seguintes diferencas:
- Nome da funcao: `cmdInitIdeias` (nao `cmdInitMelhorias`)
- Campo `ideias_dir` em vez de `melhorias_dir`, com valor `'.plano/ideias'`
- Campo `ideias_exists` em vez de `melhorias_exists`, verificando `pathExistsInternal(cwd, '.plano/ideias')`
- Manter TODOS os outros campos identicos: `planning_exists`, `has_claude_md`, `has_package_json`, `date`, `timestamp`, `commit_docs`, `stack_hints`
- Manter mesma logica de `stackHints` (leitura de package.json com try/catch silencioso)

Implementacao completa da funcao:

```javascript
function cmdInitIdeias(cwd, raw) {
  const config = loadConfig(cwd);
  const now = new Date();

  // Detectar stack hints do projeto para contextualizar analise
  const pkgPath = path.join(cwd, 'package.json');
  let stackHints = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    stackHints = {
      has_react: !!allDeps.react,
      has_next: !!allDeps.next,
      has_vue: !!allDeps.vue,
      has_nuxt: !!allDeps.nuxt,
      has_svelte: !!allDeps.svelte,
      has_tailwind: !!allDeps.tailwindcss,
      has_prisma: !!(allDeps['@prisma/client'] || allDeps.prisma),
      has_typescript: !!(allDeps.typescript || pathExistsInternal(cwd, 'tsconfig.json')),
      type_module: pkg.type === 'module',
    };
  } catch {}

  const result = {
    planning_exists: pathExistsInternal(cwd, '.plano'),
    ideias_dir: '.plano/ideias',
    ideias_exists: pathExistsInternal(cwd, '.plano/ideias'),
    has_claude_md: pathExistsInternal(cwd, 'CLAUDE.md'),
    has_package_json: pathExistsInternal(cwd, 'package.json'),
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    commit_docs: config.commit_docs,
    stack_hints: stackHints,
  };

  output(result, raw);
}
```

**Convencoes a seguir (CONVENTIONS.md):**
- Nome de funcao: `cmdInitIdeias` (camelCase, prefixo `cmd`)
- Chaves de retorno: `snake_case` (planning_exists, ideias_dir, etc.)
- Tratamento de erro: try/catch silencioso para leitura de package.json (retorna {} se falhar)
- Usar `pathExistsInternal` de core.cjs (ja importado)
- Usar `loadConfig`, `output` de core.cjs (ja importado)
- NAO exigir .plano/ ou ROADMAP.md (standalone INFRA-04)
- Separador de secao: usar comentario simples antes da funcao se necessario (estilo UP, nao box-drawing)
</action>
<verify>
<automated>node /home/projects/up-dev-code/up/bin/up-tools.cjs init ideias --cwd /home/projects/up-dev-code 2>&1 | head -20</automated>
</verify>
<done>Comando `up-tools.cjs init ideias` retorna JSON valido com campos planning_exists, ideias_dir, ideias_exists, has_claude_md, has_package_json, date, timestamp, commit_docs, stack_hints. Funciona sem .plano/ideias/ existir (ideias_exists=false quando nao existe). Mensagem de erro do default no switch init inclui 'ideias'.</done>
</task>

<task id="2" type="auto">
<files>up/commands/ideias.md, commands/up/ideias.md</files>
<action>
Criar o command file para /up:ideias em dois locais (fonte canonica + copia raiz). O padrao espelha exatamente melhorias.md mas adaptado para ideias.

**Arquivo: `up/commands/ideias.md`** (fonte canonica):

Frontmatter YAML:
```yaml
---
name: up:ideias
description: Sugestoes de features novas com pesquisa de mercado e analise de codigo
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebSearch
  - WebFetch
  - AskUserQuestion
---
```

NOTA: WebSearch e WebFetch sao incluidos em allowed-tools porque o agente up-pesquisador-mercado precisa deles e o command herda tools para os agentes spawnados.

Corpo com tags XML seguindo padrao dos commands existentes:

```xml
<objective>
Run feature ideation with 2 parallel specialized agents (code analysis + market research), consolidate findings with ICE scoring into a prioritized report with anti-features.

Standalone: works without /up:novo-projeto. Creates .plano/ideias/ automatically if not exists.
Detects project stack and domain to contextualize analysis.

Output: .plano/ideias/RELATORIO.md with suggestions ranked by ICE score (Impact x Confidence x Ease) and mandatory anti-features section.
</objective>

<execution_context>
@~/.claude/up/workflows/ideias.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Standalone mode:** This command does NOT require /up:novo-projeto or .plano/ to exist.
It creates .plano/ideias/ automatically and runs the full ideation pipeline.

**If .plano/ideias/ already exists:** Asks user if they want to overwrite previous ideation or cancel.

**Pipeline:** 2 agents in parallel (analista-codigo + pesquisador-mercado) -> consolidador-ideias -> report
</context>

<process>
Execute the ideias workflow from @~/.claude/up/workflows/ideias.md end-to-end.
Preserve all workflow gates (init, stack detection, agent spawn, consolidation, report presentation).
</process>
```

**Arquivo: `commands/up/ideias.md`** (copia raiz):
Conteudo IDENTICO ao arquivo em `up/commands/ideias.md`. Copiar byte-a-byte.

**Convencoes a seguir (CONVENTIONS.md):**
- `name: up:ideias` (prefixo up: com kebab-case)
- `allowed-tools` como array YAML (nao string separada por virgula -- isso e para agentes)
- Task incluido em allowed-tools (necessario para spawn de agentes)
- WebSearch e WebFetch incluidos (pesquisador-mercado precisa)
- AskUserQuestion incluido (necessario para confirmacao de sobrescrita)
- Objetivo em ingles (padrao dos commands existentes)
- Sem `argument-hint` significativo (comando nao recebe argumentos obrigatorios)
</action>
<verify>
<automated>test -f /home/projects/up-dev-code/up/commands/ideias.md && test -f /home/projects/up-dev-code/commands/up/ideias.md && grep -c "name: up:ideias" /home/projects/up-dev-code/up/commands/ideias.md && diff /home/projects/up-dev-code/up/commands/ideias.md /home/projects/up-dev-code/commands/up/ideias.md && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>Arquivo up/commands/ideias.md existe com frontmatter valido (name: up:ideias, allowed-tools com Task, WebSearch, WebFetch), referencia workflow ideias.md no execution_context. Copia raiz commands/up/ideias.md e identica a fonte canonica.</done>
</task>

<task id="3" type="auto">
<files>up/commands/ajuda.md</files>
<action>
Adicionar /up:ideias na referencia de comandos em ajuda.md. Duas modificacoes:

**1. Na secao "Auditoria" (linha ~56-58), adicionar /up:ideias APOS /up:melhorias na mesma tabela:**

A tabela de Auditoria atualizada deve ficar:
```markdown
### Auditoria

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:melhorias` | Auditoria completa do codebase (UX, performance, modernidade) | `/up:melhorias` |
| `/up:ideias` | Sugestoes de features novas com pesquisa de mercado | `/up:ideias` |
```

**2. Na secao "Fluxos de Trabalho Comuns", subsecao "Auditoria de Codebase" (linhas ~126-129), adicionar workflow de ideacao APOS o workflow de melhorias:**

A subsecao atualizada deve ficar:
```markdown
### Auditoria de Codebase
```
/up:melhorias   # Auditoria completa (standalone, nao requer /up:novo-projeto)
```
Resultado em .plano/melhorias/RELATORIO.md com sugestoes priorizadas.

### Ideacao de Features
```
/up:ideias      # Sugestoes de features novas (standalone, nao requer /up:novo-projeto)
```
Resultado em .plano/ideias/RELATORIO.md com ranking ICE e anti-features.
```

**NAO alterar nenhum conteudo existente.** Apenas adicionar as novas linhas nos locais indicados.
</action>
<verify>
<automated>grep -c "up:ideias" /home/projects/up-dev-code/up/commands/ajuda.md</automated>
</verify>
<done>Comando /up:ideias aparece na referencia de ajuda: (1) na secao Auditoria com descricao e uso, (2) nos fluxos de trabalho comuns com exemplo de workflow de ideacao. Grep retorna pelo menos 2 ocorrencias.</done>
</task>

## Criterios de Sucesso

- [ ] `up-tools.cjs init ideias` retorna JSON valido com stack_hints, planning_exists, ideias_dir, ideias_exists
- [ ] `up-tools.cjs init ideias` funciona sem .plano/ existir (standalone)
- [ ] up/commands/ideias.md existe com frontmatter correto e referencia ao workflow ideias.md
- [ ] commands/up/ideias.md e copia identica da fonte canonica
- [ ] /up:ajuda lista o novo comando /up:ideias na secao Auditoria e nos fluxos comuns
